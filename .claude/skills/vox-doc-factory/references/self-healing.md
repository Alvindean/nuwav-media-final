# Self-Healing and Self-Learning

Two separate systems. Don't confuse them.

- **Self-healing** = recovering *inside* a run. A stage fails, the pipeline degrades
  gracefully instead of stopping.
- **Self-learning** = getting better *across* runs. Every episode leaves the next one a rule.

---

# PART 1 — SELF-HEALING

## The universal ladder

Every failure walks the same four rungs, in order. Never skip to the bottom, never stop
above it.

1. **Retry the same thing** — max 2. Most generation failures are stochastic.
2. **Degrade the method** — a cheaper model, a simpler shot, a smaller batch.
3. **Substitute** — replace the thing with something the pipeline already has.
4. **Escalate** — stop, report precisely what broke and what was tried.

**The rule that makes this safe: a degraded output must be labelled degraded.** Never let a
fallback silently masquerade as the intended result. A skipped shot that nobody mentions is
worse than a failed run.

## Per-stage recovery

| Stage | Failure | 1. Retry | 2. Degrade | 3. Substitute | 4. Escalate |
|---|---|---|---|---|---|
| **2 Research** | A claim has no source | Re-search with different terms | Search a lower source tier | **Cut the claim** | Only if it's the thesis |
| **3 Script** | Under 11:00 | — | — | Add a sub-question from `research.md`, or deepen an act | If the topic genuinely has no more in it, say so — that's a topic problem |
| **4 Narration** | Mispronunciation | Re-render the sentence | Spell phonetically (`Hormuz` → `Hor-mooz`) | Rewrite the sentence to avoid the word | Never ship a wrong pronunciation |
| **4 Narration** | API 422 / model rejected | — | Fall back `eleven_v3` → `eleven_multilingual_v2` | — | Missing/invalid API key |
| **4 Narration** | Tone drifts across the read | Re-render the drifting chunk | Switch the whole episode to `multilingual_v2` at 0.50 | — | — |
| **5 Style Key** | Six frames don't read as one show | Re-render the odd frame | — | **Fix the Style Key, not the frame** | Three failed locks → the key is too vague; rewrite it |
| **7 Generation** | A still comes back wrong | Re-render (max 2) | Drop `nano_banana_pro` → `nano_banana_2` | Reuse a library plate | — |
| **7 Generation** | A hero clip is unusable | Re-render (max 2) | `kling3_0` → `kling3_0_turbo` | **Convert to a still with a camera move** | — |
| **7 Generation** | Out of credits | — | — | Finish the episode entirely on stills | Stop and report the shortfall |
| **8 Assembly** | A source file is missing | — | — | `assemble.py` skips it, logs it, **exits 2** | Never publish a run that exited 2 |
| **8 Assembly** | ffmpeg filter error | Retry once | `--no-grain` | — | Report the exact filter chain |
| **9 Thumbnail** | Face drift / stray text | Re-render same prompt (max 2) | — | Use a different framework | Never ship a failed post-render check |
| **9 Publish** | YouTube quota / auth expiry | Retry once after 10 min | — | Leave in `_READY_TO_UPLOAD/`, notify | Auth expired → needs a human |

## Credit-aware degradation

When projected spend exceeds the ceiling, degrade **before** generating, not after:

```
over budget by ...   do this
  < 10%              drop 2 hero clips to stills
  10-25%             all hero clips -> kling3_0_turbo; drop 4 to stills
  25-50%             hero budget to 5 clips; increase library reuse
  > 50%              stop. The shot list is wrong, not the budget.
```

A push-in on a good still reads better than a mediocre generated clip. Degrading here costs
almost nothing in quality — which is exactly why it's the first lever.

## Never self-heal these

Some failures must stop the run. Healing them would mean shipping something false or unsafe.

- **A fact with no source.** Cut it or stop. Never soften it into vagueness.
- **Runtime under 11:00.** Never pad with slow shots to clear the floor.
- **A failed Retention Gate.** Never publish because the deadline is close.
- **A missing `containsSyntheticMedia` declaration.** Never omit it to avoid a question.
- **A publish with placeholder connections.** Never guess an ID.

---

# PART 2 — SELF-LEARNING

## The Playbook

`PLAYBOOK.md` lives at the channel root and is **read at the start of every run, before
Stage 1**. It is the accumulated memory of the channel.

A rule only enters the Playbook with **evidence attached**. Opinions don't qualify.

```md
## R007 — Open on a number, not a scene
Evidence: EP04 (number open) held 78% at 0:15. EP05 (scene open) held 61%.
Same length, same voice, adjacent weeks.
Applies: Stage 3, cold open.
Added: EP05 review. Confirmed: EP07, EP09.
```

## The review, 72 hours after publish

Long enough for the retention curve to stabilise, early enough to change the next episode.

1. **Pull** — retention curve, average view duration as a % of runtime, CTR, and the
   **30-second retention number**. That last one predicts everything else.
2. **Locate** — take the single biggest drop over 5 percentage points. Convert the timestamp
   to a line in `script.md` and a shot in `shots.json`.
3. **Diagnose** — what was actually happening there? Narration, picture, or pace?
4. **Write ONE rule.** One. A review that produces six rules produces zero followed rules.
5. **Log** the episode's real numbers to the ledger — runtime, credits spent, CTR, AVD.

## Rule lifecycle

| State | Meaning |
|---|---|
| **Proposed** | Observed once. Applied, but flagged as unproven. |
| **Confirmed** | Held across 3+ episodes. Treated as a hard rule. |
| **Contested** | A later episode contradicted it. Test deliberately next run. |
| **Retired** | Failed twice after confirmation. Struck, with the reason kept. |

**Keep retired rules with their reasons.** Otherwise the same bad idea gets rediscovered
every few months.

## Keeping the Playbook usable

**Hard cap: 25 active rules.** A file nobody can hold in their head is a file nobody follows.

At 25, the next rule forces a retirement — the weakest-evidence rule goes. This constraint is
the point: it forces the channel to keep only what's actually load-bearing.

Group by stage so each role reads only its own section:

```
PLAYBOOK.md
  ## Stage 3 — Script       (max 8 rules)
  ## Stage 6 — Shot design  (max 6)
  ## Stage 8 — Edit         (max 6)
  ## Stage 9 — Packaging    (max 5)
  ## Retired                (unlimited — history, not instructions)
```

## What learning is not

- **Not** rewriting the pipeline every week. The stages are stable; the rules inside them move.
- **Not** chasing one episode's noise. A single data point is Proposed, never Confirmed.
- **Not** accumulating trivia. If a rule wouldn't change a decision, it isn't a rule.
- **Not** silent. Every rule change is reported in the build report, so the human can veto it.

## The compounding effect

Episode 1 has no Playbook and will be the worst one. That's expected and it's fine.

By episode 10 there should be 8–12 confirmed rules encoding what this specific audience
responds to — which is knowledge no generic best-practice document contains, because it's
about *this* channel. That's the actual asset being built here. The videos are the output;
the Playbook is the compounding part.
