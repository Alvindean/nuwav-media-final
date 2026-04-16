/**
 * Deal Scout API Worker
 *
 * Endpoints (v0.1):
 *   GET  /health
 *   POST /waitlist           — public waitlist capture
 *   GET  /leads              — (auth) agent's top-scoring leads
 *   GET  /properties/:id     — (auth) property + all signals
 *
 * Scheduled:
 *   cron handler dispatches per-source ingest based on cron expression.
 *
 * Legal posture: green-tier sources only. Experimental sources live under
 * src/sources/_experimental and are gated behind ENABLE_EXPERIMENTAL_SOURCES
 * AND a per-source secret; see STRATEGY.md §2.
 */

import { ingestHudReo } from "./sources/hud-reo";
import { ingestFsboRss } from "./sources/fsbo-rss";
import { ingestCountyRecords } from "./sources/county-records";
import { ingestForeclosureAuctions } from "./sources/foreclosure-auctions";
import { recomputeLeadsForProperty } from "./scoring";

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  SNAPSHOTS: R2Bucket;
  DEAL_SCOUT_ENV: string;
  ENABLE_EXPERIMENTAL_SOURCES: string;
  ANTHROPIC_API_KEY?: string;
  RESEND_API_KEY?: string;
  ATTOM_API_KEY?: string;
  JWT_SIGNING_SECRET?: string;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Max-Age": "86400"
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}

export default {
  // ---------------- HTTP ----------------
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(req.url);
    const route = `${req.method} ${url.pathname}`;

    try {
      if (route === "GET /health") {
        return json({ ok: true, env: env.DEAL_SCOUT_ENV, ts: Date.now() });
      }

      if (route === "POST /waitlist") {
        return await handleWaitlist(req, env);
      }

      if (route === "GET /leads") {
        return await handleListLeads(req, env);
      }

      const propMatch = url.pathname.match(/^\/properties\/([a-zA-Z0-9_-]+)$/);
      if (req.method === "GET" && propMatch) {
        return await handleGetProperty(propMatch[1]!, env);
      }

      // Dev-only manual ingest trigger. Requires DEAL_SCOUT_ENV != "prod".
      if (route === "POST /_ingest/run" && env.DEAL_SCOUT_ENV !== "prod") {
        const body = (await req.json().catch(() => ({}))) as { source?: string };
        const sources = body.source ? [body.source] : ["hud_reo", "fsbo_rss"];
        const results = await runIngest(sources, env, ctx);
        return json({ ok: true, results });
      }

      return json({ error: "not_found", route }, 404);
    } catch (err: any) {
      console.error("[deal-scout] unhandled error", err);
      return json({ error: "internal_error", message: err?.message }, 500);
    }
  },

  // ---------------- Scheduled ingest ----------------
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Dispatch by cron expression (see wrangler.toml [triggers]).
    let sources: string[];
    switch (event.cron) {
      case "*/15 * * * *":
        sources = ["foreclosure_auctions", "expired_listings_partner"];
        break;
      case "0 */6 * * *":
        sources = ["hud_reo", "fannie_reo", "freddie_reo"];
        break;
      case "0 4 * * *":
        sources = ["county_nod", "county_tax_delinquent", "fsbo_rss"];
        break;
      default:
        sources = ["hud_reo"];
    }
    ctx.waitUntil(runIngest(sources, env, ctx).then(() => undefined));
  }
};

// -----------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------

async function handleWaitlist(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; market?: string; role?: string }
    | null;
  if (!body || !body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) {
    return json({ error: "invalid_email" }, 400);
  }
  const ip = req.headers.get("cf-connecting-ip") || "";
  const ipHash = await sha256(ip + "::" + (env.JWT_SIGNING_SECRET || ""));

  await env.DB.prepare(
    `INSERT INTO waitlist (email, market, role, source, ip_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      body.email.toLowerCase().trim(),
      body.market?.trim() || null,
      body.role || null,
      req.headers.get("referer") || null,
      ipHash,
      Date.now()
    )
    .run();

  return json({ ok: true });
}

async function handleListLeads(req: Request, env: Env): Promise<Response> {
  const agentId = await requireAgent(req, env);
  if (!agentId) return json({ error: "unauthorized" }, 401);

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const state = url.searchParams.get("state");

  const query = state
    ? `SELECT l.*, p.address_line1, p.city, p.state AS st, p.zip, p.estimated_value,
              p.estimated_equity_pct
         FROM leads l
         JOIN properties p ON p.id = l.property_id
        WHERE l.agent_id = ? AND l.state = ?
        ORDER BY l.score DESC
        LIMIT ?`
    : `SELECT l.*, p.address_line1, p.city, p.state AS st, p.zip, p.estimated_value,
              p.estimated_equity_pct
         FROM leads l
         JOIN properties p ON p.id = l.property_id
        WHERE l.agent_id = ?
        ORDER BY l.score DESC
        LIMIT ?`;

  const stmt = state
    ? env.DB.prepare(query).bind(agentId, state, limit)
    : env.DB.prepare(query).bind(agentId, limit);
  const { results } = await stmt.all();
  return json({ leads: results });
}

async function handleGetProperty(id: string, env: Env): Promise<Response> {
  const prop = await env.DB.prepare(`SELECT * FROM properties WHERE id = ?`)
    .bind(id)
    .first();
  if (!prop) return json({ error: "not_found" }, 404);

  const { results: signals } = await env.DB.prepare(
    `SELECT signal_type, source, severity, observed_at, ingested_at, active
       FROM signals WHERE property_id = ? ORDER BY observed_at DESC`
  )
    .bind(id)
    .all();

  return json({ property: prop, signals });
}

// -----------------------------------------------------------------------
// Ingest dispatch
// -----------------------------------------------------------------------

async function runIngest(sources: string[], env: Env, ctx: ExecutionContext) {
  const results: Record<string, unknown> = {};
  for (const src of sources) {
    const started = Date.now();
    try {
      let summary;
      switch (src) {
        case "hud_reo":
          summary = await ingestHudReo(env);
          break;
        case "fsbo_rss":
          summary = await ingestFsboRss(env);
          break;
        case "county_nod":
        case "county_tax_delinquent":
          summary = await ingestCountyRecords(env, src);
          break;
        case "foreclosure_auctions":
          summary = await ingestForeclosureAuctions(env);
          break;
        default:
          // Unknown source — log and skip rather than throw.
          summary = { skipped: true, reason: `unknown source: ${src}` };
      }

      // Recompute leads for properties touched in this run, if the connector
      // returned them.
      if (summary && typeof summary === "object" && "touchedPropertyIds" in summary) {
        const ids = (summary as { touchedPropertyIds?: string[] })
          .touchedPropertyIds;
        if (Array.isArray(ids)) {
          for (const pid of ids) {
            await recomputeLeadsForProperty(env.DB, pid);
          }
        }
      }

      await logRun(env, src, "ok", summary, started);
      results[src] = summary;
    } catch (err: any) {
      console.error(`[deal-scout] ingest ${src} failed`, err);
      await logRun(env, src, "error", { error: err?.message }, started);
      results[src] = { error: err?.message };
    }
  }
  return results;
}

async function logRun(
  env: Env,
  source: string,
  status: string,
  summary: any,
  started: number
) {
  try {
    await env.DB.prepare(
      `INSERT INTO ingest_runs
         (source, status, items_seen, items_new, items_updated, bytes_fetched,
          snapshot_key, error_message, started_at, finished_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        source,
        status,
        summary?.itemsSeen ?? 0,
        summary?.itemsNew ?? 0,
        summary?.itemsUpdated ?? 0,
        summary?.bytesFetched ?? 0,
        summary?.snapshotKey ?? null,
        summary?.error ?? null,
        started,
        Date.now()
      )
      .run();
  } catch (err) {
    console.error("[deal-scout] failed to log ingest run", err);
  }
}

// -----------------------------------------------------------------------
// Auth stub
// -----------------------------------------------------------------------

async function requireAgent(req: Request, env: Env): Promise<string | null> {
  // v0.1: stubbed. Replace with real JWT validation against JWT_SIGNING_SECRET.
  // For now we accept `X-Agent-Id: <uuid>` in dev only.
  if (env.DEAL_SCOUT_ENV === "dev") {
    return req.headers.get("X-Agent-Id");
  }
  return null;
}

async function sha256(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
