# Transition Playbook — camera-angle grammar in CapCut Pro

This is the highest-value document in the pipeline. The difference between "AI slideshow"
and "Vox documentary" is almost entirely **how shots connect**, not how they look.

The rule underneath all twelve moves: **a transition is a camera decision, not an effect.**
Never reach for CapCut's built-in transition presets — dissolves, glitches, page turns,
"zoom blur". They read as amateur instantly. Every move below is built from position,
scale, rotation, blur and speed keyframes on the clips themselves.

Timeline: 24fps. All frame counts below are at 24fps.

---

## 1. Axial cut-in
**What:** Same angle, tighter framing. Cut from a wide of a subject to a 60% crop of the
same frame.
**Why:** Snaps attention onto a specific fact the moment the narrator says it.
**CapCut:** Duplicate the still to track 2. Scale 100% → 165%, position centred on the
detail. Hard cut, no transition. Land the cut **on the stressed syllable**.
**Use:** 4–6 times an episode, always on a number or a name.

## 2. The slow push (the workhorse)
**What:** A still that breathes. Scale 100% → 106–108% across the whole shot.
**Why:** This is what makes a photograph feel like footage. It is 70% of the episode.
**CapCut:** Keyframe Scale at frame 0 and at the last frame. **Linear easing, not ease-in-out**
— ease curves make the move feel like an effect. Vary direction: alternate push-in and
pull-out shot to shot so it doesn't become a tic. Never exceed 110% or the softness shows.
**Use:** Default for every archival and illustration still.

## 3. Whip-pan match
**What:** Shot A pans hard left off-frame, shot B enters already panning, motion blur across
the seam.
**Why:** Changes location or era without a title card.
**CapCut:** Last 6 frames of A: Position X → −900, Blur 25–35. First 6 frames of B:
Position X 900 → 0, same blur, blur → 0. Direction must **match** across the cut.
**Use:** 2–3 an episode. More than that is a music video.

## 4. Shape match cut
**What:** A round thing cuts to a round thing. A vertical line cuts to a vertical line.
**Why:** Makes an intellectual connection visually, which is the entire Vox thesis.
**CapCut:** Scale and position both shots so the matching shape occupies the same screen
coordinates. Hard cut. This one is worth spending time on in the shot design stage — it
cannot be fixed in the edit.
**Use:** 1–2 an episode. When it lands it's the moment people remember.

## 5. Speed-ramp punch
**What:** 100% → 400% → 100% inside a single clip.
**Why:** Compresses a span of time — "and then twelve years passed."
**CapCut:** Speed → Curve → Custom. Three points: 1×, 4×, 1×. Optical flow ON. Pair with a
low-pass sweep on the music bed.
**Use:** Timeline jumps only. 1–2 an episode.

## 6. Parallax layer slide
**What:** Foreground, midground and background move at different speeds across a cut.
**Why:** Gives a flat still real depth. This is the paper-cutout Vox look.
**CapCut:** Cut the still into 3 layers (background-removed foreground on top). Position X
keyframes at **−120 / −60 / −20 px** respectively over the shot. The speed *ratio* is what
sells it, not the distance.
**Use:** 5–8 an episode. Best on archival photos with a clear subject.

## 7. Track-back with blur — the Vox signature
**What:** The camera pulls back from a detail to reveal the whole, with a touch of blur at
the fastest part of the move.
**Why:** The single most recognisable Vox move. It reframes what you were just looking at.
**CapCut:** Scale 180% → 100% over 40–56 frames. Add Blur keyframed 0 → 4 → 0, peaking at
40% through the move. **Slight** ease-out at the end only. The blur is what hides the
resolution loss and makes it read as a real camera.
**Use:** 3–4 an episode, always on an act turn.

## 8. Map hand-off
**What:** A Google Earth Studio zoom ends, and the next shot is a still whose horizon and
colour temperature match the last Earth Studio frame exactly.
**Why:** Moves from "here is where" to "here is what it looks like" without a seam.
**CapCut:** Export the Earth Studio move's final frame. Generate the following still with
that frame as reference so the horizon line and light direction match. Cut on the last
frame of camera motion, not after it settles.
**Use:** Every map sequence. This is what stops maps feeling like a separate segment.

## 9. J-cut (audio leads)
**What:** The narration for shot B starts 10–14 frames **before** picture B.
**Why:** Pulls the viewer forward. Invisible, and it does more for pace than any visual.
**CapCut:** Detach audio, slide the VO clip left by 12 frames.
**Use:** On roughly **every third cut**. This is not an accent — it's the base rhythm.

## 10. L-cut (audio tails)
**What:** Ambience or the tail of a music phrase holds 8–12 frames into the next shot.
**Why:** Softens a hard visual change without a dissolve.
**CapCut:** Extend the outgoing audio under the incoming clip, −6 dB fade.
**Use:** Every act transition.

## 11. Graphic wipe
**What:** A moving element in the frame — a chart bar growing, a line drawing itself, a
paper edge sliding — physically covers the frame and reveals the next shot.
**Why:** The transition is made of the information, so it costs zero attention.
**CapCut:** Put the graphic on track 3 with alpha. Keyframe it across frame; place the cut
underneath at the moment of full coverage.
**Use:** 3–5 an episode, always coming out of a chart.

## 12. Cut on motion
**What:** Subject exits frame left; next shot has movement entering frame left.
**Why:** The eye is already travelling, so it never registers the cut.
**CapCut:** No effect at all — this is purely a shot-selection and cut-placement decision.
Match **direction and speed**, not content.
**Use:** Constantly. It's free and it's the difference between choppy and fluid.

---

## Placement rules

- **Cut on the stressed syllable**, never in a pause. Use the word timestamps in
  `vo_timing.json` to find them.
- **Never two identical moves in a row.** Push-in / push-in reads as a broken loop.
  Alternate direction and type.
- **Move type follows act position:**
  - Act 1 — mostly pushes and cut-on-motion. Calm, establishing.
  - Act 2 — parallax, map hand-offs, graphic wipes. This is the dense information act.
  - Act 3 — axial cut-ins and speed ramps. The argument tightens.
  - Act 4 — track-backs and long pulls. Widening out to land.
- **Silence gets stillness.** When the narrator pauses for effect, the picture stops moving
  too. A held frame after 14 minutes of motion is enormously effective.

## Banned

CapCut preset transitions of any kind. Glitch, RGB split, film burn, light leak, page
curl, cube spin, and every "trending" transition pack. Cross-dissolves only between two
archival stills of the same era, and only 8 frames.
