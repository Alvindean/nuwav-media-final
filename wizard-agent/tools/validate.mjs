#!/usr/bin/env node
// Wizard Agent template validator v2. No dependencies.
// Checks FORMAT, timing, budget, compliance triggers and obvious junk/duplicates.
// It does not judge whether an ad is good; that is the creative audit's job.
// Usage: node wizard-agent/tools/validate.mjs [--expect N] [--json] [path/to/file-or-dir ...]
// Exit codes: 0 = all pass, 1 = a template or set check failed, 2 = usage or path error.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
const ROUTING = readJson(path.join(ROOT, "model-routing.json"));
const PACKS = readJson(path.join(ROOT, "compliance", "packs.json"));
const TIERS = ROUTING.tiers;
const BUDGET = ROUTING.budgets;

const CATEGORIES = ["education", "reveal", "story", "behind-the-scenes", "comparison", "lists", "mindset", "gamification", "comedy", "songwriting"];
const FORMATS = ["reel", "carousel", "both"];
const GOALS = ["awareness", "engagement", "leads", "sales", "trust"];
const RATIOS = ["9:16", "4:5", "1:1"];
const BEAT_TIERS = ["still", "real_photo", "text_only", "clip_draft", "clip_standard", "clip_hero", "talking_head"];
const CLIP_TIERS = ["clip_draft", "clip_standard", "clip_hero", "talking_head"];
const NO_PROMPT_TIERS = ["text_only"];
const WPS = 3; // words per second, spoken or read
const HOOK_MAX_WORDS = 10; // = the 3-second hook beat at 3 words per second, +1

const KEYS = {
  template: ["id", "version", "name", "category", "format", "goal", "duration_seconds", "aspect_ratio", "best_for", "why_it_works", "hook", "variables", "beats", "cta", "carousel", "craft", "do_not", "compliance", "music"],
  hook: ["pattern", "examples"], variable: ["name", "description", "example"],
  beat: ["seconds", "purpose", "on_screen_text", "voiceover", "visual"], visual: ["tier", "prompt"],
  carousel: ["slides"], slide: ["headline", "body", "visual_prompt"], craft: ["technique", "notes"],
  music: ["tier", "bpm", "feel", "vocals"],
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const terms = PACKS.packs.flatMap((p) => p.match);
const REGULATED = new RegExp(`\\b(${terms.map((t) => esc(t).replace(/ /g, "[\\s-]+")).join("|")})(s|es)?\\b`, "i");
const BANNED = /\b(TODO|TBD|lorem|ipsum|xxx|placeholder)\b|\[insert/i;
const REPEAT = /(.)\1{5,}/u;
const LETTERS = /\p{L}/u;
const REAL_ONLY = /\b(testimonials?|before[\s-]and[\s-]after|before\/after|review quotes?|customer quotes?|client quotes?|real customers?|actual customers?|real patients?)\b/i;
const PRIZE = /\b(giveaways?|prizes?|contests?|sweepstakes|raffles?|winners?|win (a|an|the|free)|to win)\b/i;
const PRIZE_RULES = /official rules|no purchase necessary|sweepstakes|giveaway rules|contest rules/i;
const BAIT = /\btag (a|your|the|one|two|that|this)?\s*(friend|buddy|bestie|person)|\blike if\b|\bvote (with|using) (a )?(like|reaction)/i;

// ---------- args ----------
const args = process.argv.slice(2);
const KNOWN = new Set(["--expect", "--json"]);
let expect = null, asJson = false; const targets = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith("--")) {
    if (!KNOWN.has(a)) usage(`unknown option ${a}`);
    if (a === "--json") asJson = true;
    if (a === "--expect") { expect = Number(args[++i]); if (!Number.isInteger(expect) || expect < 1) usage("--expect needs a whole number, e.g. --expect 100"); }
  } else targets.push(a);
}
function usage(msg) { console.error(`validate: ${msg}\nUsage: node validate.mjs [--expect N] [--json] [file-or-folder ...]`); process.exit(2); }

function collect(p) {
  let st;
  try { st = fs.lstatSync(p); } catch { usage(`not found: ${p}`); }
  if (st.isSymbolicLink()) return [];
  if (st.isFile()) return p.endsWith(".json") ? [p] : [];
  return fs.readdirSync(p).sort().flatMap((f) => collect(path.join(p, f)));
}
const files = (targets.length ? targets : [path.join(ROOT, "templates")]).flatMap(collect);

// ---------- helpers ----------
const isStr = (v, min = 1) => typeof v === "string" && v.trim().length >= min;
const words = (s) => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) || []).length;
const minWords = (v, n) => isStr(v) && words(v) >= n;
function allStrings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => allStrings(x, out));
  return out;
}
function unknownKeys(obj, allowed, at, e) {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) for (const k of Object.keys(obj)) if (!allowed.includes(k)) e.push(`${at} has an unknown field "${k}"`);
}
function cost(tier, seconds) {
  const t = TIERS[tier];
  if (!t) return 0;
  if (t.pricing === "per_unit") return t.credits_per_unit;
  if (t.pricing === "per_second") return t.credits_per_second * Math.max(t.min_seconds || 0, seconds);
  if (t.pricing === "reserve") return t.reserve_credits_per_beat;
  return 0;
}
const round = (n) => Math.round(n * 100) / 100;
const norm = (s) => s.toLowerCase().replace(/\{\{[^}]*\}\}/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

function check(file, t) {
  const e = [];
  const base = path.basename(file, ".json");
  const folder = path.basename(path.dirname(file));
  const need = (cond, msg) => { if (!cond) e.push(msg); };
  if (!t || typeof t !== "object" || Array.isArray(t)) return { errors: ["file is not a JSON object"] };

  unknownKeys(t, KEYS.template, "template", e);
  need(CATEGORIES.includes(t.category), `category "${t.category}" is not one of the 10 categories`);
  need(t.category === folder, `category "${t.category}" does not match folder "${folder}"`);
  const idRe = new RegExp(`^${esc(String(t.category))}-(00[1-9]|010)-[a-z0-9]+(-[a-z0-9]+)*$`);
  need(isStr(t.id) && idRe.test(t.id), `id "${t.id}" must look like ${t.category}-001-short-slug (NNN 001-010)`);
  need(t.id === base, `id "${t.id}" must equal the file name "${base}"`);
  need(t.version === 1, "version must be 1");
  need(minWords(t.name, 1), "name is missing");
  need(FORMATS.includes(t.format), `format must be one of ${FORMATS.join(", ")}`);
  need(GOALS.includes(t.goal), `goal must be one of ${GOALS.join(", ")}`);
  need(RATIOS.includes(t.aspect_ratio), `aspect_ratio must be one of ${RATIOS.join(", ")}`);
  need(Array.isArray(t.best_for) && t.best_for.length >= 3 && t.best_for.every((x) => isStr(x, 3)), "best_for needs 3+ real niche names");
  if (Array.isArray(t.best_for)) need(new Set(t.best_for.map((x) => String(x).toLowerCase())).size === t.best_for.length, "best_for has a repeated niche");
  need(minWords(t.why_it_works, 8), "why_it_works needs 8+ words");

  // variables + fill map
  const declared = new Map(); const fill = {};
  if (!Array.isArray(t.variables)) e.push("variables must be a list (use [] if none)");
  else t.variables.forEach((v, i) => {
    unknownKeys(v, KEYS.variable, `variables[${i}]`, e);
    const ok = v && /^[a-z][a-z0-9_]*$/.test(v.name || "") && isStr(v.description) && isStr(v.example);
    need(ok, `variables[${i}] needs snake_case name, description and example`);
    if (ok) { need(!declared.has(v.name), `variable "${v.name}" declared twice`); declared.set(v.name, 0); fill[v.name] = v.example; }
  });
  const filled = (s) => String(s || "").replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, (m, n) => fill[n] ?? m);
  need(isStr(t.cta) && words(filled(t.cta)) >= 2, "cta needs 2+ words once filled");

  // hook
  unknownKeys(t.hook, KEYS.hook, "hook", e);
  need(t.hook && minWords(t.hook.pattern, 4), "hook.pattern needs 4+ words");
  const ex = t.hook && t.hook.examples;
  need(Array.isArray(ex) && ex.length === 3 && ex.every((x) => isStr(x)), "hook.examples needs exactly 3 lines");
  if (Array.isArray(ex)) {
    ex.forEach((x, i) => {
      if (!isStr(x)) return;
      const w = words(filled(x));
      need(w >= 3 && w <= HOOK_MAX_WORDS, `hook.examples[${i}] has ${w} words once filled; hooks need 3-${HOOK_MAX_WORDS} words`);
    });
    need(new Set(ex.map((x) => norm(String(x)))).size === ex.length, "hook.examples repeats the same line");
  }

  unknownKeys(t.craft, KEYS.craft, "craft", e);
  need(t.craft && minWords(t.craft.technique, 1) && minWords(t.craft.notes, 8), "craft needs a technique and 8+ words of notes");
  need(Array.isArray(t.do_not) && t.do_not.length >= 1 && t.do_not.every((x) => minWords(x, 3)), "do_not needs 1+ items of 3+ words");
  if (t.compliance !== undefined) need(Array.isArray(t.compliance) && t.compliance.every((x) => minWords(x, 3)), "compliance must be a list of rules of 3+ words");
  const hasCompliance = Array.isArray(t.compliance) && t.compliance.length >= 1;

  const regulated = Array.isArray(t.best_for) && t.best_for.filter((n) => typeof n === "string" && REGULATED.test(n));
  if (regulated && regulated.length) need(hasCompliance, `compliance needs 1+ rules because best_for includes regulated niche(s): ${regulated.join(", ")}`);

  // placeholders
  const text = allStrings({ ...t, variables: undefined });
  for (const s of text) {
    for (const m of s.matchAll(/\{\{\s*([^}]*?)\s*\}\}/g)) {
      if (declared.has(m[1])) declared.set(m[1], declared.get(m[1]) + 1);
      else e.push(`{{${m[1]}}} is used but not declared in variables`);
    }
    if (/\{\{|\}\}/.test(s.replace(/\{\{\s*[^}]*?\s*\}\}/g, ""))) e.push(`broken {{ }} placeholder in: "${s.slice(0, 60)}"`);
  }
  for (const [n, c] of declared) need(c > 0, `variable "${n}" is declared but never used`);
  for (const s of allStrings(t)) {
    if (BANNED.test(s)) e.push(`placeholder text left in: "${s.slice(0, 60)}"`);
    if (REPEAT.test(s)) e.push(`junk text (one character repeated 6+ times) in: "${s.slice(0, 60)}"`);
  }
  const visible = allStrings([t.hook, t.beats, t.carousel, t.cta]);
  if (visible.some((s) => BAIT.test(s))) e.push("engagement bait (tag a friend / like if / vote with a reaction) is not allowed; ask a real question instead");
  if (visible.some((s) => PRIZE.test(s))) need(Array.isArray(t.compliance) && t.compliance.some((c) => PRIZE_RULES.test(c)), "this template offers a prize or contest, so compliance must include official rules / no purchase necessary");

  // beats
  let credits = 0, clips = 0, hero = 0;
  const hasReel = t.format === "reel" || t.format === "both";
  if (hasReel) {
    const b = t.beats;
    need(Array.isArray(b) && b.length >= 3 && b.length <= 10, "beats needs 3-10 beats for a reel");
    need(Number.isInteger(t.duration_seconds) && t.duration_seconds >= 7 && t.duration_seconds <= 60, "duration_seconds must be a whole number 7-60");
    if (Array.isArray(b)) {
      let sum = 0;
      b.forEach((beat, i) => {
        const at = `beats[${i}]`;
        if (!beat || typeof beat !== "object" || Array.isArray(beat)) return e.push(`${at} is not an object`);
        unknownKeys(beat, KEYS.beat, at, e);
        const sec = beat.seconds;
        need(typeof sec === "number" && Number.isFinite(sec) && sec >= 1, `${at}.seconds must be a number of 1 or more`);
        sum += typeof sec === "number" && Number.isFinite(sec) ? sec : 0;
        need(minWords(beat.purpose, 1), `${at}.purpose is missing`);
        need(typeof beat.on_screen_text === "string", `${at}.on_screen_text must be text ("" allowed)`);
        need(typeof beat.voiceover === "string", `${at}.voiceover must be text ("" allowed)`);
        const ost = typeof beat.on_screen_text === "string" ? beat.on_screen_text : "";
        const vo = typeof beat.voiceover === "string" ? beat.voiceover : "";
        need(LETTERS.test(ost) || LETTERS.test(vo), `${at} has no real on-screen text and no voiceover`);
        if (typeof sec === "number" && sec > 0) {
          const limit = Math.floor(sec * WPS) + 1;
          const vw = words(filled(vo)), ow = words(filled(ost));
          need(vw <= limit, `${at} voiceover has ${vw} words for ${sec}s once filled; the limit is ${limit} (about ${WPS} words per second)`);
          need(ow <= limit, `${at} on-screen text has ${ow} words for ${sec}s once filled; the limit is ${limit}`);
        }
        const v = beat.visual || {};
        unknownKeys(beat.visual, KEYS.visual, `${at}.visual`, e);
        need(BEAT_TIERS.includes(v.tier), `${at}.visual.tier "${v.tier}" is not a known tier (${BEAT_TIERS.join(", ")})`);
        if (!NO_PROMPT_TIERS.includes(v.tier)) need(minWords(v.prompt, 5), `${at}.visual.prompt needs 5+ words`);
        const beatText = [beat.purpose, ost, vo, v.prompt].filter((x) => typeof x === "string").join(" ");
        if (REAL_ONLY.test(beatText)) need(v.tier === "real_photo" || v.tier === "text_only", `${at} is a testimonial or before/after beat, so it must use real_photo (or text_only), never a generated person`);
        if (CLIP_TIERS.includes(v.tier)) clips++;
        if (v.tier === "clip_hero") hero++;
        credits += cost(v.tier, typeof sec === "number" ? sec : 0);
      });
      need(b[0] && typeof b[0].seconds === "number" && b[0].seconds <= 3, "the first beat (the hook) must be 3 seconds or less");
      need(Math.abs(sum - t.duration_seconds) < 0.01, `beat seconds add up to ${sum}, but duration_seconds is ${t.duration_seconds}`);
    }
    need(clips <= BUDGET.max_clip_beats_per_reel, `${clips} clip beats; the limit is ${BUDGET.max_clip_beats_per_reel}`);
    need(hero <= BUDGET.max_hero_beats_per_reel, `${hero} clip_hero beats; the limit is ${BUDGET.max_hero_beats_per_reel}`);
  } else {
    need(t.beats === undefined || (Array.isArray(t.beats) && t.beats.length === 0), "carousel-only templates must not have beats");
    need(t.duration_seconds === undefined, "carousel-only templates must not have duration_seconds");
  }

  // music
  if (t.music !== undefined) {
    unknownKeys(t.music, KEYS.music, "music", e);
    need(t.music && t.music.tier === "music", 'music.tier must be "music"');
    need(t.music && Number.isInteger(t.music.bpm) && t.music.bpm >= 50 && t.music.bpm <= 200, "music.bpm must be a whole number 50-200");
    need(t.music && minWords(t.music.feel, 2), "music.feel needs 2+ words (genre, groove, instruments)");
    need(t.music && typeof t.music.vocals === "boolean", "music.vocals must be true or false");
    need(hasReel, "music is only for reel or both templates");
    if (hasReel && Number.isInteger(t.duration_seconds)) credits += cost("music", t.duration_seconds);
  }
  if (t.category === "songwriting" && hasReel) need(t.music !== undefined, "songwriting reels need a music block (tier, bpm, feel, vocals) so the song gets made and priced");

  // carousel
  const hasCarousel = t.format === "carousel" || t.format === "both";
  if (hasCarousel) {
    unknownKeys(t.carousel, KEYS.carousel, "carousel", e);
    const s = t.carousel && t.carousel.slides;
    need(Array.isArray(s) && s.length >= 5 && s.length <= 10, "carousel.slides needs 5-10 slides");
    if (Array.isArray(s)) s.forEach((sl, i) => {
      unknownKeys(sl, KEYS.slide, `carousel.slides[${i}]`, e);
      need(sl && minWords(sl.headline, 1) && words(sl.headline) <= 10, `carousel.slides[${i}].headline is missing or over 10 words`);
      need(sl && isStr(sl.body) && words(filled(sl.body)) >= 2, `carousel.slides[${i}].body needs 2+ words once filled`);
      need(sl && minWords(sl.visual_prompt, 5), `carousel.slides[${i}].visual_prompt needs 5+ words`);
      const st = sl && [sl.headline, sl.body, sl.visual_prompt].join(" ");
      const realOnly = st && REAL_ONLY.test(st);
      if (sl && isStr(sl.visual_prompt) && !realOnly) credits += cost("still", 0);
    });
  } else {
    need(t.carousel === undefined, "carousel is only allowed when format is carousel or both");
  }

  need(credits <= BUDGET.max_credits_per_template, `quoted cost ${round(credits)} credits for one ad; the limit is ${BUDGET.max_credits_per_template}`);

  const fp = crypto.createHash("sha1").update(norm(allStrings([t.hook && t.hook.pattern, t.beats, t.carousel]).join(" "))).digest("hex");
  return { errors: e, credits: round(credits), clips, fingerprint: fp };
}

const results = [];
const ids = new Map(), names = new Map(), prints = new Map();
for (const f of files) {
  let t, r;
  try { t = readJson(f); } catch (err) { r = { errors: [`not valid JSON (${String(err.message).split("\n")[0]})`] }; }
  if (!r) r = check(f, t);
  if (t && t.id) { if (ids.has(t.id)) r.errors.push(`duplicate id, also in ${ids.get(t.id)}`); else ids.set(t.id, f); }
  if (t && isStr(t.name)) { const k = t.name.trim().toLowerCase(); if (names.has(k)) r.errors.push(`duplicate name "${t.name}", also in ${names.get(k)}`); else names.set(k, f); }
  if (r.fingerprint) { if (prints.has(r.fingerprint)) r.errors.push(`same content as ${prints.get(r.fingerprint)} under a different id`); else prints.set(r.fingerprint, f); }
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
  const ok = results.filter((r) => !r.errors.length);
  console.log(`\n${passed}/${results.length} templates pass.`);
  console.log(`Per category (passing): ${CATEGORIES.map((c) => `${c} ${perCat[c]}`).join(", ")}`);
  if (ok.length) console.log(`Quoted credits for one final ad from every passing template: ${round(ok.reduce((a, r) => a + r.credits, 0))} (includes a 10-credit reserve per talking-head beat; draft previews are extra)`);
  setErrors.forEach((x) => console.log(`SET FAIL: ${x}`));
}
process.exit(bad.length || setErrors.length ? 1 : 0);
