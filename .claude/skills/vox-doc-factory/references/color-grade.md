# The House Grade

One grade, every episode, no exceptions. Consistency across a channel is worth more than
any individual episode looking clever. Save it once in CapCut as a preset named
**`VOX-HOUSE-01`** and apply it as an adjustment layer over the whole timeline.

---

## The look, described

Slightly lifted blacks so nothing crushes to pure black. Overall desaturation, with one or
two accent hues left at full strength so they pop against it. Warm midtones, cool shadows.
A little grain so the generated material and the archival material sit in the same world.

The point of desaturating everything except the accents is that it makes the *information*
— the highlighted country on the map, the one bar in the chart that matters — the brightest
thing on screen. That is a Vox habit and it's a functional one, not a stylistic one.

---

## CapCut Pro — adjustment layer settings

| Control | Value | Why |
|---|---|---|
| Exposure | 0 | Fix exposure per clip, not globally |
| Contrast | **+8** | Slight snap without crushing |
| Saturation | **−12** | The desaturated base |
| Vibrance | **+6** | Brings skin and accent hues back up after the desat |
| Highlights | **−10** | Protects generated highlights, which blow out easily |
| Shadows | **+12** | The lift |
| Whites | −4 | Keeps peak under broadcast-safe |
| Blacks | **+6** | The matte-black film feel |
| Temperature | **+6** | Warm midtones |
| Tint | **−3** | Pulls the magenta out of AI-generated skin |
| Sharpen | **+15** | Recovers detail lost to the push-ins |
| Grain | **8–12** | The unifier — see below |
| Vignette | 6 | Barely there. Above 10 it looks like a filter. |

### Curves

One node only: lift the shadow end of the RGB curve so the black point sits at roughly
**5/255**. That single move does most of the work of the look.

### Broadcast safe

Keep peak luma under **235**. YouTube's transcode is unkind to clipped highlights, and
generated footage clips more readily than filmed footage.

---

## Grain — the most important setting here

Grain at **8–12%** across the entire timeline is what makes AI-generated stills, generated
video clips, Google Earth Studio renders, and real archival photographs look like they
belong in the same film.

Without it the seams are obvious: the generated material is too clean and the archival is
too noisy. With it, everything sits in one texture. Apply it **last**, on the top-most
adjustment layer, above the grade.

Do not vary grain between shots. Uniform grain is the entire mechanism.

---

## Per-material corrections, applied *before* the house grade

| Material | Correction |
|---|---|
| **Archival photo** | Desaturate to near-mono, then add a warm sepia tint at 15%. Never leave archival at its native colour — it dates the shot and breaks the palette. |
| **Google Earth Studio** | Saturation −20, Temperature +8. Earth Studio renders cold and oversaturated by default. |
| **Generated stills** | Highlights −8. They run hot. |
| **Generated video (720p upscaled)** | Sharpen +8 on top of the house +15, Denoise light. |
| **Flourish chart exports** | Nothing — they're already in the palette. Sit them above the grade layer so the grade doesn't shift the brand colours. |

---

## Audio finishing

| Element | Level |
|---|---|
| Narration (ElevenLabs) | −16 to −14 LUFS, peaks at −3 dBTP |
| Music bed | −26 LUFS under narration, −18 in gaps |
| SFX / stings | −20 LUFS, peaks never above narration |
| **Integrated master** | **−14 LUFS**, true peak **−1 dBTP** |

−14 LUFS is YouTube's normalisation target. Mastering louder than that just gets turned
down, and you lose the dynamic range for nothing.

**Ducking:** side-chain the music bed to the narration, −8 dB, 200 ms attack, 400 ms
release. In CapCut this is the auto-ducking toggle on the music track set to roughly 60%.

**The narration chain, in order:** high-pass at 80 Hz → de-esser → gentle compression
(3:1, −18 dB threshold) → 2 dB shelf at 4 kHz for presence → limiter at −3 dBTP.

ElevenLabs output is already clean, so this is corrective polish, not rescue. Do not
over-process it — heavy compression on synthetic voice is what makes it sound synthetic.
