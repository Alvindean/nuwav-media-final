---
name: capcut-mastery
description: >
  Deep CapCut Pro editing craft — the two doctrines the team edits by: VIRAL (hook, pace,
  beat-sync, retention engineering) and CINEMATIC (camera-angle transitions, speed curves,
  parallax, grade). Use IMMEDIATELY when the user says "edit this properly", "make the cuts
  better", "viral cuts", "cinematic cuts", "how do I edit this in CapCut", "the pacing is
  off", "fix the retention", "teach the team to edit", "capcut mastery", or any time an edit
  needs to be designed rather than just assembled. Carries exact settings — keyframe values,
  speed-curve shapes, easing choices, blend modes, optical-flow rules — not principles.
  Distinct from capcut-pro-editor, which runs the automated FFmpeg/Whisper cleanup pipeline;
  this is the craft layer that decides what the edit should actually do.
  Hard rule: never a built-in transition preset. Every move is keyframed by hand.
---

# CAPCUT MASTERY

Two doctrines. Pick by format, never mix them.

| | **VIRAL** | **CINEMATIC** |
|---|---|---|
| Format | Shorts, Reels, TikTok, hooks | Documentary, explainer, long-form |
| Cut rhythm | 0.8–2.0 s | 3.5–4.5 s |
| Motion | Constant, aggressive | Deliberate, mostly invisible |
| Audio drives | The beat | The narration |
| Goal | Survive the first 3 seconds | Survive minute 8 |

Applying viral pacing to a 15-minute documentary makes it exhausting. Applying cinematic
pacing to a Short kills it in two seconds. **The doctrine is chosen before the first cut.**

---

## The numbers this is all aimed at

Retention benchmarks worth editing against:

| Window | Target |
|---|---|
| First 10–15 seconds | **>70%** solid, **>80%** exceptional, **<50%** the hook is broken |
| 10–20 minute video, overall | **40–55%** average view duration |
| Under 5 minutes, overall | 50–70% |

The first 30 seconds now functions as a **standalone ranking input** — it is weighted
separately from the rest of the video, and the first 3 seconds decide whether distribution
opens up or gets throttled. That is why both doctrines spend disproportionate effort there.

Retention editing — J-cuts, L-cuts, a visual change every 20–30 seconds, aggressive
trimming — is reported to lift average view duration by **20–30%**. It is the cheapest
quality lever available.

---

# DOCTRINE ONE — VIRAL

## The first three seconds

Three seconds decides distribution. The rules:

- **Open mid-action.** No logo, no intro, no "hey guys". The first frame is already the
  interesting part.
- **Motion in frame one.** A static opening frame reads as a dead video before anyone has
  processed the content.
- **The promise is on screen by second 3** — as text, as an image, or as the first spoken
  clause. Not implied.
- **The thumbnail's promise must appear literally.** A drop inside the first 30 seconds
  almost always means the hook didn't match the title or thumbnail.

## Beat-synced cutting

Do not cut manually to music and hope. Cut *to the waveform*.

1. Drop the track first, before any picture.
2. In CapCut, use **Beat detection** (Audio → Beat → Automatic) to mark the timeline.
3. Cut **on** the beat markers, not near them. A 2-frame miss is visible even to people
   who can't say why.
4. For impacts, put the accent **effect** on the snare hit rather than cutting there —
   `White Flash` or `Chromatic Aberration` at low opacity, 3–5 frames. Cutting on every
   snare gets tiring fast; flashing on it doesn't.

## Speed ramping

CapCut desktop's **Speed → Curve → Custom** is the tool. Two shapes cover most needs:

| Shape | Points | Reads as |
|---|---|---|
| **Impact ramp** | 1× → 0.3× → 1× | The moment lands harder |
| **Time skip** | 1× → 4× → 1× | "and then a while passed" |

The **midpoint placement between speed handles** controls smoothness — pull the midpoint
closer to a handle for an abrupt change, centre it for a smooth one. That control is the
whole difference between a ramp that feels designed and one that feels like a glitch.

**Optical flow vs frame blending:** optical flow generates genuine in-between frames by
analysing pixel movement — better, slower to render. Frame blending is faster and worse.
Use optical flow for anything slowed below 0.5×; below that, frame blending visibly
ghosts. Optical flow struggles with fast motion across a busy background — if it smears,
drop to frame blending or shorten the ramp.

## Layer stacking

The strongest CapCut work stacks **transparent effect layers with blend modes** rather than
applying effects directly to footage:

- `Screen` for light effects, glows, flares, dust
- `Overlay` for contrast and texture
- Keep each layer at **20–40% opacity**. Full-opacity effects are what makes an edit look
  like a filter pack.

## Captions

- Word-by-word or 2–3 word chunks, never full sentences.
- One accent colour on the emphasis word only.
- Position at roughly **60% screen height** — clear of the UI at the bottom and the
  subject's face at the top.
- Auto-captions then a manual pass. Auto-captions are ~95% accurate, and the 5% is always
  the word that mattered.

---

# DOCTRINE TWO — CINEMATIC

## The core discipline

**Never use a built-in transition preset.** Every move is built from keyframes on position,
scale, rotation, blur and speed. Presets — glitch, page turn, zoom blur, film burn — read
as amateur instantly and are the single fastest way to make good footage look cheap.

The full 12-move camera-angle grammar, with exact CapCut keyframe values, lives in
`vox-doc-factory/references/transition-playbook.md`. This section covers the CapCut
mechanics underneath those moves.

## The keyframe graph

CapCut desktop exposes an **easing curve** on the keyframe graph. Most editors never open
it, and it's the difference between "moving" and "moving well".

| Move | Curve | Why |
|---|---|---|
| Slow push on a still | **Linear** | Any ease reads as an *effect*. A real camera push is linear. |
| Track-back reveal | Slight **ease-out** at the end only | The camera settles; it doesn't stop dead. |
| Whip pan | **Ease-in** out, **ease-out** in | Acceleration is what sells the whip. |
| Parallax slide | **Linear** on all three layers | The speed *ratio* creates the depth, not the easing. |

## The Ken Burns move, done properly

The slow push is 70% of a documentary and almost everyone does it badly.

- **Scale 100% → 106%**, occasionally to 108%. **Never past 110%** — softness becomes
  visible, especially after YouTube's transcode.
- **Linear easing.** Not ease-in-out.
- **Alternate direction shot to shot.** Push, pull, push, pull. Six push-ins in a row reads
  as a broken loop.
- **Vary the anchor.** Not everything zooms to centre. Push toward the part of the frame
  the narration is talking about — that's what turns a zoom into a *direction*.
- Generate or source stills at **2K minimum** so a 108% push still has real pixels behind it.

A push has to have *intent*: it gives a still direction, pace and emphasis. A push applied
uniformly to every image has none of those and just makes the video feel like it's
breathing at you.

## Freeze frame with motion

CapCut desktop lets a **freeze frame carry keyframes**. Freeze on the beat, then keyframe a
slow push and a text callout onto the frozen frame. The freeze stops time while the camera
keeps moving — far stronger than a static hold, and it's how a statistic gets its own
moment.

## Parallax from a flat image

Real depth from a single still:

1. Duplicate the still onto three tracks.
2. Background-remove the subject on the top track (CapCut's cutout, or import a
   pre-masked PNG).
3. Midground: a soft-masked middle band.
4. Keyframe Position X by **−120 / −60 / −20 px** across the shot, foreground to background.

The speed *ratio* is what creates the depth. Push the absolute distances up and it becomes
a novelty; keep the ratio and it reads as a camera move.

## J-cuts and L-cuts as the base rhythm

These are not accents. They are the underlying rhythm of a documentary edit.

- **J-cut** — audio leads picture by **10–14 frames**. Use on roughly **every third cut**.
  It pulls the viewer forward and it's completely invisible.
- **L-cut** — audio tails **8–12 frames** into the next shot, with a −6 dB fade. Use at
  every act change to soften a hard visual break without resorting to a dissolve.

Detach audio, slide the clip, done. It is the highest ratio of retention gained to effort
spent of anything in this document.

## Cut placement

Cut **on the stressed syllable**, never in a pause. Use word-level timestamps from Whisper
to find them precisely.

Cutting in a silence makes the edit feel hesitant. Cutting on the stress makes the picture
feel like it's agreeing with the narrator.

## Silence and stillness

After ten minutes of continuous motion, a **completely still frame** during a narration
pause is enormously powerful. It's the only moment in the edit that gets to feel different,
so spend it on the thesis.

---

## Shared rules — both doctrines

1. **No preset transitions.** Ever. Cross-dissolves only between two stills of the same
   era, and only 8 frames.
2. **Never two identical moves back to back.** Alternate direction and type.
3. **A visual change every 20–30 seconds**, minimum, in any format.
4. **Effects live at 20–40% opacity** on their own layer, never baked onto the footage.
5. **Grade last**, on an adjustment layer over everything, so it's one change not two
   hundred.
6. **Grain last of all**, above the grade. Uniform grain is what makes generated, archival
   and rendered material look like one film.
7. **Master to −14 LUFS.** Louder just gets normalised down and you lose the dynamics for
   nothing.

---

## When CapCut is the wrong tool

Be honest about the ceiling:

| Need | Better tool |
|---|---|
| Map zooms and geographic reveals | **Google Earth Studio** (free, needs approval) |
| Animated data charts | **Flourish** (free tier) |
| Complex motion graphics, expressions | After Effects |
| A 200-shot timeline assembled automatically | **FFmpeg / MoviePy** — CapCut has no API |

CapCut's real strength is the hand-crafted camera move and the fast, tactile timeline. Use
it for that and let the free specialist tools do the things it isn't for.

---

## Sources

Technique grounded in CapCut's own optical-flow and speed-curve documentation, practitioner
tutorials, and published YouTube retention benchmarks. Retention percentages are reported
industry benchmarks, not measurements from this channel — replace them with real numbers
from the episode log once three episodes have shipped.
