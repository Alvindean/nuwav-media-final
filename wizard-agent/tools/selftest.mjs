#!/usr/bin/env node
// Self-test for the validator: it must PASS the known-good example and FAIL each known-bad mutation.
// Usage: node wizard-agent/tools/selftest.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VALIDATOR = path.join(ROOT, "tools", "validate.mjs");
const good = JSON.parse(fs.readFileSync(path.join(ROOT, "examples", "example-reel.json"), "utf8"));
const clone = () => JSON.parse(JSON.stringify(good));

function run(t, { category = t.category, fileName = t.id, raw } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wiz-"));
  const catDir = path.join(dir, category || "comparison");
  fs.mkdirSync(catDir);
  fs.writeFileSync(path.join(catDir, `${fileName}.json`), raw ?? JSON.stringify(t));
  const r = spawnSync(process.execPath, [VALIDATOR, dir], { encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return r.status;
}

const cases = [
  ["good example passes", () => run(clone()), 0],
  ["bad JSON fails", () => run(clone(), { raw: "{ nope" }), 1],
  ["wrong folder fails", () => run(clone(), { category: "comedy" }), 1],
  ["id/file mismatch fails", () => run(clone(), { fileName: "comparison-002-other" }), 1],
  ["undeclared variable fails", () => { const t = clone(); t.cta = "Call {{phone}}"; return run(t); }, 1],
  ["unused variable fails", () => { const t = clone(); t.variables.push({ name: "unused", description: "x", example: "y" }); return run(t); }, 1],
  ["beats not summing to duration fails", () => { const t = clone(); t.duration_seconds = 30; return run(t); }, 1],
  ["long hook beat fails", () => { const t = clone(); t.beats[0].seconds = 5; t.duration_seconds = 22; return run(t); }, 1],
  ["unknown tier fails", () => { const t = clone(); t.beats[1].visual.tier = "seedance"; return run(t); }, 1],
  ["4 clip beats fails", () => { const t = clone(); t.beats.forEach((b) => (b.visual = { tier: "clip_draft", prompt: "simple vertical motion shot of the product" })); return run(t); }, 1],
  ["2 hero beats fails", () => { const t = clone(); t.beats[1].visual.tier = "clip_hero"; t.beats[2].visual.tier = "clip_hero"; return run(t); }, 1],
  ["over budget fails", () => { const t = clone(); t.beats[1].seconds = 15; t.beats[1].visual.tier = "clip_hero"; t.duration_seconds = 30; return run(t); }, 1],
  ["regulated niche without compliance fails", () => { const t = clone(); delete t.compliance; return run(t); }, 1],
  ["placeholder text fails", () => { const t = clone(); t.why_it_works = "TODO write the psychology here later on please ok"; return run(t); }, 1],
  ["14+ word hook fails", () => { const t = clone(); t.hook.examples[0] = "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen"; return run(t); }, 1],
  ["carousel on reel-only fails", () => { const t = clone(); t.format = "reel"; return run(t); }, 1],
  ["4-slide carousel fails", () => { const t = clone(); t.carousel.slides.pop(); return run(t); }, 1],
  ["carousel-only with beats fails", () => { const t = clone(); t.format = "carousel"; return run(t); }, 1],
  ["carousel-only clean passes", () => { const t = clone(); t.format = "carousel"; delete t.beats; delete t.duration_seconds; t.variables = t.variables.filter((v) => v.name !== "hidden_step" || true); return run(t); }, 0],
  ["empty folder fails", () => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wiz-")); const r = spawnSync(process.execPath, [VALIDATOR, dir]).status; fs.rmSync(dir, { recursive: true }); return r; }, 1],
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
