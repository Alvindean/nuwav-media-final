# Style Bible — locking the visual language

**Nothing generates until the Style Key is locked.** This is Gate 5 and it is the reason
200 frames look like one episode instead of 200 experiments.

---

## What a Style Key is

A single markdown block plus six reference frames, written once per **season** (not per
episode), and re-stated verbatim at the top of every generation prompt.

```md
## STYLE KEY — Nu Wav Docs S1

PALETTE
  ink        #14171C   backgrounds, type
  paper      #F2EDE3   ground, cutout stock
  accent-01  #E2543B   the one thing that matters in frame
  accent-02  #2E7D8F   secondary data series
  muted      #8A8F98   everything not being pointed at

TREATMENT
  Editorial illustration. Flat-to-semi-flat with visible paper texture.
  Halftone dot shading. Hard-edged shapes, no soft airbrush gradients.
  Light is directional and single-source. Shadows are shape, not blur.

ARCHIVAL
  Treated as paper cutouts on a textured ground, with a 2px paper edge
  and a soft contact shadow. Desaturated to near-mono, warm sepia at 15%.

PEOPLE
  Mid-distance, three-quarter or silhouette. Faces stylised, never
  photoreal — photoreal faces in an illustrated frame break the world
  and land in the uncanny valley on a 15-minute watch.

TYPE
  One grotesque family. Two weights only: Regular and Bold.
  Labels are set on solid accent-01 chips, never floating on the image.

CAMERA
  Eye-level or slight low angle. Wide-to-medium. No fisheye, no
  extreme perspective, no lens flare.

NEGATIVE
  no photorealism, no 3D render, no glossy plastic, no lens flare,
  no cinematic bokeh, no watermark, no text artifacts, no busy background
```

---

## The six reference frames

Generate these first with `nano_banana_pro` at 2K, and iterate until all six read as one
show. This costs about 12 credits and it is the highest-return spend in the pipeline.

1. A **wide establishing** frame
2. A **person** in the house treatment
3. An **object / mechanism** close-up
4. A **map or diagram** frame with real labels on it
5. An **archival photo** rendered in the cutout treatment
6. A **data / chart** frame

If any one of them looks like a different channel, fix the Style Key — not the frame.

---

## How prompts are built

Every generation prompt is: **Style Key block → subject → composition → negative**.

```
[STYLE KEY BLOCK VERBATIM]

SUBJECT: A container ship viewed from a high three-quarter angle, mid-ocean,
seen from above and behind. Deck stacked with containers in muted colours,
one stack in accent-01.

COMPOSITION: 16:9. Ship occupies lower-left third. Horizon at upper quarter.
Negative space upper-right reserved for a type overlay.

NEGATIVE: [NEGATIVE BLOCK VERBATIM]
```

**Reserve negative space for type in the prompt itself.** Retrofitting a text overlay onto
a frame that has detail everywhere is the most common reason a frame gets regenerated —
and regeneration is the main way credit budgets are blown.

---

## The reusable asset library

From episode 4 this is what cuts roughly 25% off the stills line. Build it as you go, in a
shared Drive folder, not per-episode:

| Category | What lives there |
|---|---|
| **Texture plates** | Paper grounds, grain overlays, gradient beds — 8–10 total, reused forever |
| **Map bases** | Blank world, continent and region bases in the palette, ready to annotate |
| **Lower thirds** | Name card, source card, date stamp, "contested" flag — CapCut templates |
| **Chart shells** | Flourish templates pre-styled to the palette; per-episode is a data swap |
| **Transition elements** | Alpha-channel paper edges, sweeping shapes, mask wipes |
| **Character kit** | Recurring figure types generated from the same `soul_id` |

The rule: **if you generate something twice, it belongs in the library.**

---

## What breaks a Vox look

| Mistake | Why it fails |
|---|---|
| Photoreal AI people | Uncanny at 15 minutes in a way it isn't at 15 seconds |
| Mixed illustration styles | Reads as stock assets, not authored |
| Text floating on a busy image | Illegible on a phone, which is most of the audience |
| Full-saturation everywhere | Nothing points at anything — the accent stops meaning "look here" |
| Generated video that doesn't match the stills | Exactly why every hero clip is image-to-video from an existing still |
| Charts styled by the chart tool | They must be styled to the palette, or they read as a different product |
