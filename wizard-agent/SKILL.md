---
name: wizard-agent
description: NU WAV Wizard Agent. Turns a brand + niche into finished short-form ads and carousels from the 100-template library. Best model writes the creative (hooks, scripts, comedy, lyrics); cheap Higgsfield models render it; Canva builds carousels. Use when asked to "make ads", "run the wizard", "make 10 reels for <client>", "turn this into a carousel", or "remix this viral video".
---

# Wizard Agent (v2)

One agent, every step: **brief → pick templates → write → quote → one yes → render cheap → carousel → check → deliver.**
House rule: **the best model thinks, the cheap model renders.** Build every ad mostly from stills (pan and zoom are added in the edit for free); generate motion only for the beats that need it.

Files this agent uses (all in `wizard-agent/`):
- `templates/<category>/*.json`: the 100 templates (format: `TEMPLATE-FORMAT.md`)
- `model-routing.json`: which model renders each tier, per-second prices and minimum lengths
- `compliance/packs.json`: rules by client niche, plus rules that apply to every ad
- `tools/validate.mjs`: format, timing, budget and compliance-trigger checks. Run it after editing any template. It checks structure, not whether an ad is good.

## 1. Brief (ask once, in one message)
Brand name, niche, offer, audience, goal (awareness / engagement / leads / sales / trust), how many ads, platforms, and whether a clone or presenter is wanted.
If they already gave it, don't ask again. Missing optional answers: use sensible defaults and say which.

## 2. Pick templates and the client's compliance pack
- Find the client's pack in `compliance/packs.json` by their niche (its `match` terms). Apply that pack **and** the `always` rules to every ad, on top of each template's own `compliance` list. A template's `best_for` list is a guide, not a lock, so the client's pack is what keeps the rules attached.
- Filter `templates/` by `goal`, then by `best_for` closest to the niche.
- Mix categories across a batch (no more than 3 from one category per 10 ads).
- Comedy and songwriting are NU WAV's edge: include at least one of each in every batch of 5+, unless the brand says no humor or the niche's pack rules out the format.
- Coverage: the library fits most local-business, professional-service, creator, e-commerce and music niches. It has thin or no coverage for home services, B2B/SaaS, nonprofits, churches, pets, salons, bars and car dealers; adapt the closest template and say so.

## 3. Write (best model, no credits)
Fill every `{{variable}}` for the brand. Then rewrite hooks and lines so they sound like this brand, not the template.
- Keep the template's beat timing, the hook at 3 seconds or less, and about 3 words per second.
- Start sentences with a capital letter after filling a variable.
- Comedy: keep the setup → turn → tag in `craft.notes`; cut any line that needs explaining.
- Songwriting: keep the sung line to one breath (about 8 syllables), stressed syllables on the beat, one idea. No real songs, lyrics or melodies; no named-artist sound-alikes. Real artists promoting their own song use their real track and real performance footage (`real_photo`), never an AI version of them singing.
- Show the client the filled script before anything that costs credits.

## 4. Quote everything, then get ONE yes
Nothing that costs credits runs before this step, including stills.
1. List every paid call for the batch: stills (`estimate_image_cost`), clips (`estimate_video_cost` with **duration always set**: `kling_4_0_flash` defaults to 10s and 30 credits), music (`estimate_audio_cost`), talking heads (quote with the real voice recording), draft previews and their final re-renders, vidIQ calls that cost credits (for example a transcript is 5 credits), and any Canva AI features.
2. Show the total and the per-ad breakdown in plain words.
3. Wait for a clear yes. No yes, no spend. If the plan changes, re-quote.

## 5. Render cheap (Higgsfield)
Per beat, use the tier in the template and the model in `model-routing.json`:
| Tier | Model | Price (quoted 2026-11-18) |
|---|---|---|
| `still` | `gpt_image_2_6` (low, 1k) | 0.25 per image |
| `real_photo` | client's own photo or footage | 0 |
| `text_only` | none, assembled in the edit | 0 |
| `clip_draft` | `grok_video_v15_lite` | 1 per second, 2s minimum |
| `clip_standard` | `kling3_0_turbo` | 1.5 per second, 3s minimum |
| `clip_hero` | `kling_4_0_flash` | 3 per second, 3s minimum, **ask first** |
| `talking_head` | `intone` | quote per job (needs a voice recording); budget 10 per beat |
| `music` | `elevenlabs_music_v2_5` (custom lyrics) | about 0.145 per second |

Order of work: stills first and get a yes on the look, then clips from those stills, then music, then the edit.

## 6. Carousels (Canva)
For `carousel` and `both` templates: send the filled `carousel.slides` to Canva (`create-design`, or `autofill-design` with the client's brand kit). Slide art reuses the stills already made, so carousels cost no extra video credits. Make sure at least two slides add something the reel doesn't (a checklist, a worked number, something worth saving).

## 7. Check before delivery
- Hook lands in 3 seconds or less; captions readable on a phone; one idea per beat.
- Every claim is true for this brand; the client's pack and the template's compliance items are followed.
- Realistic AI people or scenes carry the platform's AI-content label. Testimonials, before/after, real staff and real customers are real photos with written consent, never generated.
- No real competitor named or mocked; no real person's face or voice without written consent (clones are the client's own face and voice only).
- No engagement bait ("tag a friend", "like if"). Contests and giveaways carry official rules.
- Output list: each ad's file, its template id, credits spent.

## 8. Remix a viral video (optional)
Given a link: quote the vidIQ transcript call first (step 4), get the structure, map it onto the closest template's beats, then run steps 3-7. Copy the *structure*, never the footage, audio, script or creator's likeness.

## Not proven yet
- Prices are Higgsfield quotes from 2026-11-18 and can change, so re-quote every batch.
- No full ad has been rendered end to end yet: no generation credits have been spent on this build.
- `talking_head` cost is a 10-credit reserve until a real voice recording is quoted.
- `why_it_works` describes the expected mechanism; no template's performance has been measured.
- "Comedy and songwriting are NU WAV's edge" is the intent; it has not been tested against other libraries.
- Compliance packs are general guidance for drafting, not legal advice.
