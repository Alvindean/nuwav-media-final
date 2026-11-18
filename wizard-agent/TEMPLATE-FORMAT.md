# Wizard Agent template format (v1)

One template = one JSON file at `templates/<category>/<id>.json`.
Check every template with: `node wizard-agent/tools/validate.mjs` (add `--expect 100` to also check the full set).

## Categories (10 x 10 = 100)
`education`, `reveal`, `story`, `behind-the-scenes`, `comparison`, `lists`, `mindset`, `gamification`, `comedy`, `songwriting`

## Fields
| Field | Rule |
|---|---|
| `id` | `<category>-<NNN>-<slug>`, e.g. `comedy-003-wrong-answers-only`. Must equal the file name (without `.json`). NNN is 001-010 inside the category. |
| `version` | `1` |
| `name` | Short human name. Unique across all templates. |
| `category` | One of the 10 above, and must match the folder. |
| `format` | `reel`, `carousel` or `both`. |
| `goal` | `awareness`, `engagement`, `leads`, `sales` or `trust`. |
| `duration_seconds` | Reels and `both` only: 7-60, and equal to the sum of beat seconds. |
| `aspect_ratio` | `9:16`, `4:5` or `1:1`. |
| `best_for` | 3+ niches, e.g. `law firm`, `coffee shop`, `independent musician`. |
| `why_it_works` | 40+ characters: the psychology, in plain words. |
| `hook` | `{ "pattern": "...", "examples": [3 lines, each 14 words or fewer] }` |
| `variables` | `[{ "name": "snake_case", "description": "...", "example": "..." }]`. Every `{{name}}` used anywhere must be declared here, and every declared variable must be used. |
| `beats` | Reels and `both`: 3-10 beats. Each beat: `{ "seconds", "purpose", "on_screen_text", "voiceover", "visual": { "tier", "prompt" } }`. First beat is the hook and is 3 seconds or less. `voiceover` may be `""`. |
| `visual.tier` | One of the tiers in `model-routing.json`: `still`, `clip_draft`, `clip_standard`, `clip_hero`, `talking_head`, `text_only`. `prompt` is required unless the tier is `text_only`. |
| `cta` | The call to action. |
| `carousel` | Required for `carousel` and `both`: `{ "slides": [5-10 x { "headline" (10 words or fewer), "body", "visual_prompt" }] }`. |
| `craft` | `{ "technique": "...", "notes": "..." }`: the craft move (comedy: the setup and turn; songwriting: the hook/lyric device). 30+ characters of notes. |
| `do_not` | 1+ pitfalls to avoid. |
| `compliance` | Required, 1+ items, when `best_for` includes a regulated niche (law, legal, attorney, dental, dentist, med spa, medical, doctor, clinic, chiropractor, health, supplement, financial, insurance, mortgage, real estate, therapist, pharmacy). |

## Budget rules (from `model-routing.json`)
- At most 3 clip beats (`clip_draft`, `clip_standard`, `clip_hero`, `talking_head`) per reel.
- At most 1 `clip_hero` beat per reel.
- Quoted credits per reel must be 30 or less. Clips are charged per started 5 seconds.

## Banned text
No `TODO`, `TBD`, `lorem`, `[insert`, `xxx`, or empty strings in required text fields.
