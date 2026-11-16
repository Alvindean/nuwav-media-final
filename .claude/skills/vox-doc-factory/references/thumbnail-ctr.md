# Viral Thumbnails — the CTR spec

The thumbnail is the only part of the episode most people ever see. A 4% CTR and an 8% CTR
on the same video are two different businesses.

**Production is owned by Higgsfield's `youtube-thumbnail-generator` workflow.** Load it with
`get_workflow_instructions({workflow: "youtube-thumbnail-generator"})` **before** calling
`generate_image` — it carries the 16 concept frameworks, the house prompt structure, the
identity lock, the lighting rig and the model routing. Do not reinvent it here.

This document is the layer above it: what to aim for, and how to know if it worked.

---

## Benchmarks

| CTR | Meaning |
|---|---|
| 2–4% | Underperforming |
| **4–6%** | Platform average |
| 8–10% | Strong for an established channel |
| 12%+ | Elite — generally only reached with A/B testing |

By traffic source: **Search 8–15%** for well-optimised content (intent already matches),
**Browse 3–7%** (you're interrupting, not answering).

Judge against the right source. A 5% browse CTR on a new channel is fine; a 5% search CTR
means the thumbnail isn't matching the query.

## What actually moves the number

Reported effects — treat as direction and magnitude, not precision:

| Change | Effect |
|---|---|
| Face present in thumbnail | up to **+45%** CTR |
| Neutral face → surprised expression | **+47%** |
| Low contrast → high contrast | **+23%** |
| Adding a 3-word hook to an image-only thumbnail | **+32%** |
| Busy background → clean gradient | **+28%** |
| Warm colour palette | ~**+23%** |
| Adding a question mark to existing text | **+19.8%** |
| Emotional expression vs flat | up to **+30%** |

In a study of 500 breakout videos, **69% used a face — and 80% of the biggest
overperformers did.**

## What this means for a documentary channel

Here's the tension worth naming: this channel has **no host**. There's no face to put in a
thumbnail, and the single strongest CTR lever is a face.

Three honest options:

| Option | Trade-off |
|---|---|
| **A. Generated human subject** | Gets the face lever. Must match the Style Key — a photoreal face on an illustrated channel breaks the world. Use the illustrated treatment, not photoreal. |
| **B. Subject-only frameworks** | Landscape / Product / Graphical / Map-Aerial. Honest to the content, gives up the face lever. Expect browse CTR nearer 3–5%. |
| **C. Archival human face** | A real historical face from the episode's own material. Gets emotion and authenticity, and it's *truthful to the video*. |

**Recommendation: C first, A second, B for episodes where neither fits.** A real face from
the story beats a generated stranger on a channel whose whole value is that it's true.

## The house rules

**Always:**
- **16:9, 4K**, `nano_banana_pro`, `resolution: "4k"` passed explicitly (the model defaults to 1k)
- Subject **large and dominant** — 40–60% of frame, chest-up or medium-close
- **High contrast**, clean gradient background, warm palette bias
- Must read at **~120px wide**. That's the real test — a sidebar, not a monitor
- **4 variants minimum**, differing by emotion and/or camera take, each its own call

**Never:**
- Text baked into the generation by default. Deliver a clean render and layer the headline as
  a typographic overlay — zero credits, always legible, and editable later
- A promise the video doesn't keep. The Fact Gate applies to the thumbnail too
- More than **3–5 words** if text is used
- A busy background. It's the single most common CTR killer

## Emotion, matched to episode type

From the workflow's 11 presets:

| Episode | Emotion |
|---|---|
| Revelation / "nobody noticed this" | **shock** |
| Scale / magnitude | **awe** |
| Conflict / dispute | **determination** or **rage** |
| Absurdity | **confusion** or **laugh** |
| Risk / threat | **fear** |
| Explainer, expert framing | **charisma** |

## Titles

55–65 characters. A **question or a surprising claim**. No clickbait punctuation, no ALL CAPS.

The question-mark finding is worth acting on — a title that poses a genuine question opens
an information gap, and gaps are what get clicked.

- ✅ `Why every chip factory ends up in the same three places`
- ✅ `The 21-mile gap a fifth of the world's oil goes through`
- ❌ `You WON'T BELIEVE what's happening with chips!!`

**Write two variants per episode.** They become the A/B test.

## The A/B loop — where the learning happens

Step-by-step testing is reported to produce **+20–40%** CTR gains. Not from one clever
thumbnail — from the loop.

1. Ship variant A with the episode.
2. At 48 hours, if CTR is below the channel's rolling average, swap to variant B.
3. Give it 48 hours.
4. **Log both numbers to the ledger.** The delta is the finding.
5. If a pattern holds across 3 episodes, it becomes a Playbook rule.

**Change one thing at a time.** Swapping the emotion *and* the background teaches nothing —
you learn that "something" worked.

## Post-render check — never skip

From the workflow, and it's non-negotiable:

- Identity matches the reference (if a face reference was used)
- No stray text or watermark when baking wasn't ordered
- The expression and hero element still read at 120px

Any failure → re-render the same prompt, max 2 retries. Still failing → **report it
honestly, never ship silently.**
