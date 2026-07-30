# RUN-EPISODE — the executable prompt

Paste the block below into Cowork. Replace the three bracketed values. Everything else runs.

Reviewed by a four-person panel — Operator, Skeptic, Economist, Audience. Their changes are
logged at the bottom.

---

## THE PROMPT

```
Run vox-doc-factory to produce Episode [N] end to end.

TOPIC: [paste from the profitability system]
CHANNEL: [channel name]

═══ BEFORE YOU START ═══

1. Read PLAYBOOK.md at the channel root. Every rule in it is binding.
   If it doesn't exist, create it from the template in
   references/self-healing.md and say so.
2. Call `balance`. Record it as credits_before in episode.json.
3. Read references/self-healing.md. When something fails, walk the ladder —
   retry, degrade, substitute, escalate. Never skip to escalate, never stop
   above it. A degraded output must be LABELLED degraded.
4. Create the episode folder in Drive and write episode.json.

Budget: 450 credits. Hard ceiling 550. Runtime target 14:30, hard floor 11:00.
1920x1080, 24fps.

═══ RUN ALL 12 ROLES AS SEPARATE PASSES ═══
Do not collapse them. Stop at every gate and show me the deliverable.

── STAGE 1 · INTAKE ──
Write the thesis in ONE sentence and the single question the episode answers.
GATE: two sentences means two videos. Split it or narrow it.

── STAGE 2 · RESEARCH ──
Build research.md: dated timeline, key numbers WITH source URL and date,
3-5 primary documents, 2 counter-arguments, what's contested vs settled.
Then fact-check: re-derive every number independently.
GATE: any number without a named, dated source gets CUT, not softened.

── STAGE 3 · SCRIPT ──
2,150-2,450 words, five-act shape per references/script-architecture.md.
Every paragraph carries a bracketed visual note: [MAP: ...] [ARCHIVAL: ...]
Apply every Stage 3 rule from PLAYBOOK.md.
GATE: read it aloud and time it. Under 11:00 of read time, it goes back.

── STAGE 4 · NARRATION ── (before any visuals — the VO is the spine)
  python3 scripts/elevenlabs_tts.py --script script.md \
      --out audio/vo.wav --voice Adam
  whisper audio/vo.wav --model medium --word_timestamps True \
      --output_format json
Listen to every chunk. Proper nouns, place names and numbers are where it
fails. Fix pronunciations with phonetic spelling and re-render that sentence.
GATE: vo.wav duration >= 11:00. Under that, back to Stage 3. Do not pad.

── STAGE 5 · STYLE KEY ──
Lock the visual language per references/style-bible.md, then generate the six
reference frames with nano_banana_pro at 2k.
GATE: all six read as ONE show. Show me all six together.
NOTHING generates before this passes. If it fails 3 times the Style Key is
too vague — rewrite the key, not the frames.

── STAGE 6 · SHOT DESIGN ──
Build shots.json from vo_timing.json + the script's visual notes.
Average shot 3.5-4.5s. Visual reset every 20-25s. Rotate information type
every ~40s — never two of the same back to back. Mark each shot
still | graphic | hero and hold the 70/18/12 mix.
GATE: walk it at 1x. Any 15-second window with no new information gets a
shot added.

── STAGE 7 · GENERATION ──
Project the spend from shots.json FIRST. Over 550, degrade BEFORE generating
per the credit ladder in self-healing.md — never after.
  Stills:  nano_banana_pro 2k (anything with text on it)
           seedream_v4_5 basic (wide plates)
  Hero:    kling3_0_turbo 720p 5s, start_image = a still we already made
           kling3_0 std for 3-4 signature shots
  ALWAYS:  sound "off" / generate_audio false on EVERY clip
  Upscale: bytedance_video_upscale 1080p preset "aigc" — only for 720p clips
           that land FULL-FRAME. About 6 per episode, not 15.
Call `balance` again. Record credits_spent. This number, not the estimate, is
what the cadence decision gets made from.

── STAGE 8 · EDIT, GRADE, FINISH ──
  python3 scripts/assemble.py --shots shots.json --vo audio/vo.wav \
      --music audio/music/bed.wav --srt audio/vo.srt --out edit/rough.mp4
NON-ZERO EXIT MEANS SHOTS WERE SKIPPED. Regenerate them and re-run.
Never publish a run that exited 2.
Then apply references/transition-playbook.md — the 12 camera-angle moves are
the single biggest quality lever here. No CapCut preset transitions, ever.
GATE: watch the full cut once, unpaused, at 1x. Note every second you wanted
to skip. Fix all of them. Then check: does 0:00-0:08 state the question, and
do the last 20 seconds loop back to it?

── STAGE 9 · PACKAGE & PUBLISH ──
Thumbnail: load the Higgsfield workflow FIRST —
  get_workflow_instructions({workflow: "youtube-thumbnail-generator"})
Then 4 variants minimum, differing by emotion and camera take, each its own
generate_image call. nano_banana_pro, resolution "4k" passed explicitly.
No baked text — deliver clean renders and layer the headline as an overlay.
Run the post-render check on every one. Target per references/thumbnail-ctr.md.
Two title variants, 55-65 chars, a question or a surprising claim.
Description carries the FULL source list from research.md. Not optional.
Write metadata.json and drop the master in /Vox Docs/_READY_TO_UPLOAD/.
The Make scenario picks it up and uploads it PRIVATE or SCHEDULED.
containsSyntheticMedia = true. Declare it honestly.
GATE: I flip it public. Never publish straight to public.

═══ DELIVER ═══
1. The master in Drive
2. episode.json with the REAL credit spend
3. metadata.json for the publish scenario
4. A one-page HTML build report in my usual format:
   runtime, credits spent vs projected, which gates needed a second pass,
   every degraded output and why, and what you'd change next time.

═══ THEN SET THE LEARNING LOOP ═══
Schedule a task for 72 hours after publish:
  - pull retention curve, AVD %, CTR, and the 30-second retention number
  - find the single biggest drop over 5 points, convert the timestamp to a
    line in script.md, diagnose what was happening there
  - write exactly ONE new rule into PLAYBOOK.md with the evidence attached
  - log runtime, credits, CTR and AVD to the ledger
  - if CTR is below the channel's rolling average, swap to thumbnail
    variant B and log both numbers after another 48 hours
ONE rule. A review that produces six produces zero followed rules.
PLAYBOOK.md caps at 25 active rules — at the cap, the weakest-evidence rule
retires to make room.

═══ WHAT YOU MAY NEVER SELF-HEAL ═══
- A fact with no source → cut it or stop
- Runtime under 11:00 → never pad with slow shots
- A failed Retention Gate → never publish because the deadline is close
- A missing synthetic-media declaration → never omit it
- Placeholder connections → never guess an ID
Everything else: walk the ladder and keep going.
```

---

## Before episode 1 — one-time setup

```
vox-doc-factory season setup for [CHANNEL NAME].

1. Confirm the toolchain. Report anything missing rather than working around it:
     ffmpeg -version          (assembly + narration concat)
     whisper --help           (word timestamps)
     echo $ELEVENLABS_API_KEY (narration; must be set)
     balance                  (Higgsfield credits)
2. python3 scripts/elevenlabs_tts.py --list-voices
   Render 60 seconds of a real script excerpt in the top 2 candidates.
   I approve the voice before we commit to a season of it.
3. Build the Style Key and the six reference frames. Show me all six together.
   Brand colours: [hex values]
4. Build the reusable asset library — texture plates, map bases, lower thirds,
   chart shells, transition elements. This is what cuts ~25% off the stills
   line from episode 4 on.
5. Build the Flourish chart templates styled to the palette.
6. Create PLAYBOOK.md, empty, with the five stage sections.
7. Import blueprints/vox-doc-youtube-publish.json into Make and tell me
   exactly which three IDs I need to fill.

Then stop and wait for me.
```

---

## Filling the two gaps

### ElevenLabs — no MCP, so it runs over the API

```bash
export ELEVENLABS_API_KEY="sk_..."     # elevenlabs.io -> Profile -> API Key
pip install requests
python3 scripts/elevenlabs_tts.py --list-voices
```

`scripts/elevenlabs_tts.py` chunks the script by act, renders each chunk with the house
settings, and concatenates to 48kHz mono. It strips the bracketed visual notes first —
without that the narrator reads "MAP colon Persian Gulf" out loud.

Put the key in the environment, not in a file. If it isn't set the script says exactly what
to do rather than failing obscurely.

### CapCut — no API anywhere, so assembly is programmatic

```bash
python3 scripts/assemble.py --shots shots.json --vo audio/vo.wav --out edit/rough.mp4
```

Builds the whole timeline in ffmpeg: every shot cut against the narration's real word
timings, camera moves keyframed, the house grade and grain applied, captions burned, mastered
to −14 LUFS.

**Verified end to end** — 1920×1080, 24fps, h264/aac, grade and grain confirmed on output
frames, and a deliberately missing source was skipped, logged, and exited 2.

The output is publishable as-is. The recommended workflow is the hybrid: this builds the cut,
then a human spends ~45 minutes in CapCut upgrading the 15–20 transitions that carry the
episode. Option B — ship the automatic cut untouched — stays available for a busy week.

---

## What the four-person panel changed

Each reviewer read the draft prompt with one question. All four found something real.

**The Operator — "could someone actually run this?"**
The draft said "generate the narration" and "assemble the edit". Both are unrunnable
instructions. Replaced with the literal commands, including the Whisper invocation and its
flags. Added the one-time setup block, because a prompt that assumes a configured machine
fails on the first run and looks like a prompt bug.

**The Skeptic — "what fails silently?"**
Three silent failures found and closed:
- `assemble.py` exiting 2 was invisible in the draft. Now called out explicitly — a skipped
  shot that nobody notices is the worst possible outcome, because the episode looks finished.
- "Fix pronunciations" had no trigger. Now names *where* it fails: proper nouns, place names,
  numbers.
- The Style Key gate could loop forever. Now: three failures means the key is wrong, so
  rewrite the key rather than re-rolling frames.

**The Economist — "where does money leak?"**
The draft projected spend *after* generating, which makes the budget gate decorative. Moved
the projection before generation and pointed at the degradation ladder. Also made `balance`
mandatory on both sides — without the second call there's no ledger, and without a ledger the
2-vs-3-per-week decision stays guesswork forever.

**The Audience — "will anyone watch it?"**
The Retention Gate was "watch it once", which is not a standard. Added the two specific
checks that predict the most: does 0:00–0:08 state the question, and do the last 20 seconds
loop back to it. Added the thumbnail A/B swap at 48 hours — the +20–40% figure comes from the
loop, not from any single thumbnail. Capped the learning loop at one rule per episode, because
six rules per review is how a playbook becomes wallpaper.
