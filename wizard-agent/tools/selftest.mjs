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
  ["empty folder fails", () => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wiz-")); const r = spawnSync(process.execPath, [VALIDATOR, dir]).status; fs.rmSync(dir, { recursive: true }); return r; }, 1],

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
