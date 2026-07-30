# The Cowork Prompt

Paste this into Cowork to run one episode end to end. Replace the bracketed values.

---

```
Run the vox-doc-factory skill to produce Episode [N].

TOPIC: [paste the topic from the profitability system]
THESIS: [one sentence — the single claim the episode makes]
THE ONE QUESTION: [the question the video answers, in plain words]

Runtime target 14:30. Hard floor 11:00. 1920x1080, 16:9, 24fps.
Cadence slot: [Tuesday / Thursday / Saturday] 9:00 AM ET.

Run all 12 roles as separate passes. Do not collapse them.
Stop at every gate and show me the deliverable before continuing.

Budget: lean profile, ~450 Higgsfield credits. Call `balance` before and after
and log the real number. If the projected spend goes over 550, downgrade hero
clips to stills-with-camera-move before generating, not after.

Non-negotiables:
- generate_audio: false / sound: "off" on every generated clip
- every hero clip is image-to-video from a still we already generated
- nothing generates until the Style Key is locked (Gate 5)
- every on-screen claim gets a named, dated source in the description
- upload lands PRIVATE or SCHEDULED — I flip it public

Deliver at the end:
1. The finished master in Drive at /Vox Docs/EP[N]_[slug]_[date]/
2. episode.json with the real credit spend
3. metadata.json ready for the Make.com publish scenario
4. A one-page HTML build report in my usual format — runtime, credits spent
   vs projected, which gates needed a second pass, and what to change next time
```

---

## Running just one stage

```
vox-doc-factory, Episode [N], Stage [X] only. Here's the state:
[paste episode.json]
```

## The weekly standing instruction

```
Every Monday: pull the next topic from the profitability system, run
vox-doc-factory Stages 1 through 4, and show me the script and the VO before
you go any further. If the VO comes in under 11:00, fix the script and tell me
what you added.
```

## Kicking off the season (run this once, before Episode 1)

```
vox-doc-factory season setup:

1. Build the Style Key and the six reference frames. Show me all six together
   before locking. Channel is [name], brand colours [hex values].
2. Build the reusable asset library — texture plates, map bases, lower thirds,
   chart shells, transition elements.
3. Build the Flourish chart templates styled to the palette.
4. Build the CapCut template project with VOX-HOUSE-01 saved as a preset,
   caption style set, and the transition presets ready.
5. Draft the Make.com publish scenario and tell me exactly what I need to
   connect. YouTube is not connected yet — that's the blocker.
6. Give me the ElevenLabs settings locked in and a 60-second test read of a
   real script excerpt so I can approve the voice before we commit to it.

Then stop and wait for me.
```
