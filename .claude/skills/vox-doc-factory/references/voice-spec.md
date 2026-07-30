# Narration Spec — ElevenLabs Pro

The VO is produced **before any visuals**. It is the spine of the episode; picture is cut
to it. Everything downstream — `shots.json`, cut placement, chapter markers — is derived
from `vo_timing.json`.

---

## The voice we're casting for

Vox narrators are working journalists, not voice actors. The read is **conversational,
curious, mid-30s, warm, slightly informal** — someone explaining something they find
genuinely interesting. It is emphatically *not* the deep authoritative documentary-trailer
voice; that register belongs to a different genre and it makes an explainer feel pompous.

### Recommended: **Adam**

The best-documented ElevenLabs voice for non-fiction, technical and explanatory narration.
Natural mid-range, doesn't editorialise, holds up across a 15-minute read without becoming
monotonous. **This is the launch pick.**

### Alternatives, by episode type

| Voice | Fits |
|---|---|
| **Charlotte** | Human-story and first-person episodes — memoir register, more intimate |
| **Alice** | A female-led channel identity with the same conversational warmth as Adam |
| **Bill** | Historical / archival-heavy episodes where an older narrator reads as authority |

**Pick one and stay with it.** Voice consistency *is* channel identity at this cadence.
Alternating narrators across a 2–3× weekly schedule reads as inconsistency, not variety.

### The upgrade path — do this by episode 10

ElevenLabs Pro includes **Professional Voice Cloning**. Record 30 minutes of clean source
audio (or license a voice actor for a one-time session) and clone it. Two payoffs: the
channel gets a voice nobody else on YouTube has, and you stop being exposed to a library
voice being retired or restyled mid-season.

---

## Model and settings

**Model: `eleven_v3`**, Natural stability mode.

| Setting | Value | Note |
|---|---|---|
| Stability | **0.55** | Lower adds natural variation — the read sounds delivered, not recited. Below 0.45 it drifts over a long read. |
| Similarity | **0.75** | |
| Style | **0.35** | Enough colour for emphasis; higher starts acting |
| Speaker boost | **On** | |
| Speed | 1.0 | Control pace in the writing, not the slider |

**Fallback: `eleven_multilingual_v2` at stability 0.50.** v2 is more predictable across
long continuous reads. If v3 drifts in tone between the top and the bottom of a 15-minute
script, switch — consistency beats expressiveness at this length.

### Audio tags (v3)

Use sparingly — 6 to 10 in a whole script. They are for the moments that carry the argument.

```
[curious] So why does every fab end up in the same three places?
[pause] Nobody actually knows.
[emphasis] Twenty billion dollars.
```

Over-tagging makes the read theatrical, which is the exact failure mode to avoid.

---

## Production process

1. **Chunk the script into act-sized blocks** (300–500 words). Do not render 2,400 words in
   one call — a single bad word forces a full re-render, and the seams between blocks are
   inaudible when the settings match.
2. Render each block. Same voice, same settings, every time.
3. **Listen to every block once.** Flag mispronunciations — proper nouns, place names,
   acronyms and numbers are where it fails.
4. **Pickups:** re-render only the offending sentence, then splice. For a stubborn word,
   spell it phonetically in the input (`Hormuz` → `Hor-mooz`). Never leave a wrong
   pronunciation because a re-render is inconvenient — it is the single most credibility-
   damaging thing in an explainer.
5. Concatenate to `vo.wav`: 48 kHz, mono, −3 dBFS peak, **unprocessed**. The grade and the
   audio chain happen in Stage 8.
6. Run Whisper with word timestamps → `vo_timing.json`.
7. **Gate 4:** duration ≥ 11:00. Under that, back to Stage 3.

---

## Pacing

Write for **150–160 wpm**. 2,150–2,450 words lands 13:30–16:00.

Pace lives in the writing, not the speed slider:
- Short sentences read fast. Long ones read slow. Use that.
- A full stop is a beat. A paragraph break is a breath.
- Numbers read slower than they scan — budget extra time for any sentence with three of them.

---

## Character budget

ElevenLabs Pro is 500,000 characters a month.

| | Characters |
|---|---|
| One 15-min episode (~2,300 words) | ~13,000 |
| 8 episodes/month (2×/week) | ~104,000 |
| 12 episodes/month (3×/week) | ~156,000 |
| Plus pickups and re-renders (~40% overhead) | +65,000 |

Even at 3/week with heavy re-rendering that's roughly **220,000 of 500,000** — comfortable
headroom, and room for shorts, trailers and channel IDs from the same voice.
