# Model Routing & Credit Math

Verified against the live Higgsfield catalogue (`models_explore`) on 2026-07-30.
Per-credit figures marked **(est.)** come from third-party pricing write-ups and are for
*planning only* — the episode ledger records what was actually charged.

Account at time of writing: **Ultra plan, 2,879.2 credits.**

---

## Layer 1 — Stills (~70% of screen time)

This is where almost all the screen time lives and where the cost discipline is won.

| Use | Model | Params | Cost (est.) |
|---|---|---|---|
| **Anything with text on it** — chart labels, map legends, quote cards, diagrams, title cards | `nano_banana_pro` | `resolution: "2k"`, 16:9 | ~2 cr |
| Wide establishing plates, landscape, architecture | `seedream_v4_5` | `quality: "basic"` (renders to 4K), 16:9 | ~2 cr |
| Background textures, paper, grain plates, gradient beds | `nano_banana_2` | `resolution: "1k"` | ~1–2 cr |
| Consistent recurring character / figure | `soul_2` | `quality: "2k"`, reuse the same `soul_id` | ~2 cr |
| Cinematic concept stills for the cold open | `cinematic_studio_2_5` | `resolution: "2k"` | ~2 cr |

**Why `nano_banana_pro` for anything text-bearing:** it is the catalogue's strongest text
and diagram renderer. Vox style is dense with on-screen labels; a model that garbles
typography costs more in retries than it saves per frame.

**Generate at final resolution.** 2K stills on a 1080p timeline give ~180% headroom, which
is exactly what a push-in or a parallax slide eats. Never generate at 1K and upscale — the
upscale costs more than the resolution did.

**Aspect ratio: always 16:9**, even for frames that will be cropped. Cropping in CapCut
is free; regenerating is not.

---

## Layer 2 — Motion graphics (~18%) — zero credits

| Need | Tool | Cost |
|---|---|---|
| Map zooms, satellite pushes, geographic reveals | **Google Earth Studio** | Free (needs approval — apply early) |
| Animated bar / line / race charts | **Flourish** | Free tier |
| Kinetic typography, lower thirds, callouts, timelines | **CapCut Pro** text + keyframes | Included |
| Alpha-channel overlays | CapCut chroma / PNG sequence | Included |

Build these as a **reusable template pack** once. From episode 4 on, most graphics are a
data swap on an existing template, not a new build. This is where the per-episode time
cost collapses.

---

## Layer 3 — Hero motion (~12%) — 12 to 18 clips per episode

**Every hero clip is image-to-video from a still we already generated.** Pass it as
`start_image`. Two reasons: it costs less than text-to-video, and it inherits the locked
Style Key so the clip cuts against the stills instead of fighting them.

| Tier | Model | Params | Cost (est.) | Use |
|---|---|---|---|---|
| **Default** (10–14 clips) | `kling3_0_turbo` | `resolution: "720p"`, `duration: 5`, start_image | ~8–10 cr | The working hero shot |
| **Signature** (3–4 clips) | `kling3_0` | `mode: "std"`, **`sound: "off"`**, `duration: 5`, start_image | ~14 cr | Act openers, the reveal |
| **Reference-locked** | `seedance_2_0_mini` | `resolution: "720p"`, **`generate_audio: false`**, `bitrate_mode: "high"` | ~10 cr | When a subject must stay identical across shots |
| **Cold open only** | `veo3_1` or Google Flow | `variant: "veo-3-1-fast"` | **40–70 cr** | One shot, or push it to Google Flow instead |

### The audio rule

`sound: "off"` on Kling. `generate_audio: false` on Seedance / Veo / Cinema Studio.

We never use model audio — ElevenLabs carries the entire track and licensed music sits
under it. Generated audio is a pure surcharge on every clip, and on Kling the model's own
parameter documentation says silent output costs fewer credits. Across 15 clips × 12
episodes a month this is one of the largest single savings in the pipeline.

### Push the expensive shot off-platform

`veo3_1` at 40–70 credits is 15–35 stills. If the cold open genuinely needs Veo, generate
it in **Google Flow** — that subscription is already paid, so at the margin it is free, and
it takes the single most expensive line item out of the Higgsfield budget entirely.

---

## Upscaling — selective, not routine

| Situation | Action |
|---|---|
| Still generated at 2K/4K | **Nothing.** Already above timeline resolution. |
| 720p hero clip that lands **full-frame** | `bytedance_video_upscale` — `resolution: "1080p"`, `preset: "aigc"`, `model_version: "standard"`, `fps: 24` |
| 720p clip inside a split-screen, inset, or behind type | **Nothing.** It's displayed at under 50% — the upscale is invisible. |
| The cold open, and only the cold open | `topaz_video` — `resolution: "1080p"`, frame interpolation off |

`preset: "aigc"` matters — it is tuned for generated footage and handles the soft,
low-detail regions AI video produces far better than `common`.

Budget ~6 upscales per episode, not 15.

---

## Per-episode budget

**Lean profile (the default):**

| Line | Qty | Est. credits |
|---|---|---|
| Stills @ ~2 cr | 140 | 280 |
| Hero — turbo @ ~10 cr | 12 | 120 |
| Upscales @ ~8 cr | 6 | 48 |
| **Total** | | **~448** |

**Premium profile** (act openers on `kling3_0`, richer plate count): **~700 cr**

**From episode 4 onward** the reusable asset library — recurring map bases, lower thirds,
texture plates, the character/location kit — cuts the stills line by roughly 25%:
**~350 cr/episode.**

### Monthly, against Ultra's 3,000 credits

| Cadence | Episodes | Est. burn | Verdict |
|---|---|---|---|
| **2 / week** | 8 | ~3,000 cr | **Fits — with no headroom.** |
| 3 / week | 12 | ~4,400 cr | Needs ~1,500–2,000 cr top-up |
| 3 / week + Flow for hero shots | 12 | ~3,200 cr | Workable if hero motion moves to Google Flow |

**Recommendation: launch at 2/week.** Measure the real ledger on episodes 1 and 2, then
decide on 3/week with actual numbers rather than these estimates. If 3/week is the
requirement from day one, route all hero motion to Google Flow and treat Higgsfield as the
stills engine.

---

## Gate 7 procedure

1. Call `balance`. Record `credits_before` in `episode.json`.
2. Sum the projected spend from `shots.json`.
3. If projected > ceiling: **downgrade hero clips to stills-with-camera-move** before
   generating. A push-in on a good still reads better than a mediocre generated clip.
4. Generate. Batch stills first, hero clips second, upscales last.
5. Call `balance` again. Record `credits_spent`. Append to the ledger.

The ledger is the only number that matters for the next cadence decision.
