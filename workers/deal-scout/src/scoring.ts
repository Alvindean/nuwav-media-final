/**
 * Deal scoring (v1, heuristic).
 *
 * See docs/deal-scout/STRATEGY.md §8 for the full rubric.
 *
 * score = base + Σ(signal weights, with high-equity / underpriced replacement
 *         rules) + stacking_bonus − staleness_penalty
 * Clamped to 0–100.
 */

const BASE = 15;

// Replacement groups — only the highest weight in a group counts.
type WeightRule = { weight: number; group?: string };

const RULES: Record<string, WeightRule> = {
  expired_listing: { weight: 25 },
  fsbo: { weight: 15 },
  pre_foreclosure: { weight: 30 },
  foreclosure_auction: { weight: 32 },
  probate: { weight: 28 },
  tax_delinquent: { weight: 22 },
  absentee_owner: { weight: 10 },
  vacancy: { weight: 12 },
  code_violation: { weight: 15 },
  eviction_filing: { weight: 12 },
  days_on_market_long: { weight: 8 },

  // Equity is a replacement group — the bigger tier supersedes the smaller.
  high_equity_50: { weight: 15, group: "equity" },
  high_equity_80: { weight: 25, group: "equity" },

  // Underpriced vs comps — replacement group.
  priced_under_comp_8: { weight: 20, group: "underpriced" },
  priced_under_comp_15: { weight: 30, group: "underpriced" }
};

const STACKING_BONUS: Record<number, number> = { 2: 10, 3: 25, 4: 40 };

export interface SignalRow {
  signal_type: string;
  severity: number | null;
  observed_at: number;
  active: number;
}

export function computeScore(signals: SignalRow[], now = Date.now()): {
  score: number;
  activeCount: number;
  types: string[];
} {
  const active = signals.filter((s) => s.active === 1);
  const byType = new Map<string, SignalRow>();
  for (const s of active) {
    const existing = byType.get(s.signal_type);
    if (!existing || s.observed_at > existing.observed_at) {
      byType.set(s.signal_type, s);
    }
  }

  let sum = BASE;

  // Apply weights with replacement groups.
  const groupBest = new Map<string, number>();
  for (const [type, s] of byType) {
    const rule = RULES[type];
    if (!rule) continue;
    const severity = clamp(s.severity ?? 1, 0, 1);
    const contribution = rule.weight * severity;
    if (rule.group) {
      const cur = groupBest.get(rule.group) ?? 0;
      if (contribution > cur) groupBest.set(rule.group, contribution);
    } else {
      sum += contribution;
    }
  }
  for (const v of groupBest.values()) sum += v;

  // Stacking bonus, based on number of distinct *scoring* signal types.
  const scoringTypes = [...byType.keys()].filter((t) => RULES[t]);
  const stack = scoringTypes.length;
  if (stack >= 4) sum += STACKING_BONUS[4]!;
  else if (stack === 3) sum += STACKING_BONUS[3]!;
  else if (stack === 2) sum += STACKING_BONUS[2]!;

  // Staleness penalty, based on freshest signal in the set.
  if (byType.size > 0) {
    const freshest = Math.max(...[...byType.values()].map((s) => s.observed_at));
    const ageDays = Math.max(0, (now - freshest) / (1000 * 60 * 60 * 24));
    if (ageDays > 90) sum -= 30;
    else if (ageDays > 45) sum -= 15;
    else if (ageDays > 14) sum -= 5;
  }

  return {
    score: Math.round(clamp(sum, 0, 100)),
    activeCount: byType.size,
    types: [...byType.keys()]
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * After new signals land for a property, recompute any `leads` rows that
 * reference it. v0.1 just refreshes the score/signal summary for every
 * existing (agent, property) pair. Later we'll match new properties to
 * saved searches and create lead rows on the fly.
 */
export async function recomputeLeadsForProperty(
  db: D1Database,
  propertyId: string
): Promise<void> {
  const { results: signals } = await db
    .prepare(
      `SELECT signal_type, severity, observed_at, active
         FROM signals WHERE property_id = ?`
    )
    .bind(propertyId)
    .all<SignalRow>();

  const { score, activeCount, types } = computeScore(signals);
  const now = Date.now();

  await db
    .prepare(
      `UPDATE leads
          SET score = ?, signal_count = ?, signal_types = ?, updated_at = ?
        WHERE property_id = ?`
    )
    .bind(score, activeCount, types.join(","), now, propertyId)
    .run();
}
