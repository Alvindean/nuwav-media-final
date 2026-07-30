# Stack Checklist — what we have, what's missing

Verified 2026-07-30 against live accounts where an API was reachable.

---

## Confirmed in place

| Tool | Status | Notes |
|---|---|---|
| **Higgsfield** | ✅ Ultra plan, **2,879.2 credits** | Verified via `balance`. Stills + hero motion engine. |
| **ElevenLabs Pro** | ✅ | 500k chars/month. Roughly 220k used at 3 episodes/week including pickups. |
| **CapCut Pro** | ✅ | Assembly, transitions, grade, captions, export. |
| **Google Flow** | ✅ | Route the one expensive Veo hero shot here instead of burning 40–70 Higgsfield credits. |
| **Google Drive** | ✅ | Asset store and the upload trigger folder. |
| **Make.com** | ✅ **Core plan, 10,000 ops/month** | Verified. Publish scenario is ~300 ops/month. Not a constraint. |
| **Google account in Make** | ✅ Both `thealvindean@` and `alvindean7@` connected | |
| **Topic selection** | ✅ | The existing profitability system feeds Stage 1. |

---

## Gaps the team closed itself

These were on the "ask Alvin" list. They aren't any more — `seal-team` acquired them.

| Was | Now |
|---|---|
| "We need a Make scenario for publishing" | **Built.** `make-scenario-builder/blueprints/vox-doc-youtube-publish.json` — passes Make's schema validator, all module names verified against the live app catalogue. |
| "The team needs to know CapCut properly" | **Built.** `capcut-mastery` — two doctrines (viral / cinematic) with exact keyframe values, speed-curve shapes, easing rules and blend modes. |
| "What are the right ElevenLabs settings" | **Answered.** `voice-spec.md`, with the voice pick and the settings block. |
| "Which Higgsfield models, at what cost" | **Answered.** `model-routing.md`, read from the live model catalogue. |

**One thing the research surfaced that no tutorial mentions:** Make's YouTube `uploadVideo`
module has a **required** `containsSyntheticMedia` field. For a channel with AI-generated
visuals that must be `true`. The blueprint ships with it set correctly — it's the live
enforcement risk for this exact kind of channel, and declaring it honestly costs nothing.

---

## Blocking gaps — needed before episode 1 ships

### 1. Authorise the YouTube connection in Make ⚠️ **credential, not information**
Verified: Make has Facebook, Google, OpenAI, Printify, TikTok, Hunter and PhantomBuster
connections. **No YouTube connection exists**, and only you can grant it.

The blueprint is built and waiting on the connection ID. Add a YouTube module in Make,
click *Create a connection*, sign in with Google — a couple of minutes.

**Watch the publishing-status trap:** if you go the own-credentials route, a Google Cloud
project left in **Testing** status forces re-authorisation **every week**, which will
silently break a hands-off pipeline. Set it to **In production**. Full setup steps,
including the exact scopes and redirect URI, are in `make-scenario-builder/SKILL.md`.

**Needed from you:** which YouTube channel is this publishing to?

### 2. Music and SFX licence ⚠️ **hard blocker**
A monetised channel cannot use unlicensed music, and YouTube's Content ID will find it.
- **Epidemic Sound** — ~$15–20/mo personal, ~$50/mo commercial. Best library for this genre.
- **Artlist** — ~$17–25/mo, includes SFX.
- **Musicbed** — premium, more expensive, better for prestige.

*Recommendation: **Epidemic Sound**. Deepest documentary-score catalogue and its channel
whitelisting is the most reliable of the three.*
**Needed:** do we have one of these already?

### 3. Archival and stock imagery ⚠️
AI cannot generate a real historical photograph of a real event, and pretending otherwise
is both a fact problem and a credibility problem.

**Free and legitimate — start here, this covers most episodes:**
- Library of Congress (public domain)
- US National Archives (public domain)
- NASA Image Library (public domain)
- Wikimedia Commons (check each licence)
- Internet Archive / Prelinger Archives (public-domain film)
- Unsplash / Pexels (modern photography, permissive)

**Paid, if a specific event needs it:**
- Storyblocks — ~$30/mo unlimited, good enough for b-roll
- Getty / AP Archive — per-clip, expensive, only for a specific irreplaceable shot

*Recommendation: run on the free public-domain sources first. Add Storyblocks only if
three consecutive episodes hit a wall.*

### 4. Google Earth Studio access ⚠️ **apply now — it takes days**
Free, but requires Google approval and the turnaround is not instant. This is the tool
that produces the Vox map zoom, and there is no equivalent substitute.
*Apply at earth.google.com/studio before anything else on this list.*

---

## Non-blocking, worth setting up

| Item | Cost | Why |
|---|---|---|
| **Flourish** account | Free tier | Animated charts. The free tier is genuinely sufficient. |
| **Fonts** | Free | One grotesque family, two weights. Inter, Söhne, or National. Confirm the licence covers video. |
| **Google Sheets episode log** | Free | The credit ledger and the retention log live here. |
| **Whisper** | Free (local) | Word-level timestamps for `vo_timing.json`. Already in the CapCut pipeline. |
| **Channel identity** | — | Name, logo sting, colour palette, thumbnail template. Needed before episode 1. |

---

## Open questions for Alvin

Every one of these is a **decision or a credential**. None of them is information — if it
were, `seal-team` would have gone and got it instead of asking.

1. **Which YouTube channel** does this publish to? *(credential — only you can authorise it)*
2. **Do we have a music licence** — Epidemic Sound, Artlist, or anything else? *(money)*
3. **Who assembles the CapCut edit?** Recommendation: the hybrid — see below. *(decision)*
4. **Male or female narrator?** Recommendation: Adam, male, conversational. *(taste)*
5. **2 or 3 episodes a week at launch?** Recommendation: 2, moving to 3 once the ledger
   from episodes 1–2 shows the real burn. *(spend)*
6. **Channel name, logo and brand colours** — needed to lock the Style Key. *(brand)*

---

## The honest constraint: CapCut assembly is not hands-off

Everything else in this pipeline runs unattended. Stage 8 does not.

A 15-minute timeline is roughly **200 shots**, each needing keyframed camera moves,
transition placement and cut timing against the VO. CapCut Pro has no API and no scripting
interface, so a human has to build that timeline. Realistically **2–4 hours per episode**
once the template pack exists — call it 6–8 hours a week at 2 episodes.

There are three ways to close that gap:

| Option | What it costs | What you get |
|---|---|---|
| **A. Human editor** | ~$150–300/episode, or your own 2–4 hours | Best quality. CapCut's real strengths — the camera-angle transitions — are used properly. |
| **B. Programmatic assembly** | Engineering time up front | FFmpeg/MoviePy builds the timeline from `shots.json` + `vo_timing.json` automatically. The `capcut-pro-editor` skill already has an auto mode doing exactly this. Genuinely hands-off, but the transitions are cruder than a human's. |
| **C. Hybrid — recommended** | Some engineering, ~45 min/episode of human time | Programmatic assembly builds the full rough cut with pushes, cuts on the VO word timings, grade and captions applied. A human then spends 45 minutes upgrading the 15–20 transitions that carry the episode. |

**Recommendation: C.** It preserves the thing that makes this look like Vox — the transition
grammar — while removing the 3 hours of mechanical timeline work. And option B is a fallback
if a week gets busy: it produces a publishable episode without anyone touching it.

This is the one place where "completely hands-off" and "quality high" genuinely pull
against each other, and it's worth deciding deliberately rather than discovering it at
episode 3.
