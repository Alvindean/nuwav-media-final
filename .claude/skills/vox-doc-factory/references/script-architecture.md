# Script Architecture — the Vox 15-minute shape

Target 2,150–2,450 words. At 150–160 wpm that reads 13:30–16:00.
Hard floor is 11:00 of *read* time, checked at Gate 4 against the real VO file.

---

## The five acts

| Act | Timecode | Words | Job |
|---|---|---|---|
| **0. Cold open** | 0:00–0:20 | 45–60 | One arresting fact or image. No preamble, no "hey everyone". |
| **0b. Title stamp** | 0:20–0:35 | 25–35 | State the question the video answers, out loud, plainly. |
| **1. Setup** | 0:35–3:00 | 350–400 | Why this matters, and why *now*. Establish the stakes before the history. |
| **2. Mechanism** | 3:00–7:30 | 650–750 | How it actually works / how it came to be. Maps and timelines live here. |
| **3. Complication** | 7:30–11:30 | 600–700 | The counter-argument, the cost, the thing that makes it not simple. |
| **4. Stakes & landing** | 11:30–15:00 | 450–550 | Where it goes, what to watch for, and the loop back to the cold open. |

### The cold open

The single highest-leverage 20 seconds in the episode. Rules:

- Start **mid-motion**. No establishing, no throat-clearing.
- Lead with the most specific, strangest true detail you found in research — not the
  broadest framing.
- The last line of the cold open is a **question the viewer now wants answered**.
- Never open with a definition. Never open with "In 1947...".

Bad: *"Semiconductors are the foundation of the modern economy."*
Good: *"This building cost twenty billion dollars. It makes one thing. And if it stops for
four hours, everything inside it is garbage."*

### The title stamp

15 seconds. The question, said plainly, then the title graphic. This is where the viewer
decides to stay. Do not be clever here — be clear.

### The landing and the loop

The last 20 seconds return to the cold open's image or phrase, now meaning something
different because of everything in between. This is the retention mechanism: it makes the
open pay off, which is what drives both completion and rewatch.

Run the `infinite-loop` skill on the ending if the callback isn't landing.

---

## Line-level register

Vox narration is a person working something out, not an authority announcing it.

**Do:**
- Short sentences. One idea each.
- Concrete nouns and real numbers. "Forty-one thousand containers" beats "a huge volume".
- Second person occasionally: "You've probably seen this map."
- Admit uncertainty where it exists: "Nobody actually agrees on this part."
- Use the turn word — *but*, *except*, *the problem is* — to pivot between acts.

**Don't:**
- No stacked clauses. If a sentence has three commas, break it.
- No rhetorical questions in a row.
- No "in today's video". No "let's dive in". No "buckle up".
- No adjectives doing the work a number could do.

---

## Visual notes are part of the script

Every paragraph carries a bracketed note. These become `shots.json`.

```
The strait is twenty-one miles wide at its narrowest point. [MAP: Persian Gulf,
zoom from region to 3km over Hormuz, highlight shipping lane in accent-01]

A fifth of the world's oil goes through it. [CHART: stacked bar, world oil transit
by chokepoint, Hormuz bar builds last and dominates]

In 1988 it was mined. [ARCHIVAL: USS Samuel B. Roberts, paper-cutout treatment,
slow push 100→106%]
```

Note types: `MAP` · `CHART` · `TIMELINE` · `ARCHIVAL` · `ILLUSTRATION` · `QUOTE` ·
`HERO` · `TYPE` (kinetic typography) · `DIAGRAM`.

Rotate them. Two of the same type back to back is a Gate 6 failure.

---

## Density budget

| Every... | There is... |
|---|---|
| 3.5–4.5 s | a cut |
| 20–25 s | a visual reset (scale, colour, or information type changes hard) |
| ~40 s | a new information *type* |
| ~90 s | a new sub-question stated out loud |
| ~4 min | an act turn |

If a 15-second window has no new information, it is dead air even if the narrator is
still talking. Fix it in the shot list, not in the edit.

---

## Sourcing inside the script

Contested claims get flagged in the narration itself, not just in the description:
*"The official figure is 12 percent. Independent estimates put it closer to 20."*

Every number that appears on screen must exist in `research.md` with a URL and a date.
That's the Fact Gate, and it is what keeps the channel out of trouble on a topic
selected for profitability rather than for the writer's expertise.
