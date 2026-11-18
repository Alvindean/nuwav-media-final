#!/usr/bin/env node
// Wizard Agent template validator. No dependencies.
// Usage: node wizard-agent/tools/validate.mjs [--expect 100] [--json] [path/to/file-or-dir ...]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROUTING = JSON.parse(fs.readFileSync(path.join(ROOT, "model-routing.json"), "utf8"));
const CATEGORIES = ["education", "reveal", "story", "behind-the-scenes", "comparison", "lists", "mindset", "gamification", "comedy", "songwriting"];
const FORMATS = ["reel", "carousel", "both"];
const GOALS = ["awareness", "engagement", "leads", "sales", "trust"];
const RATIOS = ["9:16", "4:5", "1:1"];
const BEAT_TIERS = ["still", "clip_draft", "clip_standard", "clip_hero", "talking_head", "text_only"];
const CLIP_TIERS = ["clip_draft", "clip_standard", "clip_hero", "talking_head"];
const REGULATED = /\b(law|legal|attorney|lawyer|dental|dentist|med spa|medspa|medical|doctor|clinic|chiropract\w*|health|supplement|financial|insurance|mortgage|real estate|realtor|therapist|therapy|pharmac\w*)\b/i;
const BANNED = /\b(TODO|TBD|lorem|xxx)\b|\[insert/i;
const BUDGET = ROUTING.budgets;

const args = process.argv.slice(2);
const expectIdx = args.indexOf("--expect");
const expect = expectIdx >= 0 ? Number(args[expectIdx + 1]) : null;
const asJson = args.includes("--json");
const targets = args.filter((a, i) => !a.startsWith("--") && !(expectIdx >= 0 && i === expectIdx + 1));
if (expectIdx >= 0 && !Number.isInteger(expect)) fail("--expect needs a whole number, e.g. --expect 100");

function fail(msg) { console.error(`validate: ${msg}`); process.exit(2); }

function collect(p) {
  if (!fs.existsSync(p)) fail(`not found: ${p}`);
  const st = fs.statSync(p);
  if (st.isFile()) return p.endsWith(".json") ? [p] : [];
  return fs.readdirSync(p).sort().flatMap((f) => collect(path.join(p, f)));
}

const files = (targets.length ? targets : [path.join(ROOT, "templates")]).flatMap(collect);
const isStr = (v, min = 1) => typeof v === "string" && v.trim().length >= min;
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

function allStrings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => allStrings(x, out));
  return out;
}

function creditsFor(tier, seconds) {
  const t = ROUTING.tiers[tier];
  if (!t || t.credits_per_unit == null) return null;
  if (CLIP_TIERS.includes(tier)) return t.credits_per_unit * Math.max(1, Math.ceil(seconds / 5));
  return t.credits_per_unit;
}

function check(file, t) {
  const e = [];
  const base = path.basename(file, ".json");
  const folder = path.basename(path.dirname(file));
  const need = (cond, msg) => { if (!cond) e.push(msg); };

  if (!t || typeof t !== "object" || Array.isArray(t)) return { errors: ["file is not a JSON object"] };
  need(CATEGORIES.includes(t.category), `category "${t.category}" is not one of the 10 categories`);
  need(t.category === folder, `category "${t.category}" does not match folder "${folder}"`);
  const idRe = new RegExp(`^${t.category}-(00[1-9]|010)-[a-z0-9]+(-[a-z0-9]+)*$`);
  need(isStr(t.id) && idRe.test(t.id), `id "${t.id}" must look like ${t.category}-001-short-slug (NNN 001-010)`);
  need(t.id === base, `id "${t.id}" must equal the file name "${base}"`);
  need(t.version === 1, "version must be 1");
  need(isStr(t.name), "name is missing");
  need(FORMATS.includes(t.format), `format must be one of ${FORMATS.join(", ")}`);
  need(GOALS.includes(t.goal), `goal must be one of ${GOALS.join(", ")}`);
  need(RATIOS.includes(t.aspect_ratio), `aspect_ratio must be one of ${RATIOS.join(", ")}`);
  need(Array.isArray(t.best_for) && t.best_for.length >= 3 && t.best_for.every((x) => isStr(x)), "best_for needs 3+ niches");
  need(isStr(t.why_it_works, 40), "why_it_works needs 40+ characters");
  need(t.hook && isStr(t.hook.pattern), "hook.pattern is missing");
  const ex = t.hook && t.hook.examples;
  need(Array.isArray(ex) && ex.length === 3 && ex.every((x) => isStr(x)), "hook.examples needs exactly 3 lines");
  if (Array.isArray(ex)) ex.forEach((x, i) => need(!isStr(x) || words(x) <= 14, `hook.examples[${i}] is over 14 words`));
  need(isStr(t.cta), "cta is missing");
  need(t.craft && isStr(t.craft.technique) && isStr(t.craft.notes, 30), "craft needs technique and 30+ characters of notes");
  need(Array.isArray(t.do_not) && t.do_not.length >= 1 && t.do_not.every((x) => isStr(x)), "do_not needs 1+ items");

  const regulated = Array.isArray(t.best_for) && t.best_for.some((n) => typeof n === "string" && REGULATED.test(n));
  if (regulated) need(Array.isArray(t.compliance) && t.compliance.length >= 1 && t.compliance.every((x) => isStr(x)), "compliance needs 1+ items because best_for includes a regulated niche");
  if (t.compliance !== undefined) need(Array.isArray(t.compliance), "compliance must be a list");

  // variables
  const declared = new Map();
  if (!Array.isArray(t.variables)) e.push("variables must be a list (use [] if none)");
  else t.variables.forEach((v, i) => {
    const ok = v && /^[a-z][a-z0-9_]*$/.test(v.name || "") && isStr(v.description) && isStr(v.example);
    need(ok, `variables[${i}] needs snake_case name, description and example`);
    if (ok) { need(!declared.has(v.name), `variable "${v.name}" declared twice`); declared.set(v.name, 0); }
  });
  const text = allStrings({ ...t, variables: undefined });
  for (const s of text) {
    for (const m of s.matchAll(/\{\{\s*([^}]*?)\s*\}\}/g)) {
      if (declared.has(m[1])) declared.set(m[1], declared.get(m[1]) + 1);
      else e.push(`{{${m[1]}}} is used but not declared in variables`);
    }
    if (/\{\{|\}\}/.test(s.replace(/\{\{\s*[^}]*?\s*\}\}/g, ""))) e.push(`broken {{ }} placeholder in: "${s.slice(0, 60)}"`);
  }
  for (const [n, c] of declared) need(c > 0, `variable "${n}" is declared but never used`);
  for (const s of allStrings(t)) if (BANNED.test(s)) e.push(`placeholder text left in: "${s.slice(0, 60)}"`);

  // reel beats + budget
  let credits = 0, unquoted = 0, clips = 0, hero = 0;
  const hasReel = t.format === "reel" || t.format === "both";
  if (hasReel) {
    const b = t.beats;
    need(Array.isArray(b) && b.length >= 3 && b.length <= 10, "beats needs 3-10 beats for a reel");
    need(Number.isInteger(t.duration_seconds) && t.duration_seconds >= 7 && t.duration_seconds <= 60, "duration_seconds must be a whole number 7-60");
    if (Array.isArray(b)) {
      let sum = 0;
      b.forEach((beat, i) => {
        const at = `beats[${i}]`;
        if (!beat || typeof beat !== "object") return e.push(`${at} is not an object`);
        need(typeof beat.seconds === "number" && beat.seconds > 0, `${at}.seconds must be > 0`);
        sum += typeof beat.seconds === "number" ? beat.seconds : 0;
        need(isStr(beat.purpose), `${at}.purpose is missing`);
        need(typeof beat.on_screen_text === "string", `${at}.on_screen_text must be text ("" allowed)`);
        need(typeof beat.voiceover === "string", `${at}.voiceover must be text ("" allowed)`);
        need(isStr(beat.on_screen_text) || isStr(beat.voiceover), `${at} has no on-screen text and no voiceover`);
        const v = beat.visual || {};
        need(BEAT_TIERS.includes(v.tier), `${at}.visual.tier "${v.tier}" is not a known tier`);
        if (v.tier !== "text_only") need(isStr(v.prompt, 15), `${at}.visual.prompt needs 15+ characters`);
        if (CLIP_TIERS.includes(v.tier)) clips++;
        if (v.tier === "clip_hero") hero++;
        const c = creditsFor(v.tier, beat.seconds || 0);
        if (c == null) unquoted++; else credits += c;
      });
      need(b[0] && b[0].seconds <= 3, "the first beat (the hook) must be 3 seconds or less");
      need(Math.abs(sum - t.duration_seconds) < 0.01, `beat seconds add up to ${sum}, but duration_seconds is ${t.duration_seconds}`);
    }
    need(clips <= BUDGET.max_clip_beats_per_reel, `${clips} clip beats; the limit is ${BUDGET.max_clip_beats_per_reel}`);
    need(hero <= BUDGET.max_hero_beats_per_reel, `${hero} clip_hero beats; the limit is ${BUDGET.max_hero_beats_per_reel}`);
    need(credits <= BUDGET.max_credits_per_reel_standard, `quoted cost ${credits} credits; the limit is ${BUDGET.max_credits_per_reel_standard}`);
  } else {
    need(t.beats === undefined || (Array.isArray(t.beats) && t.beats.length === 0), "carousel-only templates must not have beats");
    need(t.duration_seconds === undefined, "carousel-only templates must not have duration_seconds");
  }

  const hasCarousel = t.format === "carousel" || t.format === "both";
  if (hasCarousel) {
    const s = t.carousel && t.carousel.slides;
    need(Array.isArray(s) && s.length >= 5 && s.length <= 10, "carousel.slides needs 5-10 slides");
    if (Array.isArray(s)) s.forEach((sl, i) => {
      need(sl && isStr(sl.headline) && words(sl.headline) <= 10, `carousel.slides[${i}].headline is missing or over 10 words`);
      need(sl && isStr(sl.body), `carousel.slides[${i}].body is missing`);
      need(sl && isStr(sl.visual_prompt, 15), `carousel.slides[${i}].visual_prompt needs 15+ characters`);
      if (sl && isStr(sl.visual_prompt)) credits += ROUTING.tiers.still.credits_per_unit;
    });
  } else {
    need(t.carousel === undefined, "carousel is only allowed when format is carousel or both");
  }
  return { errors: e, credits, unquoted, clips };
}

const results = [];
const ids = new Map(), names = new Map();
for (const f of files) {
  let t, r;
  try { t = JSON.parse(fs.readFileSync(f, "utf8")); } catch (err) { r = { errors: [`not valid JSON: ${err.message}`] }; }
  if (!r) r = check(f, t);
  if (t && t.id) { if (ids.has(t.id)) r.errors.push(`duplicate id, also in ${ids.get(t.id)}`); else ids.set(t.id, f); }
  if (t && isStr(t.name)) { const k = t.name.trim().toLowerCase(); if (names.has(k)) r.errors.push(`duplicate name "${t.name}", also in ${names.get(k)}`); else names.set(k, f); }
  results.push({ file: path.relative(process.cwd(), f), category: t && t.category, ...r });
}

const perCat = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
results.forEach((r) => { if (r.category in perCat && r.errors.length === 0) perCat[r.category]++; });
const setErrors = [];
if (files.length === 0) setErrors.push("no template files found");
if (expect != null) {
  if (results.length !== expect) setErrors.push(`expected ${expect} templates, found ${results.length}`);
  if (expect === 100) for (const c of CATEGORIES) if (perCat[c] !== 10) setErrors.push(`category ${c} has ${perCat[c]} valid templates, expected 10`);
}
const bad = results.filter((r) => r.errors.length);
const passed = results.length - bad.length;

if (asJson) {
  console.log(JSON.stringify({ total: results.length, passed, perCategory: perCat, setErrors, results }, null, 2));
} else {
  for (const r of bad) { console.log(`FAIL ${r.file}`); r.errors.forEach((x) => console.log(`  - ${x}`)); }
  const reel = results.filter((r) => !r.errors.length && r.credits != null);
  const totalCredits = reel.reduce((a, r) => a + r.credits, 0);
  console.log(`\n${passed}/${results.length} templates pass.`);
  console.log(`Per category (passing): ${CATEGORIES.map((c) => `${c} ${perCat[c]}`).join(", ")}`);
  if (reel.length) console.log(`Quoted credits to render one ad from every passing template: ${totalCredits} (talking-head beats not quoted: ${reel.reduce((a, r) => a + (r.unquoted || 0), 0)})`);
  setErrors.forEach((x) => console.log(`SET FAIL: ${x}`));
}
process.exit(bad.length || setErrors.length ? 1 : 0);
