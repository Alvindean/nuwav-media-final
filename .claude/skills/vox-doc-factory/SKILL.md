---
name: vox-doc-factory
description: >
  Produce a complete Vox-style explainer documentary — 11 to 20 minutes, 16:9, narrator-led,
  motion-graphics-heavy — end to end and hands-off, from a locked topic through research,
  script, narration, art direction, generation, edit, grade, packaging, and YouTube publish.
  Use IMMEDIATELY when the user says "vox doc", "vox-style documentary", "run the doc factory",
  "make the documentary", "this week's episode", "long-form explainer", "15 minute documentary",
  "documentary episode", "build episode [n]", or hands over a picked topic from the
  profitability/topic-selection system and expects a finished upload. Runs a 12-role production
  team across 9 gated stages. Credit-disciplined by design: the visual layer is stills-first
  (2 credits a frame) with generated motion reserved for a small hero-shot budget, and every
  generated clip has its native audio switched OFF because ElevenLabs carries the track.
  Distinct from video-factory (volume/faceless shorts), higgsfield-content-factory (UGC ads),
  and short-form-video. Hard rules: never below 11:00 runtime; never publish without the
  Fact Gate and the Retention Gate both passing; never generate a frame before the Style Key
  is locked.
---

# VOX DOC FACTORY

A 15-minute Vox-style explainer, produced by a 12-role team across 9 gated stages, ending
with a scheduled YouTube upload.

**Runtime spec:** target **13:00–16:00**. Hard floor **11:00**. Hard ceiling **20:00**.
**Format:** 1920×1080, 16:9, 24fps, H.264, ~16 Mbps, audio −14 LUFS integrated.
**Cadence:** 2 episodes/week to start, 3/week once the asset library carries its own weight.

---

## The core economic idea — read this before anything else

A 15-minute video is ~900 seconds. Generating 900 seconds of AI video would cost thousands
of credits per episode and is not what Vox actually is.

**Vox is a stills-and-graphics medium with motion applied in the edit.** Archival photos on
a slow push. Maps that zoom. Charts that build. Paper cutouts that slide. Real generated
motion is the exception, not the rule.

So the factory splits screen time three ways:

| Layer | Share of runtime | Engine | Cost per screen-second |
|---|---|---|---|
| **Stills with camera move** | ~70% | `nano_banana_pro`, `seedream_v4_5` | ~0.4 credits |
| **Motion graphics** (maps, charts, type) | ~18% | Google Earth Studio, Flourish, CapCut | 0 credits |
| **Hero generated motion** | ~12% | `kling3_0_turbo`, `kling3_0` | ~2 credits |

That mix is what makes 2–3 episodes a week affordable. Do not drift from it. If an episode
starts asking for 40 hero clips, the script is wrong, not the budget.

**Three non-negotiable credit rules:**

1. **`sound: 'off'` / `generate_audio: false` on every single generated clip.** We never use
   model audio — ElevenLabs carries the whole track. Generated audio is a pure surcharge.
2. **Every hero clip is image-to-video from a still we already generated**, passed as
   `start_image`. This halves the cost versus text-to-video *and* guarantees the clip matches
   the locked Style Key.
3. **Generate at final resolution.** Stills at 2K/4K natively so no image upscale is ever
   needed. Upscale video only when a 720p clip lands full-frame.

---

## The team — 12 roles

Run each role as a distinct pass. Do not collapse them; the failure modes are different and
a single pass will miss most of them.

| # | Role | Owns | Hard deliverable |
|---|---|---|---|
| 1 | **Showrunner / EP** | The gates, the schedule, the go/no-go | `episode.json` state file |
| 2 | **Research Producer** | Sources, timeline of facts, primary docs | `research.md` + citation table |
| 3 | **Fact-Checker** | Every claim traced to a source | Fact Gate pass/fail |
| 4 | **Story Producer** | Script architecture, the thesis, the arc | `script.md` with timecodes |
| 5 | **Narration Director** | ElevenLabs voice, pacing, emphasis, pickups | `vo.wav` + `vo_timing.json` |
| 6 | **Art Director** | The Style Key — one locked visual language | `style_key.md` + 6 ref frames |
| 7 | **Shot Designer** | Shot list, durations, cut placement | `shots.json` |
| 8 | **Motion Graphics** | Maps, charts, timelines, kinetic type | `/graphics/*.mov` (alpha) |
| 9 | **Generation Producer** | Higgsfield jobs, credit budget, retries | `/media/*` + credit ledger |
| 10 | **Editor** | Assembly, transitions, rhythm, J/L cuts | CapCut project / render |
| 11 | **Colorist & Finishing** | The house grade, grain, loudness, captions | Graded master |
| 12 | **Packaging & Publishing** | Title, thumbnail, description, chapters, upload | Live (or scheduled) video |

Plus a standing **Performance Analyst** pass that reads the last 3 episodes' retention
curves and feeds one concrete change into the next Story Producer pass.

---

## The 9 stages

Each stage ends in a gate. A failed gate goes back one stage — it does not go forward
"with a note".

### Stage 1 — Intake & Lock
Input: the topic from the profitability/topic-selection system.
Produce the **Episode Brief**: one-sentence thesis, the single question the video answers,
the audience, the promised payoff, working title, and target runtime.

> **Gate 1 — The One Question.** If the thesis needs two sentences, it is two videos.
> Split it or narrow it. Do not proceed.

### Stage 2 — Research & Fact Pack
Research Producer builds `research.md`: a dated timeline, the key numbers with their
sources, 3–5 primary documents, 2 counter-arguments, and a list of what is genuinely
contested versus settled.

Fact-Checker then re-derives every number independently.

> **Gate 2 — Fact Gate.** Every claim that will appear on screen has a named source with a
> URL and a date. Contested claims are labelled as contested in the script. Any number
> that cannot be sourced is cut, not softened.

### Stage 3 — Script
Story Producer writes to the structure in `references/script-architecture.md`.

Target **2,150–2,450 words** for a 14–16 minute read at 150–160 wpm. Write in the Vox
register: conversational, curious, second person occasionally, short sentences, one idea
per sentence, and the narrator is a person figuring it out — not an authority pronouncing.

Every paragraph gets a bracketed visual note: `[MAP: Strait of Hormuz, zoom to 3km]`.

> **Gate 3 — Read-Aloud.** Read the script out loud end to end and time it. Under 11:00 of
> read time, it goes back. Any sentence you stumble on gets rewritten.

### Stage 4 — Narration
Narration Director produces the VO **before** any visuals. The VO is the spine; picture
is cut to it, never the other way round.

Settings, voice choice and the pickup process are in `references/voice-spec.md`.

Output `vo.wav` (48kHz, mono, −3 dBFS peak, unprocessed) and `vo_timing.json` (word-level
timestamps from Whisper — this drives every cut point downstream).

> **Gate 4 — Runtime.** `vo.wav` duration ≥ 11:00. Under that, the script goes back to
> Stage 3. This is the hard floor and it is checked here, not at the end.

### Stage 5 — Style Key
Art Director locks the visual language: palette (5 hex values), illustration treatment,
grain and texture, typography, how archival is handled, how people are depicted, and the
6 reference frames every later prompt is written against.

Full spec in `references/style-bible.md`.

> **Gate 5 — Style Lock.** Six reference frames exist and read as one show. No generation
> starts before this. A locked key is what makes 200 frames look like one episode instead
> of 200 experiments.

### Stage 6 — Shot Design
Shot Designer converts `vo_timing.json` + script visual notes into `shots.json`.

Pacing rules:
- Average shot **3.5–4.5 s**. Nothing over 9 s without a camera move inside it.
- **Visual reset every 20–25 s** — a hard change of scale, colour or information type.
- **Information-type rotation every ~40 s**: archival → map → chart → illustration →
  quote card → hero motion. Never two of the same type back to back.
- Mark each shot `still` | `graphic` | `hero`. Enforce the 70/18/12 mix.

> **Gate 6 — Boredom Audit.** Walk the shot list at 1× and mark any 15-second window with
> no new information. Every marked window gets a shot added or a cut moved.

### Stage 7 — Generation
Generation Producer executes. Model routing, parameters and the credit ledger are in
`references/model-routing.md`.

Record `balance` before and after. Log actual credits spent per episode into the ledger —
the published per-model figures are estimates, our ledger is the truth.

> **Gate 7 — Budget.** If projected spend exceeds the episode ceiling (see routing doc),
> downgrade hero clips to stills before generating, not after.

### Stage 8 — Edit, Grade, Finish
Editor assembles to the VO. Transitions come from `references/transition-playbook.md` —
the camera-angle grammar is the single biggest quality lever in this whole pipeline.

Colorist applies the house grade (`references/color-grade.md`), grain, and the loudness
pass. Captions burned or as sidecar SRT per channel policy.

> **Gate 8 — Retention Gate.** Watch the full cut once, unpaused, at 1×. Note every second
> you wanted to skip. Fix all of them. Then check: does the first 8 seconds state the
> question, and does the last 20 seconds loop back to it?

### Stage 9 — Package & Publish
Packaging role produces title (2 variants), thumbnail (via the `youtube-thumbnail-generator`
Higgsfield workflow), description with sources, chapters from `shots.json`, tags, end
screen and pinned comment.

Publish path in `references/publishing.md`.

> **Gate 9 — Human Publish.** The upload is created as **private or scheduled**, never
> straight to public, unless the user has explicitly said otherwise for that episode.

---

## State file

Every episode carries `episode.json` in its Drive folder. The Showrunner updates it at
each gate so any session can resume cold:

```json
{
  "episode": 7,
  "slug": "why-chip-fabs-cluster",
  "thesis": "...",
  "stage": 6,
  "gates_passed": [1,2,3,4,5],
  "runtime_target": "14:30",
  "vo_duration_sec": 878,
  "credits_before": 2879.2,
  "credits_spent": null,
  "drive_folder": "...",
  "youtube_status": "not_uploaded"
}
```

---

## Folder convention (Google Drive)

```
/Vox Docs/
  /EP07_why-chip-fabs-cluster_2026-08-04/
    episode.json
    research.md
    script.md
    style_key.md
    shots.json
    /audio/    vo.wav, vo_timing.json, music/, sfx/
    /media/    stills/, hero/, upscaled/
    /graphics/ maps/, charts/, lower-thirds/
    /edit/     capcut-project/, renders/
    /publish/  thumbnail.png, description.txt, chapters.txt
```

Naming: `EP07_SH034_still_map-hormuz_v2.png` — episode, shot, type, slug, version.

---

## Hard rules

1. Never below **11:00** finished runtime.
2. Never generate a frame before the **Style Key is locked**.
3. Never publish without **Fact Gate** and **Retention Gate** both passing.
4. `generate_audio: false` / `sound: 'off'` on **every** generated clip.
5. Every hero clip is **image-to-video from an already-generated still**.
6. Every on-screen claim has a **named, dated source** in the description.
7. Upload lands **private or scheduled** — a human flips it public.
8. Log **actual credits** per episode. Estimates are for planning; the ledger is for deciding.

---

## References

- `references/script-architecture.md` — the 5-act Vox structure with timecodes
- `references/style-bible.md` — Style Key spec, palette method, archival treatment
- `references/model-routing.md` — exact model + parameter routing and credit math
- `references/transition-playbook.md` — 12 camera-angle transitions with CapCut settings
- `references/color-grade.md` — the house grade, grain, loudness
- `references/voice-spec.md` — ElevenLabs voice, settings, pickup process
- `references/publishing.md` — Drive → Make.com → YouTube, metadata spec
- `references/stack-checklist.md` — what we own, what is still missing

## Sibling skills this pipeline calls

- **`capcut-mastery`** — the craft layer behind Stage 8. Two doctrines, exact settings.
- **`make-scenario-builder`** — builds and validates the Stage 9 publish scenario. Ships
  with `blueprints/vox-doc-youtube-publish.json` already validated.
- **`seal-team`** — when a stage hits a capability nobody has, this goes and acquires it
  rather than handing the user a shopping list. Any role that finds itself about to say
  "you'd need to go learn X" calls this instead.
