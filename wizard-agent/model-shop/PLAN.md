# Model Shop: one character, every model, the cheapest one that's good enough

Goal: make **Alvin's avatar** look right everywhere, find the cheapest model that matches Seedance-level quality, then move the winner to a **free (local) or near-free** workflow.

## The 4 steps
1. **Character pack**: `characters/alvin/bio.md` (look, wardrobe, voice, do/don't) plus the reference photo already saved in Higgsfield as the element **"Alvin Dean"**.
2. **Shop it**: the same 3 prompts on every model that can take the Alvin element (images), then the best still animated on every video model. Prices: `quotes-2026-11-18.json`.
3. **Score it**: fill the quality matrix (below). The winner = highest **quality per credit** that still clears the quality bar.
4. **Go local**: use the best-scoring images (plus real photos) to train a LoRA, then run images and video on open models for free on Alvin's PC.

## Test prompts (same for every model)
- **P1 portrait**: head-and-shoulders, studio light, looking at camera (tests likeness).
- **P2 lifestyle**: walking out of a recording studio at night, street light (tests likeness in hard light and motion).
- **P3 ad scene**: holding a phone toward camera, pointing at it, bright office (tests hands, props, ad use).

## Quality matrix (one row per model)
| Column | How it's measured | Weight |
|---|---|---|
| Likeness | **Outside ruler:** face-similarity score from an independent face-recognition model, comparing output with the real reference photo (0-1). Plus Alvin's own yes/no: "is that me?" | 40% |
| Realism | Blind 1-5 rating (model names hidden) | 25% |
| Prompt match | Did it do what the prompt said? 1-5 | 20% |
| Clean | Hands, teeth, eyes, text, warped props: 1-5 | 15% |
| Credits | From the quote file | |
| **Quality index** | Weighted score, 0-100 | |
| **Quality per credit** | Quality index / credits | |

**Quality bar:** the Seedance 2.5 result sets 100% for video. A model "matches" if it scores within 10 points of it.
Claude rates as one judge only; the face score and Alvin's blind picks decide. Whoever generates the images doesn't get to grade them alone.

## Cost of the shop (needs a yes first)
| Part | What runs | Quoted credits |
|---|---|---|
| Images | 9 element-capable image models x 3 prompts | about 31 |
| Video | best still animated on 10 video models, 5 s each | about 145 |
| **Total** | | **about 176 of 3,091** |

Optional: train a Higgsfield Soul character (5-20 photos) to also test `soul_2` at 0.12 credits per image. Training cost isn't quoted yet.

## Going free: the local workflow (not proven yet)
For Alvin's PC (RTX 5080, 16 GB video memory). Every step below still needs a real run before it counts as proven.
1. **Dataset**: 20-30 images of Alvin: real photos first, then generated ones that pass the face-similarity threshold. Varied angles, light, outfits and expressions.
2. **Train a LoRA** on an open image model that fits 16 GB (candidates: Z-Image Turbo, FLUX.2 Klein 4B). Local trainers such as ai-toolkit or OneTrainer.
3. **Images for free**: ComfyUI + the Alvin LoRA, re-scored with the same matrix.
4. **Video for free**: image-to-video from those stills with open video models that can run on 16 GB, such as Wan 2.2 5B, LTX-Video or LongCat-Video (larger models need offloading and run slower). Re-score against the Seedance bar.
5. **Fallback if the PC is too slow**: rent a Higgsfield GPU (L40S, 71 credits per hour) for training or batches.

## Rules
- Alvin's likeness LoRA stays **private**: never upload it to a public Hugging Face or Civitai page. Higgsfield's LoRA import only accepts public files, so for rented GPUs use a private route.
- Use only Alvin's own face, or a client's with written consent.
- No credits spent without a yes; re-quote before each batch.
