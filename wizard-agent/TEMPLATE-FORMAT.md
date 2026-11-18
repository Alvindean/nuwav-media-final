# Wizard Agent template format (v4)

One template = one JSON file at `templates/<category>/<id>.json`.
Check templates with `node wizard-agent/tools/validate.mjs` (add `--expect 100` to also check the full set). Prove the checker itself with `node wizard-agent/tools/selftest.mjs`.
Options: `--expect N`, `--json`, `--niche "client niche"` (repeatable).
Exit codes: `0` all pass, `1` a template or set check failed, `2` usage or path error (including a path with no template files).

The validator checks **format, timing, budget, compliance (by what the rules say), obvious junk, near-copies, and how the script reads once filled with the variables' examples**. It does not judge whether an ad is good; the creative audit does that. Before rendering for a client, put the client's real values in the `example` fields of a copy and validate that copy with `--niche "<client niche>"`, so the client's own compliance pack applies (its disclosure line must appear; an empty `disclosure` is allowed only with `--niche` when no pack matches).

## Categories (10 x 10 = 100)
`education`, `reveal`, `story`, `behind-the-scenes`, `comparison`, `lists`, `mindset`, `gamification`, `comedy`, `songwriting`

## Fields (no other fields are allowed, at any level)
| Field | Rule |
|---|---|
| `id` | `<category>-<NNN>-<slug>`, e.g. `comedy-003-wrong-answers-only`. Must equal the file name. NNN is 001-010. |
| `version` | `1` |
| `name` | Unique across all templates. |
| `category` | One of the 10, matching the folder. |
| `format` | `reel`, `carousel` or `both`. |
| `goal` | `awareness`, `engagement`, `leads`, `sales` or `trust`. |
| `duration_seconds` | Reels and `both` only: 7-60, equal to the sum of beat seconds. |
| `aspect_ratio` | `9:16`, `4:5` or `1:1`. |
| `best_for` | 3+ different niches. |
| `why_it_works` | 8+ words: the expected psychology, in plain words (not a measured result). |
| `hook` | `{ "pattern": 4+ words, "examples": [3 different lines, each 3-10 words once variables are filled] }` |
| `variables` | `[{ "name": "snake_case", "description", "example" }]`. Every `{{name}}` used must be declared and every declared one used. The example is used to check word counts. |
| `beats` | Reels and `both`: 3-10 beats of `{ "seconds" (1+), "purpose", "on_screen_text", "voiceover", "visual": { "tier", "prompt" } }`. First beat is 3 seconds or less. Each beat needs real words in on-screen text or voiceover. |
| Timing | Once filled, voiceover and on-screen text each fit about 3 words per second: at most `floor(seconds x 3) + 1` words. |
| `visual.tier` | `still`, `real_photo`, `text_only`, `clip_draft`, `clip_standard`, `clip_hero`, `talking_head`. `prompt` (5+ words) is required unless the tier is `text_only`. |
| Real people | A beat about a testimonial, before/after, customer or client quote, or real customers/patients must use `real_photo` (or `text_only`). Never a generated person. |
| `music` | `{ "tier": "music", "bpm": 50-200, "feel": 2+ words of genre and instruments (never an artist, song or sound-alike), "vocals": true/false }`. **Required on songwriting reels** unless the craft notes say the artist's own master/track plays. Priced per second of the reel, up to 120s. |
| `cta` | 2+ words once filled. No engagement bait ("tag a friend", "like if"). |
| `carousel` | Required for `carousel` and `both`: 5-10 slides of `{ "headline" (10 words or fewer), "body" (2+ words), "visual_prompt" (5+ words) }`. |
| `craft` | `{ "technique", "notes": 8+ words }`: comedy names the setup, turn and tag; songwriting names the hook device. |
| `do_not` | 1+ pitfalls, 3+ words each. |
| `compliance` | Rules of 3+ real words. For every pack in `compliance/packs.json` that `best_for` matches (plurals and -ies included, `exclude` look-alikes skipped), at least one rule must contain one of that pack's `key_phrases`. A prize, contest or giveaway anywhere (variables included) needs official rules / no purchase necessary. |
| `disclosure` | Its example must contain a real pack disclosure line (24 words max). Templates that match a pack with a `disclosure` line must declare a `disclosure` variable and show `{{disclosure}}` in a reel beat's on-screen text and in a carousel slide (whichever formats the template has). Its words don't count toward timing. |
| Claims | Each matched pack's `banned_phrases` are blocked (for example pain-free, permanent results, approval in minutes, no credit check, always win, quit your job, dress sizes). Never allowed: numeric weight/body results ("minus 30 lbs"), comparisons to a named brand ("better than Starbucks"), engagement bait (tag someone, comment YES for, comment A or B, drop a 🔥 if, reply YES, double tap, share this with a friend, like if). For legal, medical, financial, wellness, income, real-estate and auto niches: no outcome claims (guaranteed, cure, painless, risk-free, pre-approved, % returns) unless negated ("no guarantees"). |
| Story facts | In `story` templates, a hook example with a number must take it from a variable. |
| Reading | Once filled: "a"/"an" correct, no double punctuation, no lowercase letter after a sentence end, CTA and slide bodies start with a capital. |

## Budget (from `model-routing.json`)
- Generated clips use whole seconds, within each model's minimum and maximum, priced per second; talking heads reserve 10 credits per beat; music is priced per second; every still and carousel slide is 0.25.
- At most 3 clip beats and 1 `clip_hero` per reel.
- One final ad, reel and carousel together, must quote **30 credits or less**. Draft previews are extra and are quoted before a batch.

## Banned
`TODO`, `TBD`, `lorem`, `ipsum`, `xxx`, `placeholder`, `[insert`; any character repeated 6+ times in a row; two templates that are 80%+ the same wording under different ids.
