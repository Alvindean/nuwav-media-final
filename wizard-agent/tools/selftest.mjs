#!/usr/bin/env node
// Self-test for the validator: it must PASS known-good templates and FAIL each known-bad one.
// Every blindside finding becomes a case here (named after the break), so it can't come back.
// Usage: node wizard-agent/tools/selftest.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VALIDATOR = path.join(ROOT, "tools", "validate.mjs");
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const good = read(path.join(ROOT, "examples", "example-reel.json"));
const goodSong = read(path.join(ROOT, "examples", "example-song.json"));
const clone = (t = good) => JSON.parse(JSON.stringify(t));

function runFiles(list, extraArgs = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wiz-"));
  for (const { t, category, fileName, raw } of list) {
    const catDir = path.join(dir, category || t.category);
    fs.mkdirSync(catDir, { recursive: true });
    fs.writeFileSync(path.join(catDir, `${fileName || t.id}.json`), raw ?? JSON.stringify(t));
  }
  const r = spawnSync(process.execPath, [VALIDATOR, ...extraArgs, dir], { encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return r.status;
}
const run = (t, o = {}) => runFiles([{ t, ...o }]);
// reel = 0.25 + 15 (hero 5s) + 13.5 (standard 9s) + 0.25 + 0 = 29 credits; 10 slides add 2.5 -> 31.5
const nearCap = () => { const t = clone(); t.beats[1].visual.tier = "clip_hero"; t.beats[1].seconds = 5; t.beats[2].visual.tier = "clip_standard"; t.beats[2].seconds = 9; t.duration_seconds = 24; t.carousel.slides = Array.from({ length: 10 }, (_, i) => ({ headline: `Point ${i + 1}`, body: "Short supporting line here.", visual_prompt: "Bold title slide with the product photo" })); return t; };
// the good example re-aimed at unregulated niches only (no packs, no disclosure)
const coffeeOnly = () => { const t = clone(); t.best_for = ["coffee shop", "bakery", "florist"]; t.compliance = ["Keep claims true for this brand always"]; t.variables = t.variables.filter((v) => v.name !== "disclosure"); t.beats[4].on_screen_text = "{{offer}}"; t.carousel.slides[4].body = "Come in: {{offer}}."; return t; };
const carouselOnly = () => { const t = clone(); t.format = "carousel"; delete t.beats; delete t.duration_seconds; return t; };

const cases = [
  // ---- v1 cases ----
  ["good example passes", () => run(clone()), 0],
  ["good songwriting example passes", () => run(clone(goodSong)), 0],
  ["bad JSON fails", () => run(clone(), { raw: "{ nope" }), 1],
  ["wrong folder fails", () => run(clone(), { category: "comedy" }), 1],
  ["id/file mismatch fails", () => run(clone(), { fileName: "comparison-002-other" }), 1],
  ["undeclared variable fails", () => { const t = clone(); t.cta = "Call {{phone}} today"; return run(t); }, 1],
  ["unused variable fails", () => { const t = clone(); t.variables.push({ name: "unused", description: "x", example: "y" }); return run(t); }, 1],
  ["beats not summing to duration fails", () => { const t = clone(); t.duration_seconds = 30; return run(t); }, 1],
  ["long hook beat fails", () => { const t = clone(); t.beats[0].seconds = 5; t.duration_seconds = 22; return run(t); }, 1],
  ["unknown tier fails", () => { const t = clone(); t.beats[1].visual.tier = "seedance"; return run(t); }, 1],
  ["4 clip beats fails", () => { const t = clone(); t.beats.forEach((b) => (b.visual = { tier: "clip_draft", prompt: "simple vertical motion shot of the product on a table" })); return run(t); }, 1],
  ["2 hero beats fails", () => { const t = clone(); t.beats[1].visual.tier = "clip_hero"; t.beats[2].visual.tier = "clip_hero"; return run(t); }, 1],
  ["over budget fails", () => { const t = clone(); t.beats[1].seconds = 15; t.beats[1].visual.tier = "clip_hero"; t.duration_seconds = 30; return run(t); }, 1],
  ["regulated niche without compliance fails", () => { const t = clone(); delete t.compliance; return run(t); }, 1],
  ["placeholder text fails", () => { const t = clone(); t.why_it_works = "TODO write the psychology here later on please ok thanks"; return run(t); }, 1],
  ["carousel on reel-only fails", () => { const t = clone(); t.format = "reel"; return run(t); }, 1],
  ["4-slide carousel fails", () => { const t = clone(); t.carousel.slides.pop(); return run(t); }, 1],
  ["carousel-only with beats fails", () => { const t = clone(); t.format = "carousel"; return run(t); }, 1],
  ["carousel-only clean passes", () => run(carouselOnly()), 0],
  ["empty folder is a usage error", () => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wiz-")); const r = spawnSync(process.execPath, [VALIDATOR, dir]).status; fs.rmSync(dir, { recursive: true }); return r; }, 2],

  // ---- blindside round 1: technical ----
  ["junk template (hi/x/qqqq) fails", () => { const t = clone(); t.hook.examples = ["hi", "hi", "hi"]; t.cta = "x"; t.beats.forEach((b) => { b.visual.prompt = "qqqqqqqqqqqqqqq"; }); return run(t); }, 1],
  ["beat of only punctuation fails", () => { const t = clone(); t.beats[1].on_screen_text = "."; t.beats[1].voiceover = ""; return run(t); }, 1],
  ["emoji-only beat fails", () => { const t = clone(); t.beats[1].on_screen_text = " 🔥"; t.beats[1].voiceover = ""; return run(t); }, 1],
  ["same hook three times fails", () => { const t = clone(); t.hook.examples = [t.hook.examples[0], t.hook.examples[0], t.hook.examples[0]]; return run(t); }, 1],
  ["copy of a template under a new id fails", () => { const a = clone(); const b = clone(); b.id = "comparison-002-copy"; b.name = "A Different Name"; return runFiles([{ t: a }, { t: b }]); }, 1],
  ["reel at 29 credits passes on its own", () => { const t = nearCap(); t.format = "reel"; delete t.carousel; return run(t); }, 0],
  ["carousel credits count toward the 30 cap", () => run(nearCap()), 1],
  ["talking-head beats are not free", () => { const t = clone(); [1, 2, 3].forEach((i) => (t.beats[i].visual = { tier: "talking_head", prompt: "owner speaking to camera in the shop" })); return run(t); }, 1],
  ["unknown field in a beat fails", () => { const t = clone(); t.beats[1].visual.model = "sora_2_pro"; return run(t); }, 1],
  ["negative credits field fails", () => { const t = clone(); t.beats[1].credits = -999; return run(t); }, 1],
  ["NaN seconds fails", () => { const t = clone(); t.beats[1].seconds = "five"; return run(t); }, 1],
  ["plural regulated niche needs compliance", () => { const t = clone(); delete t.compliance; t.best_for = ["dentists", "lawyers", "coffee shop"]; return run(t); }, 1],
  ["fitness trainer needs compliance", () => { const t = clone(); delete t.compliance; t.best_for = ["fitness trainer", "coffee shop", "bakery"]; return run(t); }, 1],
  ["unknown --flag is a usage error", () => runFiles([{ t: clone() }], ["--expect=100"]), 2],
  ["BOM-saved good template passes", () => run(clone(), { raw: "﻿" + JSON.stringify(good) }), 0],

  // ---- blindside round 1: creative ----
  ["too many spoken words for the seconds fails", () => { const t = clone(); t.beats[4].voiceover = "Try the difference this Friday with your first latte free and bring along every single friend you have"; return run(t); }, 1],
  ["too much on-screen text for the seconds fails", () => { const t = clone(); t.beats[0].on_screen_text = "Why does our coffee cost more than the chain store across the street every single day?"; return run(t); }, 1],
  ["hook over 10 words fails", () => { const t = clone(); t.hook.examples[0] = "one two three four five six seven eight nine ten eleven"; return run(t); }, 1],
  ["songwriting reel without music block fails", () => { const t = clone(goodSong); delete t.music; return run(t); }, 1],
  ["music with bad bpm fails", () => { const t = clone(goodSong); t.music.bpm = 400; return run(t); }, 1],

  // ---- blindside round 1: business ----
  ["testimonial beat with a generated person fails", () => { const t = clone(); t.beats[3].purpose = "customer testimonial quote"; return run(t); }, 1],
  ["testimonial beat on real_photo passes", () => { const t = clone(); t.beats[3].purpose = "customer testimonial quote"; t.beats[3].visual = { tier: "real_photo", prompt: "client-supplied photo of the real customer holding the cup" }; return run(t); }, 0],
  ["prize without official rules fails", () => { const t = clone(); t.cta = "Comment your guess to win a free latte"; return run(t); }, 1],
  ["prize with official rules passes", () => { const t = clone(); t.cta = "Comment your guess to win a free latte"; t.compliance.push("Giveaway: official rules linked, no purchase necessary, not run by the platform"); return run(t); }, 0],
  ["tag-a-friend bait fails", () => { const t = clone(); t.cta = "Tag a friend who needs this latte"; return run(t); }, 1],

  // ---- blindside round 2: technical ----
  ["one-letter-word junk fails", () => { const t = clone(); t.why_it_works = "a a a a a a a a {{brand}}"; t.craft.notes = "b b b b b b b b"; return run(t); }, 1],
  ["low-variety filler fails", () => { const t = clone(); t.why_it_works = "very very very very very very good good good"; return run(t); }, 1],
  ["hyphen-chained long hook fails", () => { const t = clone(); t.hook.examples[0] = "Why-does-our-latte-cost-more-than-the-chain-store across-the-street watch this"; return run(t); }, 1],
  ["dot-chained voiceover fails", () => { const t = clone(); t.beats[0].voiceover = "Why.does.our.latte.cost.more.than.the.chain.store.across.the.street"; return run(t); }, 1],
  ["long CJK voiceover fails timing", () => { const t = clone(); t.beats[0].voiceover = "为什么我们的拿铁比街对面的连锁店贵这么多呢你一定想知道答案吧"; return run(t); }, 1],
  ["filled carousel headline over 10 words fails", () => { const t = clone(); t.carousel.slides[2].headline = "{{hidden_step}} {{hidden_step}}"; return run(t); }, 1],
  ["fractional clip seconds fail", () => { const t = clone(); t.beats[1].seconds = 4.5; t.beats[2].seconds = 5.5; return run(t); }, 1],
  ["clip longer than the model allows fails", () => { const t = clone(); t.beats[1].seconds = 16; t.duration_seconds = 31; return run(t); }, 1],
  ["near-copy with one word changed fails", () => { const a = clone(); const b = clone(); b.id = "comparison-002-near-copy"; b.name = "Another Name"; b.hook.pattern += " Now."; return runFiles([{ t: a }, { t: b }]); }, 1],
  ["digits-only beat text passes", () => { const t = clone(); t.beats[3].on_screen_text = "$49 → $19"; t.beats[3].voiceover = ""; return run(t); }, 0],
  ["--expect 1e2 is a usage error", () => runFiles([{ t: clone() }], ["--expect", "1e2"]), 2],
  ["prize hidden in a variable example fails", () => { const t = clone(); t.variables.find((v) => v.name === "offer").example = "a chance to win a free latte"; return run(t); }, 1],
  ["bait hidden in a variable example fails", () => { const t = clone(); t.variables.find((v) => v.name === "offer").example = "Tag someone who needs coffee"; return run(t); }, 1],
  ["-ies plural niche needs a pack rule", () => { const t = clone(); t.best_for = ["breweries", "pharmacies", "bakery"]; return run(t); }, 1],
  ["juice bar is not age-restricted", () => { const t = clone(); t.best_for = ["juice bar", "coffee shop", "bakery"]; t.compliance = ["Keep claims true for this brand always"]; t.variables = t.variables.filter((v) => v.name !== "disclosure"); t.beats[4].on_screen_text = "{{offer}}"; t.carousel.slides[4].body = "Come in: {{offer}}."; return run(t); }, 0],
  ["vocal coach is not an income-claims niche", () => { const t = clone(); t.best_for = ["vocal coach", "coffee shop", "bakery"]; t.compliance = ["Keep claims true for this brand always"]; t.variables = t.variables.filter((v) => v.name !== "disclosure"); t.beats[4].on_screen_text = "{{offer}}"; t.carousel.slides[4].body = "Come in: {{offer}}."; return run(t); }, 0],
  ["junk compliance rule for a regulated niche fails", () => { const t = clone(); t.compliance = ["Be nice to everyone always"]; return run(t); }, 1],
  ["new pack niches are matched (car dealership)", () => { const t = clone(); t.best_for = ["car dealership", "coffee shop", "bakery"]; t.compliance = ["Keep claims true for this brand always"]; return run(t); }, 1],

  // ---- blindside round 2: business ----
  ["generated weight-loss before/after fails", () => { const t = clone(); t.beats[3].purpose = "Day 90 reveal"; t.beats[3].on_screen_text = "Day 90: minus 30 lbs"; return run(t); }, 1],
  ["'Before & after' on a generated clip fails", () => { const t = clone(); t.beats[2].purpose = "Before & after"; return run(t); }, 1],
  ["'What our customers say' on a still fails", () => { const t = clone(); t.beats[3].purpose = "What our customers say"; return run(t); }, 1],
  ["5-star review slide with a generated face fails", () => { const t = clone(); t.carousel.slides[3].headline = "5-star review"; t.carousel.slides[3].visual_prompt = "photorealistic generated woman smiling holding a latte"; return run(t); }, 1],
  ["guarantee claim in a law-firm ad fails", () => { const t = clone(); t.beats[3].voiceover = "We win your case. Guaranteed."; return run(t); }, 1],
  ["negated guarantee passes", () => { const t = clone(); t.beats[3].voiceover = "No guarantees. Just honest work."; return run(t); }, 0],
  ["regulated template without on-screen disclosure fails", () => { const t = clone(); t.beats[4].on_screen_text = "{{offer}}"; return run(t); }, 1],
  ["sound-alike music feel fails", () => { const t = clone(goodSong); t.music.feel = "pop that sounds exactly like a famous hit"; return run(t); }, 1],
  ["comparison to a named brand fails", () => { const t = clone(); t.cta = "Way better than Starbucks, honestly."; return run(t); }, 1],
  ["'comment YES for part 2' bait fails", () => { const t = clone(); t.cta = "Comment YES for part 2"; return run(t); }, 1],
  ["'lucky commenter' prize without rules fails", () => { const t = clone(); t.cta = "We pick one lucky commenter for a free month"; return run(t); }, 1],

  // ---- blindside round 2: creative ----
  ["story hook with a hard-coded fact fails", () => { const t = clone(); t.category = "story"; t.id = "story-001-fact"; t.hook.examples[0] = "2:14 a.m. Unknown number. She picked up."; return run(t, { category: "story", fileName: "story-001-fact" }); }, 1],
  ["'a AC tune-up' reads wrong", () => { const t = clone(); t.beats[1].voiceover = "This is a AC tune-up."; return run(t); }, 1],
  ["double period reads wrong", () => { const t = clone(); t.beats[1].voiceover = "Trust exercise.."; return run(t); }, 1],
  ["lowercase after a sentence end reads wrong", () => { const t = clone(); t.beats[1].voiceover = "Come see us. first coffee is free."; return run(t); }, 1],
  ["'Option A or B' is not an article", () => { const t = clone(); t.beats[1].voiceover = "Pick option A or B."; return run(t); }, 0],
  ["numbered list items may start lowercase", () => { const t = clone(); t.beats[1].on_screen_text = "1. a fresh fade"; return run(t); }, 0],
  ["'link in bio' after a period reads wrong", () => { const t = clone(); t.beats[4].voiceover = "Daylight. link in bio"; return run(t); }, 1],
  // ---- blindside round 3: client niche (--niche) ----
  ["law-firm claim in a coffee template fails with --niche", () => { const t = coffeeOnly(); t.beats[3].voiceover = "We win your case. Guaranteed."; return runFiles([{ t }], ["--niche", "personal injury law firm"]); }, 1],
  ["same copy without --niche passes (shows why --niche matters)", () => { const t = coffeeOnly(); t.beats[3].voiceover = "We win your case. Guaranteed."; return run(t); }, 0],
  ["--niche client needs that pack's disclosure line", () => runFiles([{ t: coffeeOnly() }], ["--niche", "dentist"]), 1],
  ["--niche bakery with empty disclosure passes", () => { const t = clone(); t.best_for = ["coffee shop", "bakery", "florist"]; t.compliance = ["Keep claims true for this brand always"]; t.variables.find((v) => v.name === "disclosure").example = ""; return runFiles([{ t }], ["--niche", "bakery"]); }, 0],
  ["empty disclosure without --niche fails", () => { const t = clone(); t.variables.find((v) => v.name === "disclosure").example = ""; return run(t); }, 1],
  ["junk disclosure text fails", () => { const t = clone(); t.variables.find((v) => v.name === "disclosure").example = "Have a great day."; return run(t); }, 1],
  ["dentist 'pain-free implants' fails with --niche", () => { const t = clone(); t.beats[3].voiceover = "Pain-free implants, same day."; t.variables.find((v) => v.name === "disclosure").example = "Attorney advertising. Past results do not guarantee a similar outcome. Results vary. Consult a licensed provider."; return runFiles([{ t }], ["--niche", "dentist"]); }, 1],
  ["political client needs a human", () => runFiles([{ t: coffeeOnly() }], ["--niche", "candidate for mayor"]), 1],
  ["--niche without a value is a usage error", () => spawnSync(process.execPath, [VALIDATOR, path.join(ROOT, "examples"), "--niche"]).status, 2],

  // ---- blindside round 3: false positives that must PASS ----
  ["'an MRI' and 'a USB' read fine", () => { const t = clone(); t.beats[1].voiceover = "Need an MRI or a USB?"; return run(t); }, 0],
  ["'Acme Inc. makes' reads fine", () => { const t = clone(); t.beats[1].voiceover = "Acme Inc. makes it simple."; return run(t); }, 0],
  ["'Mon. through Fri.' reads fine", () => { const t = clone(); t.beats[1].voiceover = "Open Mon. through Fri. daily."; return run(t); }, 0],
  ["CTA starting 'iPhone' reads fine", () => { const t = clone(); t.cta = "iPhone cracked? Book today."; return run(t); }, 0],
  ["'Comment below and tell us' is a real question", () => { const t = clone(); t.cta = "Comment below and tell us your worst coffee."; return run(t); }, 0],
  ["'We send this to the lab' is not bait", () => { const t = clone(); t.beats[1].voiceover = "We send this to the lab."; return run(t); }, 0],
  ["'price tag that will hurt' is not bait", () => { const t = clone(); t.beats[1].voiceover = "A price tag that will hurt."; return run(t); }, 0],
  ["own brand in 'DIY vs {{brand}}' passes", () => { const t = clone(); t.beats[1].on_screen_text = "DIY vs {{brand}}"; return run(t); }, 0],
  ["juice bar and nail bar are not age-restricted", () => { const t = coffeeOnly(); t.best_for = ["juice bar, nail bar", "coffee shop", "bakery"]; return run(t); }, 0],
  ["soccer coach is not an income-claims niche", () => { const t = coffeeOnly(); t.best_for = ["soccer coach", "coffee shop", "bakery"]; return run(t); }, 0],

  // ---- blindside round 3: misses that must FAIL ----
  ["'Drop a 🔥 if you agree' fails", () => { const t = clone(); t.cta = "Drop a 🔥 if you agree."; return run(t); }, 1],
  ["'Reply YES below' fails", () => { const t = clone(); t.cta = "Reply YES below for the list."; return run(t); }, 1],
  ["'Double tap for part 2' fails", () => { const t = clone(); t.cta = "Double tap for part 2."; return run(t); }, 1],
  ["'Comment A or B' vote bait fails", () => { const t = clone(); t.cta = "Comment A or B before the reveal."; return run(t); }, 1],
  ["'giving away 3 free haircuts' needs rules", () => { const t = coffeeOnly(); t.cta = "We're giving away 3 free lattes."; return run(t); }, 1],
  ["'100th follower' prize needs rules", () => { const t = coffeeOnly(); t.cta = "Free latte for the 100th follower."; return run(t); }, 1],
  ["'Unlike Starbucks' fails", () => { const t = clone(); t.cta = "Unlike Starbucks, we roast weekly."; return run(t); }, 1],
  ["'Better than {{rival}}' filled with a brand fails", () => { const t = clone(); t.variables.push({ name: "rival", description: "a rival", example: "Starbucks" }); t.beats[3].on_screen_text = "Better than {{rival}}"; return run(t); }, 1],
  ["'Drake-style' music feel fails", () => { const t = clone(goodSong); t.music.feel = "Drake-style moody trap"; return run(t); }, 1],
  ["'lose two dress sizes' fails", () => { const t = clone(); t.beats[3].voiceover = "Lose two dress sizes fast."; return run(t); }, 1],
  ["'Zero pain, 100% results' fails for medical", () => { const t = clone(); t.best_for = ["dentist", "coffee shop", "bakery"]; t.compliance = ["Dental: results vary, no guarantee of outcome"]; t.variables.find((v) => v.name === "disclosure").example = "Results vary. Consult a licensed provider."; t.beats[3].voiceover = "Zero pain, 100% results."; return run(t); }, 1],

  // ---- blindside round 3: paths ----
  ["same folder passed twice is not a duplicate", () => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wiz-")); fs.mkdirSync(path.join(dir, "comparison")); fs.writeFileSync(path.join(dir, "comparison", `${good.id}.json`), JSON.stringify(good)); const r = spawnSync(process.execPath, [VALIDATOR, dir, dir]).status; fs.rmSync(dir, { recursive: true }); return r; }, 0],
  ["symlinked templates folder is followed", () => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wiz-")); fs.mkdirSync(path.join(dir, "real", "comparison"), { recursive: true }); fs.writeFileSync(path.join(dir, "real", "comparison", `${good.id}.json`), JSON.stringify(good)); fs.symlinkSync(path.join(dir, "real"), path.join(dir, "link")); const r = spawnSync(process.execPath, [VALIDATOR, path.join(dir, "link")]).status; fs.rmSync(dir, { recursive: true }); return r; }, 0],

  ["'a.m.' followed by lowercase is fine", () => { const t = clone(); t.beats[1].voiceover = "Open at 6 a.m. every day."; return run(t); }, 0],
];

let pass = 0;
for (const [name, fn, want] of cases) {
  const got = fn();
  const ok = got === want;
  if (ok) pass++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name} (exit ${got}, want ${want})`);
}
console.log(`\nselftest: ${pass}/${cases.length}`);
process.exit(pass === cases.length ? 0 : 1);
