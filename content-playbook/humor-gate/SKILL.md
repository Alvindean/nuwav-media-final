---
name: humor-gate
description: Pass/fail quality gate for humor in short-form videos. Locks the on-camera talent to ONE native humor style (Dolphin, Golden Retriever, Fox, Peacock, Panther, Powerhouse), then checks the script, the delivery and the edit against that style before anything publishes. Use when someone says "is this funny", "humor check", "run the humor gate", "this joke isn't landing", "make this script funnier", or before publishing any video that relies on a joke, bit or comedic beat.
---

# Humor Gate

**Core rule (from McCall Jones' charisma framework):** People are funny with friends and flat on camera because on camera they copy someone else's kind of funny. A Peacock doing Panther looks *boring*. A Panther doing Peacock looks like *"doing too much."* Either way the audience reads it as *"weird, inauthentic."*

So the gate doesn't ask "is this funny?" It asks **"is this funny the way THIS person is funny?"**

Source material: `transcript.md` in this folder.

---

## Step 0 — Lock the talent's style (once per person, store it)

Run this once per on-camera person, save the result to their persona/voice file, and reuse it. Don't re-decide every video.

Watch 2–3 clips of them being funny **off-camera** (voice memos, Zoom calls, phone video with friends). Pick the style whose behaviors you actually see:

| Style | Wall label | Reference | How the funny works | Body / voice tells | Failure mode if forced |
|---|---|---|---|---|---|
| 🐬 **Dolphin** | Bubbly / Bright | — | Light, quick, delighted; laughs at own story, finds joy in the small absurd thing | Big smile, bright pitch, quick head tilts | Reads as fake-cheerful / ditzy |
| 🐕 **Golden Retriever** | Enthusiastic / Energetic | Hugh Jackman, Travis Kelce, Kelly Clarkson | No "bits." Funny comes from contagious, explosive excitement about the thing | Leans in, wide gestures, volume spikes, "That's a FIRST!" | Reads as salesy / hype-man |
| 🦊 **Fox** | Playful / Charming | Ryan Reynolds | Sarcastic, almost biting, never mean. Small bits roughly every 60s. Makes the viewer feel *in on the joke*, even while teasing | Smirk, side-eye, under-the-breath asides, raised eyebrow | Reads as mean / smug |
| 🦚 **Peacock** | Theatrical / Expressive | Marcello Hernandez | Every joke has drama: characters, voices, act-outs, big reactions | Full-body acting, face changes, voice switches | Reads as cringe / try-hard |
| 🐆 **Panther** | Passionate / Deliberate | Nate Bargatze | Weighted, deliberate, deadpan, dry. The pause and the flat face do the work | Still body, slow pace, minimal gestures, monotone | Reads as boring / low-energy |
| 🦁 **Powerhouse*** | Powerful / Loud | — | Funny through force: bold declarations, roast energy, commanding the room | Big voice, planted stance, strong eye contact | Reads as aggressive / yelling |

\*The sixth animal was hidden behind McCall in the frame; "Powerhouse" is our placeholder name. Dolphin and Powerhouse behaviors are our inference from her wall labels; the other four are from her videos. Have the talent take her quiz (comment QUIZ on @mccalljonesofficial) to confirm.

Record: `HUMOR_STYLE: <style>` + one line of evidence ("does voices of his mom on every call" → Peacock).

---

## Step 1 — Script gate (before filming)

Score each line that's meant to be funny. All must pass.

| # | Check | Pass looks like |
|---|---|---|
| S1 | **Style match** — is the joke *built* for the locked style? | Panther: understatement, flat statement of an absurd fact. Peacock: an act-out. Fox: a tease/aside. Retriever: an excited overreaction. Dolphin: a delighted "wait, it gets better." Powerhouse: a bold claim. |
| S2 | **Borrowed-voice check** — would this line only work in a specific comedian's mouth? | If you can hear Reynolds saying it and your talent is a Retriever, rewrite it. |
| S3 | **Rhythm fits style** | Fox: a bit about every 45–60s, not every line. Panther: fewer jokes, longer setups, room for the pause. Peacock/Retriever: energy can be continuous. |
| S4 | **Punchline last** | The funny word is the last word of the sentence. Nothing after it. |
| S5 | **Never mean** (Fox/Powerhouse especially) | The target of the tease is invited in, not pushed out. Swap test: would the target laugh too? |
| S6 | **Funny serves the point** | Cut the joke and the video still teaches/sells, but it's flatter. If cutting it changes nothing, it's filler; if the video needs it to make sense, the point is too weak. |

**Rewrite rule:** don't make a failed line "funnier." Translate it into the talent's style. Example, same idea in three styles:
- Panther: "I've been doing this for ten years. My mom still thinks I'm a DJ."
- Peacock: *(as mom, hand on hip)* "So when do you get a REAL job, mijo?"
- Fox: "Shoutout to my mom, who tells everyone I'm 'in computers.' Close enough, Mom."

---

## Step 2 — Delivery gate (on set / reviewing the take)

| # | Check | Fail signal |
|---|---|---|
| D1 | **Body matches style** | Panther flailing hands; Peacock standing frozen; Retriever "being cool." |
| D2 | **Off-camera baseline** | Compare to the Step 0 clips. If the take is noticeably *smaller* or *bigger* than how they're funny with friends, reshoot. |
| D3 | **No laugh-at-own-joke** (except Dolphin) | Panthers and Foxes who smile through the punchline kill it. |
| D4 | **Pause is real** | Panther/Fox: a ≥0.5s beat before or after the punchline survives. |
| D5 | **Stress check** | Did they tense up into a "presenter voice"? That's the "funny with friends, not on video" failure she describes. Fix: film a warm-up take talking to a friend behind the camera. |

---

## Step 3 — Edit gate (before publish)

| # | Check | Style rule |
|---|---|---|
| E1 | **Don't cut the pause** | Panther/Fox: never jump-cut the beat before the punchline. Tight-cutting deadpan turns it into "boring." |
| E2 | **Don't over-decorate** | Peacock/Retriever already bring energy; meme SFX, zooms and emoji on top = "doing too much." Panther can take one ironic zoom/SFX *after* the line, as a stand-in for a reaction. |
| E3 | **Caption doesn't step on the punchline** | Burned-in captions reveal the punchline word only when it's spoken. |
| E4 | **Proof beat** | If you reference someone else's style (or a contrast), show a 2–4s clip instead of describing it (her Bargatze clip). |
| E5 | **Sound-off read** | Mute it. Does the joke still land through face, body, text or set? If not, add on-screen text or a visual. |

---

## Scoring

- Each check: **Pass / Fix / Fail**.
- **Ship** = no Fails, ≤2 Fixes resolved.
- **Hard fail (auto-reshoot or cut the joke):** S1, S5, D1, D2. These are the "inauthentic" tells the audience notices instantly.
- If a joke fails twice, cut it. A video with no jokes beats a video with a joke in someone else's voice.

Output format:

```
HUMOR GATE — <video title>
Talent: <name>  Style: <style>
Script: S1 ✅ S2 ✅ S3 🔧(bit at 0:08 and 0:14 too close for Fox) S4 ✅ S5 ✅ S6 ✅
Delivery: D1 ✅ D2 ❌(take is half her off-camera energy) D3 ✅ D4 ✅ D5 🔧
Edit: E1 ✅ E2 ✅ E3 🔧 E4 n/a E5 ✅
VERDICT: RESHOOT — D2 hard fail. Warm-up take with friend behind lens.
```

---

## Format lessons to steal from the source video (beyond humor)

These are why her reel hit ~1.5K saves on a niche topic. Use them as a template for our own explainer videos:

1. **Contrarian-permission hook:** "Just because [famous person] does X doesn't mean you should."
2. **Name the exact pain** in one sentence ("funny with friends, not funny on video").
3. **Contrast pair + swap thought experiment:** two famous opposites, then "imagine if A tried to be B."
4. **Proof clip** instead of description.
5. **Open loop:** "Those are just two of six."
6. **Keyword CTA** tied to a lead magnet (comment QUIZ → DM → quiz → email). We already have a survey flow in `pages/survey.tsx`; it could be the destination for a "comment STYLE" CTA.
7. **Framework on the wall:** a permanent visual set piece that teaches with the sound off and makes every video in the series recognizable.
