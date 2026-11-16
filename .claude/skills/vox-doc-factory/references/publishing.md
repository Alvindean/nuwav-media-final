# Publishing — Drive → Make.com → YouTube

The finished master goes to a watched Google Drive folder. Make.com picks it up, uploads
it to YouTube as **private or scheduled**, writes the metadata, and posts a notification.
A human flips it public.

---

## Why a human still flips the switch

Everything up to the upload is automated. The publish itself is not, and shouldn't be:

- YouTube's **inauthentic / mass-produced content** policy is the live risk for any AI-
  assisted channel at 2–3 uploads a week. A human confirming each episode is the cheapest
  possible insurance against a channel-level strike.
- A fact error caught at the scheduled-upload stage costs nothing. Caught after publish it
  costs a re-upload and the video's entire algorithmic head start.

Scheduling counts as hands-off. Publishing blind does not.

---

## The Make.com scenario

**Account status:** Make plan is **Core — 10,000 operations/month**. Google is connected
(both accounts). **YouTube is not connected yet** — that is the one gap that blocks this.

The scenario is roughly 15–25 operations per episode, so 12 episodes a month is ~300
operations. Not a constraint.

### Modules

1. **Google Drive — Watch Files in a Folder** (`/Vox Docs/_READY_TO_UPLOAD/`)
   Trigger on new `.mp4`.
2. **Google Drive — Download a File** — get the master.
3. **Google Drive — Search Files** — find the sibling `metadata.json` by filename prefix.
4. **JSON — Parse JSON** — title, description, tags, chapters, category, publish time.
5. **YouTube — Upload a Video**
   - Privacy: **`private`** (or `private` + `publishAt` for a scheduled release)
   - Category: **27 (Education)** or 25 (News & Politics), per episode
   - Made for kids: **No**
   - Language: en
6. **YouTube — Upload a Thumbnail** — from `/publish/thumbnail.png`.
7. **Google Sheets — Add a Row** — the episode log: title, URL, upload date, credits spent,
   runtime.
8. **Email / notification** — "EP07 is uploaded and scheduled for Thursday 9am ET. Review
   and publish: [link]".

### Error handling

Put an error handler on module 5. YouTube's daily upload quota and transient auth failures
are the two realistic failures. The handler should retry once after 10 minutes, then email.

---

## Metadata spec

`metadata.json` is produced by the Packaging role in Stage 9.

### Title
Two variants written, one chosen. Vox titles are **a question or a surprising claim**,
55–65 characters, no clickbait punctuation, no ALL CAPS.

- Good: `Why every chip factory ends up in the same three places`
- Good: `The 21-mile gap that a fifth of the world's oil goes through`
- Bad: `You WON'T BELIEVE what's happening with chips right now!!`

### Description

```
[2–3 sentence summary that stands alone in search]

Chapters:
0:00 [cold open title]
0:35 [act 1 title]
...

Sources:
[Every claim's source, named, with URL and date — from research.md]

—
Produced by Nu Wav Media.
```

**The sources block is not optional.** It is the Fact Gate made public, it is what
distinguishes this from scraped-content channels, and it is the thing a reviewer looks at
if the channel is ever flagged.

### Chapters
Generated from the act boundaries in `shots.json`. YouTube requires the first chapter at
`0:00` and a minimum of three chapters, each at least 10 seconds.

### Tags
8–12, specific to the topic. Broad tags do nothing.

### End screen
Last 20 seconds: subscribe element plus the best-performing related episode. Set in
YouTube Studio; the automation does not handle end screens.

---

## Cadence and scheduling

**2 episodes a week to start**, moving to 3 once the asset library is deep and the real
credit ledger supports it.

Slots: **Tuesday and Thursday, 9:00 AM ET** (adding **Saturday 10:00 AM ET** at 3/week).
Consistency matters more than the specific slot — pick these and hold them.

Never upload two episodes on the same day. It splits the audience between them and halves
both videos' first-24-hour signal.

---

## After publish — the Performance Analyst loop

72 hours after each episode goes public, pull:

- **Retention curve** — mark every drop over 5 percentage points
- **Average view duration** as a percentage of runtime
- **Click-through rate** on the thumbnail
- **The 30-second retention number** — this is the one that predicts everything else

Take the biggest drop-off point, find that timecode in `script.md`, and write down what was
happening there. That single note becomes a required input to the next episode's Story
Producer pass.

Three episodes of this and the drop-off pattern is usually obvious and fixable.
