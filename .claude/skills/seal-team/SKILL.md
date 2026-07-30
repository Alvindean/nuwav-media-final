---
name: seal-team
description: >
  Capability acquisition unit. When a job needs a skill nobody on the team has yet, this
  goes and gets it — recon the sources, extract the real technique, build a working skill
  or artifact, prove it against reality, and loop until a Commander signs it off. Use
  IMMEDIATELY when the user says "seal team", "we don't have that", "figure out how to",
  "go learn how", "find out how to do X", "build the skill for", "we need a skill that",
  "nobody knows how to do this", or any time a workflow hits a capability gap and the
  answer would otherwise be "you'd need to go get X". Also fires automatically when any
  other skill in the fleet reports a missing capability rather than a missing decision.
  The unit does NOT ask the user to go acquire knowledge that is publicly available —
  live APIs, official docs, source code, video transcripts and forums are all reachable,
  and the unit is expected to reach them. It escalates only for things money, credentials
  or a human decision can buy, and never for information.
  Hard rules: no artifact ships without a Proof run; the Commander gate is not optional;
  three failed loops escalate to a human instead of a fourth.
---

# SEAL TEAM

**A capability gap is a mission, not a blocker.**

The team's default failure mode is handing the user a shopping list — "you'd need to learn
CapCut", "you'd need a Make scenario", "you'd need to know how X works". That is the thing
this unit exists to stop. If the knowledge is public, the unit goes and gets it and comes
back with something that runs.

Escalate for **money, credentials, and decisions**. Never for **information**.

---

## The unit

| Role | Owns | Hands off |
|---|---|---|
| **Commander** | The objective, the definition of done, the gate, the loop counter | Signed-off capability, or an escalation |
| **Recon** | Finding the sources — and ranking them by how close they are to truth | A source list with tiers |
| **Intel** | Extracting the actual technique, resolving contradictions between sources | Verified findings with citations |
| **Breacher** | Building the artifact — a skill, a blueprint, a script, a settings pack | The artifact |
| **Proof** | Testing it against the real system. Adversarial: tries to make it fail | Pass / fail with evidence |

The Commander is the only role that can declare the mission done.

---

## Step 0 — the Commander writes the definition of done

Before anyone searches anything. **It has to be testable.**

| Bad | Good |
|---|---|
| "Understand CapCut editing" | "A settings pack that produces a named transition, with exact keyframe values, that an editor can execute without guessing" |
| "Figure out Make" | "A blueprint JSON that passes `validate_blueprint_schema` and whose module names are verified against `app-modules_list`" |
| "Learn ElevenLabs" | "A settings block that produces a 60-second read the user approves on the first or second try" |

If the definition of done can't be tested, the mission is not defined yet. Go back.

---

## Step 1 — Recon: the source hierarchy

Sources are not equal. Work top down, and stop as soon as a higher tier answers it.

### Tier 1 — the live system itself *(almost always skipped, almost always best)*

**Ask the actual thing.** MCP tools, APIs, CLI `--help`, introspection endpoints, schema
dumps, `models_explore`, `app-module_get`, `--dry-run`.

This tier is first because it is the only one that is *current and specific to this
account*. Two live examples from this repo's own build:

- Third-party blogs disagreed on Higgsfield's model line-up. `models_explore` returned the
  real catalogue, with the real parameters, for this plan.
- Every Make tutorial describes the YouTube upload module. None of them mention that
  `containsSyntheticMedia` is a **required** field — which matters enormously for an
  AI-assisted channel. `app-module_get` said so in one call.

**If a live system can answer the question, no amount of reading beats asking it.**

### Tier 2 — official documentation and source code
Vendor docs, API references, and the repo itself. Code is truth; docs are intent. When
they disagree, believe the code.

```bash
# Read the actual implementation, not a description of it
gh api repos/OWNER/REPO/contents/PATH --jq '.content' | base64 -d
git clone --depth 1 https://github.com/OWNER/REPO && rg "the_thing" -A 20
```

### Tier 3 — practitioner sources
GitHub issues (where the real edge cases live), Stack Overflow, subreddits where the
practitioners are — r/editing, r/VideoEditing, r/automation. Search the *issue tracker*
before the blog.

### Tier 4 — video and course material
YouTube tutorials are often the only place a craft technique is written down at all.
Pull the transcript, don't watch it:

```bash
# Auto-captions to text, no download of the video itself
yt-dlp --skip-download --write-auto-sub --sub-lang en --sub-format vtt \
       --convert-subs srt -o "%(title)s.%(ext)s" "URL"

# A whole channel's transcripts, for pattern-finding across many tutorials
yt-dlp --skip-download --write-auto-sub --sub-lang en --flat-playlist "CHANNEL_URL"
```

### Tier 5 — blogs and aggregators
Last. SEO content farms rewrite each other, so three sources agreeing means nothing —
they may all be one source. Use these for orientation, never for a number.

> **Recon's deliverable:** a source list with each source tagged by tier, plus an explicit
> note on which questions are still unanswered.

---

## Step 2 — Intel: extract and stress the findings

Intel turns sources into **findings**. A finding is a claim plus its citation plus its tier.

Three jobs:

1. **Resolve contradictions.** When sources disagree, the higher tier wins. If two Tier 1
   sources disagree, test both.
2. **Label the estimates.** Anything not from Tier 1 or 2 gets marked as an estimate. The
   difference between "Kling costs 14 credits" and "a blog says Kling costs about 14
   credits" is the difference between a plan and a guess.
3. **Name the gaps.** What did nobody answer? That is Proof's test list.

> **Intel's deliverable:** findings with citations and tiers, contradictions resolved,
> estimates labelled, open questions listed.

---

## Step 3 — Breacher: build the artifact

The output is never a summary. It is a thing that runs.

| Gap type | What ships |
|---|---|
| A missing automation | A validated blueprint / config, ready to import |
| A missing craft skill | A settings pack with exact values, not principles |
| A missing integration | A working script plus its auth setup steps |
| A missing body of knowledge | A `SKILL.md` with references, written to be executed |

**Specificity is the whole job.** "Use a slow push" is a summary. "Scale 100% → 106% across
the shot, linear easing, never past 110%" is an artifact. If a reader has to make a
judgment call the research already answered, the Breacher didn't finish.

---

## Step 4 — Proof: try to break it

Proof is adversarial. Its job is to **fail the artifact**, not to confirm it.

| Artifact | The proof run |
|---|---|
| Blueprint / config | Run it through the real validator. Verify every identifier against the live system. |
| Script | Execute it. On real input. |
| Settings pack | Apply the settings and look at the result. |
| A skill document | Have someone who wasn't in the room follow it literally and see what breaks. |
| A cost model | Run one real job and compare actual spend to the projection. |

**A Proof run that can't be executed is not a pass — it's an unverified claim, and it ships
labelled as one.** Never launder an untested artifact into a confident one.

> **Proof's deliverable:** pass/fail with the evidence. Not an opinion.

---

## Step 5 — the Commander's gate

The Commander checks four things:

1. Does the artifact meet the **definition of done** written in Step 0 — the original one,
   not a softened version?
2. Did **Proof actually run**, and is the evidence attached?
3. Is every number **traced to its tier**, with estimates labelled as estimates?
4. Could someone who wasn't here **execute this** without asking a question the research
   already answered?

**Pass** → the capability is live. Register it, and tell the user what they can now do that
they couldn't before.

**Fail** → back to whichever step broke, carrying what was learned. Increment the loop
counter.

---

## The loop, and how it terminates

```
Commander defines done
      ↓
   Recon → Intel → Breacher → Proof
      ↓
  Commander gate ── PASS ─→ ship
      │
     FAIL
      ↓
  loop += 1 ─→ back to the step that broke
```

**Three strikes.** After three failed loops the Commander stops and escalates to a human
with: what was tried, what was learned, precisely where it breaks, and the two or three
options for getting past it.

A fourth loop is how an agent burns a day proving it can't do something. **Not looping
forever is a feature.** The team is measured on capabilities delivered, not effort spent.

---

## What escalates, and what never does

**Escalate — a human has to decide or pay:**
- Money: a subscription, a licence, credits, a contractor
- Credentials: an OAuth grant, an API key, an account only they can create
- Access: an approval queue, a waitlist, a verification process
- Judgment: brand, legal exposure, spend, anything irreversible
- A genuine dead end, after three loops, with the options laid out

**Never escalate — go and get it:**
- How an API works
- How a tool is operated
- What the settings should be
- What the best practice is
- What something costs *(ask the live system)*
- Anything that exists in docs, code, a transcript, a forum, or a schema

> The test: **"is this information, or is this a decision?"**
> Information is the unit's job. Decisions belong to the user.

---

## Registering the capability

A passed mission produces a real artifact in the repo — a skill directory, a blueprint, a
script. Then tell the user in one line what changed:

> *"We can now build Make scenarios directly — validated blueprint at
> `make-scenario-builder/blueprints/`. You still need to authorise the YouTube connection,
> because that's a credential, not information."*

That last clause is the point of the whole unit: it separates what was actually blocking
from what only looked like it was.

---

## Missions completed

| Gap | Artifact | Proof |
|---|---|---|
| No Make.com YouTube publish pipeline | `make-scenario-builder` + validated blueprint | Passed `validate_blueprint_schema`; module names verified against `app-modules_list` |
| No CapCut craft knowledge on the team | `capcut-mastery` | Settings packs with exact values; pending a real edit run |
