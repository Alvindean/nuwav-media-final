# Wizard Agent: blindside report (2026-11-18)

Three loops. Each round used 3 new cold auditors (creative, technical, business) at the same time, and none of them saw the earlier rounds.

| Round | Creative | Technical | Business |
|---|---|---|---|
| 1 (v1) | 62 | 62 | 58 |
| 2 (v2) | 68 | 58 | 52 |
| 3 (v3) | 66 | 62 | 58 |

Scores stayed flat because each new auditor found a new class of failure. The fixes from the earlier rounds held: no auditor re-found an old break.

## State after the round-3 fixes (v4, not re-audited)
- `validate.mjs --expect 100`: **100/100 templates pass.**
- `selftest.mjs`: **114/114**. Every break an auditor proved has its own case, named after the failure. Those cases include good copy that must keep passing, for example "an MRI", "Acme Inc. makes", "iPhone cracked?" and "Comment below and tell us…".
- Live Higgsfield quotes match `model-routing.json`. The auditors re-quoted them in every round.

## Fixed (worst first)
1. Compliance now follows the **client's** niche (`--niche`), not just the template's niche list. Each matching pack must have a rule with one of its key phrases, its disclosure line on screen, and none of its banned phrases. Political and social-issue clients stop for a human.
2. Generated people can't stand in for proof. Testimonials, reviews, before/after, transformations, weight results, real listings and finished jobs use `real_photo`.
3. Junk, copies and word tricks fail: one-letter filler, near-copies, hyphen or dot chains, and long text in scripts written without spaces.
4. Budgets are honest. Prices are per second, use whole seconds and each model's min and max length, and include carousel slides, music and a talking-head reserve. The 30-credit cap covers the whole ad.
5. Engagement bait, giveaways without rules, named-brand comparisons, sound-alike music and outcome claims are blocked. All checks run on the **filled** copy, so variables are included.
6. Songs have a priced music tier. The edit is cut to the track, and music labels don't promise bar placement the cut can't hit.
7. Story hooks take their facts from variables. Lines are checked for how they read once filled: a/an, punctuation, capitals.
8. Spend gate: everything is quoted first, then one yes. Unmatched regulated niches stop for a human, and there is a human sign-off step (7b) with consent records.

## Still open / not proven
- **The round-3 fixes were not re-audited.** The blindside rule caps the loop at three rounds.
- The validator matches text patterns. Some harmful wording will still pass, which is why step 7b requires a human sign-off on every regulated ad.
- Creative (MED): about 90 truly distinct formats rather than 100, and example niches repeat (lowriders and brake checks show up often). About 40% of carousel slides in `both` templates restate the reel.
- A few templates read awkwardly with some plausible fill values (singular vs plural nouns). The check only uses each variable's example.
- Visual prompts aren't scanned for real-person or brand likeness (for example, a celebrity's name).
- The start-frame still for image-to-video clips (0.25 each) isn't counted. The models clamp 4:5 clips to other ratios.
- The spend gate is an instruction, not a code lock.
- Platform policy notes, provider commercial-use terms and copyright of AI output were not checked against live sources.
- No ad has been rendered end to end. No generation credits were spent.
