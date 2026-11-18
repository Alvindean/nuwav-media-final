#!/usr/bin/env node
// Wizard Agent template validator v3. No dependencies.
// Checks format, timing, budget, compliance (by content, not just presence), obvious junk,
// near-copies, and how the script reads once its variables are filled.
// It does not judge whether an ad is good; the creative audit does that.
// Usage: node wizard-agent/tools/validate.mjs [--expect N] [--json] [path/to/file-or-dir ...]
// Exit codes: 0 = all pass, 1 = a template or set check failed, 2 = usage or path error (including no templates found).
import fs from "node:fs";
import path from "node:path";
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
const GEN_CLIPS = ["clip_draft", "clip_standard", "clip_hero"];
const WPS = 3;
const HOOK_MAX_WORDS = 10; // the 3-second hook beat at 3 words per second, +1
const NEAR_DUP = 0.8; // Jaccard similarity of word 3-shingles

const KEYS = {
  template: ["id", "version", "name", "category", "format", "goal", "duration_seconds", "aspect_ratio", "best_for", "why_it_works", "hook", "variables", "beats", "cta", "carousel", "craft", "do_not", "compliance", "music"],
  hook: ["pattern", "examples"], variable: ["name", "description", "example"],
  beat: ["seconds", "purpose", "on_screen_text", "voiceover", "visual"], visual: ["tier", "prompt"],
  carousel: ["slides"], slide: ["headline", "body", "visual_prompt"], craft: ["technique", "notes"],
  music: ["tier", "bpm", "feel", "vocals"],
};

// ---------- regulated niches (from compliance/packs.json) ----------
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const termRe = (t) => {
  const base = esc(t).replace(/ /g, "[\\s-]+");
  const alt = /[^aeiou]y$/i.test(t) ? `|${esc(t.slice(0, -1)).replace(/ /g, "[\\s-]+")}ies` : "";
  return `(?:${base}(?:s|es)?${alt})`;
};
const PACK_RES = PACKS.packs.filter((p) => p.match.length).map((p) => ({ ...p, re: new RegExp(`\\b(${p.match.map(termRe).join("|")})\\b`, "i") }));
const EXCLUDE = new RegExp(`\\b(${(PACKS.exclude || []).map(termRe).join("|")})\\b`, "i");
function packsFor(niche) {
  if (typeof niche !== "string") return [];
  const n = niche.replace(EXCLUDE, " ");
  return PACK_RES.filter((p) => p.re.test(n));
}
const GIVEAWAY = PACKS.packs.find((p) => p.id === "giveaway");
const OUTCOME_PACKS = new Set(["legal", "medical", "financial", "body-and-wellness", "income-claims", "real-estate", "auto-dealer"]);

// ---------- content patterns (run on FILLED text) ----------
const BANNED = /\b(TODO|TBD|lorem|ipsum|xxx|placeholder)\b|\[insert/i;
const REPEAT = /(.)\1{5,}/u;
const HAS_WORDISH = /[\p{L}\p{N}]/u;
const REAL_ONLY = new RegExp([
  "testimonials?", "before\\s*(?:&|and|vs\\.?|versus|to|→|->|/)\\s*after", "after\\s*(?:&|and|vs\\.?|/)\\s*before",
  "(?:\\d|five|four)[\\s-]*stars?\\b", "(?:customer|client|patient|real|google|yelp|verified)\\s+reviews?",
  "reviews?\\s+from", "what\\s+(?:our\\s+)?(?:customers|clients|patients|members|students)\\s+say",
  "(?:customer|client|patient|member|student)(?:'s|s'|s)?\\s+(?:stor(?:y|ies)|results?|quotes?|photos?|words|journey)",
  "(?:customer|client|patient)\\s+quotes?", "real\\s+(?:customers?|clients?|patients?|people|results?)",
  "actual\\s+(?:customers?|clients?|patients?)", "transformations?", "happy\\s+(?:customers|clients|patients)",
].map((s) => `\\b${s}`).join("|"), "i");
const BODY_RESULT = /\bday\s*\d+\b[^.]*\b(lbs?|pounds|kg|kilos|weight|skin|results?|inches|body)\b|\b(lose|lost|losing|minus|down|drop(?:ped)?)\s+\d+\s*(lbs?|pounds|kg|kilos|sizes?|inches)\b/i;
const OUTCOME = /\b(guarantee[sd]?|win your case|cure[sd]?|painless|risk[- ]free|get rich|pre-?approved|approved in|\d{2,3}\s?%\s*(?:returns?|success|approval|win)|double your (?:money|income|revenue))\b/i;
const NEGATION = /\b(no|not|never|can't|cannot|can not|don't|won't|without|zero)\b[\w\s,'’-]{0,24}$/i;
const PRIZE = /\b(giveaways?|prizes?|contests?|sweepstakes|raffles?|winners?|to win|win (?:a|an|the|free|one|two|this)|lucky (?:winner|commenter|follower|fan|customer)|(?:we|we'll|we will|i'll)\s+pick\s+(?:one|a|two|three)|free \w+(?: \w+)? for (?:one|a|two|three) (?:lucky|random))\b/i;
const PRIZE_RULES = /official rules|no purchase necessary/i;
const BAIT = /\btag (?:a|your|the|one|two|that|this|someone|somebody|anyone|everyone)?\s*(?:friend|buddy|bestie|person|someone|somebody)?\b(?=.*\b(?:who|that|needs|would|will|this)\b)|\btag someone\b|\bcomment ["“']?(?:yes|me|\w+)["”']? (?:for|to get|and)\b|\bshare (?:this )?with (?:your|a|the)\b|\bsend this to\b|\blike if\b|\bdouble[- ]tap if\b|\bvote (?:with|using) (?:a )?(?:like|reaction)/i;
const SOUNDALIKE = /\b(sounds? (?:just |exactly )?like|in the style of|style of|soundalike|sound-alike|type beat|cover of|remix of)\b/i;
const NAMED_COMPARE = /\b(?:better|cheaper|faster|tastier) than [A-Z][\w'’&]+/;

// ---------- args ----------
const args = process.argv.slice(2);
const KNOWN = new Set(["--expect", "--json"]);
let expect = null, asJson = false; const targets = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith("--")) {
    if (!KNOWN.has(a)) usage(`unknown option ${a}`);
    if (a === "--json") asJson = true;
    if (a === "--expect") { const v = args[++i]; if (!/^\d+$/.test(v || "") || Number(v) < 1) usage("--expect needs a whole number, e.g. --expect 100"); expect = Number(v); }
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
if (files.length === 0) usage(`no template .json files found in ${targets.join(", ") || "templates/"}`);

// ---------- helpers ----------
const isStr = (v, min = 1) => typeof v === "string" && v.trim().length >= min;
const NO_SPACE_SCRIPT = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/gu;
function tokens(s) {
  const t = String(s || "").replace(NO_SPACE_SCRIPT, " ").replace(/(?<=[\p{L}\p{N}])[-–—./_](?=[\p{L}\p{N}])/gu, " ");
  return t.match(/[\p{L}\p{N}][\p{L}\p{N}'’]*/gu) || [];
}
function words(s) {
  const cjk = (String(s || "").match(NO_SPACE_SCRIPT) || []).length;
  return tokens(s).length + Math.ceil(cjk / 2); // ~2 characters per spoken word for scripts written without spaces
}
const realTokens = (s) => tokens(s).filter((w) => w.length >= 2 || /\d/.test(w));
function minWords(v, n) {
  if (!isStr(v)) return false;
  const r = realTokens(v);
  if (r.length < n) return false;
  if (r.length >= 5 && new Set(r.map((w) => w.toLowerCase())).size / r.length < 0.6) return false;
  return true;
}
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
  if (t.pricing === "per_second") return t.credits_per_second * Math.max(t.min_seconds || 0, Math.ceil(seconds));
  if (t.pricing === "reserve") return t.reserve_credits_per_beat;
  return 0;
}
const round = (n) => Math.round(n * 100) / 100;
const norm = (s) => s.toLowerCase().replace(/\{\{[^}]*\}\}/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
function shingles(text) {
  const w = norm(text).split(" ").filter(Boolean); const set = new Set();
  for (let i = 0; i + 2 < w.length; i++) set.add(w.slice(i, i + 3).join(" "));
  return set;
}
function jaccard(a, b) { let inter = 0; for (const x of a) if (b.has(x)) inter++; return inter / (a.size + b.size - inter || 1); }
function hitsOutcome(s) {
  const m = s.match(OUTCOME);
  if (!m) return null;
  return NEGATION.test(s.slice(0, m.index)) ? null : m[0];
}
const A_OK = /^(uni|use|usu|usa|uk\b|one|once|eu|ewe|ur[aio]|u\.)/i;
const AN_OK = /^(hour|honest|honou?r|heir|herb|[fhlmnrsx]\b|[fhlmnrsx][A-Z0-9])/;
function readingErrors(s, sentence = false) {
  const out = [];
  const t = s.trim();
  if (!t) return out;
  const isArticle = (m) => m[1][0] === "a" || m.index === 0 || /[.!?:]\s+$/.test(t.slice(0, m.index)); // a capital "A" mid-sentence is a label ("Option A or B")
  for (const m of t.matchAll(/\b([Aa])\s+([A-Za-z][\w]*)/g)) if (isArticle(m) && /^[aeiouAEIOU]/.test(m[2]) && !A_OK.test(m[2])) out.push(`"${m[0]}" should be "an ${m[2]}"`);
  for (const m of t.matchAll(/\b([Aa]n)\s+([A-Za-z][\w]*)/g)) if (isArticle(m) && !/^[aeiouAEIOU]/.test(m[2]) && !AN_OK.test(m[2])) out.push(`"${m[0]}" should be "a ${m[2]}"`);
  if (/(?<!\.)\.\.(?!\.)|[!?]\.(?!\.)|,[.!?]|\s[.,!?](?=\s|$)/.test(t)) out.push(`double or loose punctuation in "${t.slice(0, 50)}"`);
  if (sentence && /^[a-z]/.test(t) && !/^(https?:|www\.|[a-z0-9-]+\.(com|net|org|co|io|app)\b|e\.g\.|i\.e\.|vs\.?\s)/.test(t)) out.push(`starts with a lowercase letter: "${t.slice(0, 40)}"`);
  for (const m of t.matchAll(/(\S+)\s+(?=[a-z])/g)) {
    if (/[.!?]$/.test(m[1]) && !/^\d+\.$/.test(m[1]) && !/^(a\.m\.|p\.m\.|vs\.|etc\.|e\.g\.|i\.e\.|approx\.|no\.|st\.|dr\.|mr\.|mrs\.|ms\.|\.\.\.|…)$/i.test(m[1]) && !/\.\.\.$/.test(m[1])) { out.push(`lowercase letter after a sentence end in "${t.slice(0, 50)}"`); break; }
  }
  return out;
}

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
  need(Array.isArray(t.best_for) && t.best_for.length >= 3 && t.best_for.every((x) => isStr(x) && tokens(x).some((w) => w.length >= 3 && /[aeiouy]/i.test(w))), "best_for needs 3+ real niche names");
  if (Array.isArray(t.best_for)) need(new Set(t.best_for.map((x) => String(x).toLowerCase())).size === t.best_for.length, "best_for has a repeated niche");
  need(minWords(t.why_it_works, 8), "why_it_works needs 8+ real, varied words");

  // variables + fill
  const declared = new Map(); const fill = {};
  if (!Array.isArray(t.variables)) e.push("variables must be a list (use [] if none)");
  else t.variables.forEach((v, i) => {
    unknownKeys(v, KEYS.variable, `variables[${i}]`, e);
    const ok = v && /^[a-z][a-z0-9_]*$/.test(v.name || "") && isStr(v.description) && isStr(v.example);
    need(ok, `variables[${i}] needs snake_case name, description and example`);
    if (ok) { need(!declared.has(v.name), `variable "${v.name}" declared twice`); declared.set(v.name, 0); fill[v.name] = v.example; }
  });
  const filled = (s) => String(s || "").replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, (m, n) => fill[n] ?? m);
  const noDisclosure = (s) => String(s || "").replace(/\{\{\s*disclosure\s*\}\}/g, " ");

  need(isStr(t.cta) && realTokens(filled(t.cta)).length >= 2, "cta needs 2+ words once filled");

  // hook
  unknownKeys(t.hook, KEYS.hook, "hook", e);
  need(t.hook && minWords(t.hook.pattern, 4), "hook.pattern needs 4+ real words");
  const ex = t.hook && t.hook.examples;
  need(Array.isArray(ex) && ex.length === 3 && ex.every((x) => isStr(x)), "hook.examples needs exactly 3 lines");
  if (Array.isArray(ex)) {
    ex.forEach((x, i) => {
      if (!isStr(x)) return;
      const w = words(filled(x));
      need(w >= 3 && w <= HOOK_MAX_WORDS, `hook.examples[${i}] has ${w} words once filled; hooks need 3-${HOOK_MAX_WORDS} words`);
      need(realTokens(filled(x)).length >= 3, `hook.examples[${i}] needs 3+ real words`);
      if (t.category === "story") need(!/\d/.test(x) || /\{\{/.test(x), `hook.examples[${i}] states a specific fact ("${x.slice(0, 40)}"); story hooks must take facts from variables`);
    });
    need(new Set(ex.map((x) => norm(String(x)))).size === ex.length, "hook.examples repeats the same line");
  }

  unknownKeys(t.craft, KEYS.craft, "craft", e);
  need(t.craft && minWords(t.craft.technique, 1) && minWords(t.craft.notes, 8), "craft needs a technique and 8+ real words of notes");
  need(Array.isArray(t.do_not) && t.do_not.length >= 1 && t.do_not.every((x) => minWords(x, 3)), "do_not needs 1+ items of 3+ real words");
  if (t.compliance !== undefined) need(Array.isArray(t.compliance) && t.compliance.every((x) => minWords(x, 3)), "compliance must be a list of rules of 3+ real words");
  const rules = Array.isArray(t.compliance) ? t.compliance.filter((x) => typeof x === "string") : [];

  // regulated niches -> packs: key phrase + disclosure
  const matched = new Map();
  if (Array.isArray(t.best_for)) for (const n of t.best_for) for (const p of packsFor(n)) { if (!matched.has(p.id)) matched.set(p.id, { pack: p, niches: [] }); matched.get(p.id).niches.push(n); }
  for (const { pack, niches } of matched.values()) {
    const keys = pack.key_phrases || [];
    need(rules.some((r) => keys.some((k) => r.toLowerCase().includes(k.toLowerCase()))), `compliance needs a ${pack.id} rule (mentioning one of: ${keys.join(", ")}) because best_for includes ${niches.join(", ")}`);
  }

  // placeholders + junk
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

  // visible copy, filled
  const visibleRaw = [...(Array.isArray(ex) ? ex : []), t.cta,
    ...(Array.isArray(t.beats) ? t.beats.flatMap((b) => [b && b.on_screen_text, b && b.voiceover]) : []),
    ...(t.carousel && Array.isArray(t.carousel.slides) ? t.carousel.slides.flatMap((s) => [s && s.headline, s && s.body]) : [])].filter((x) => typeof x === "string");
  const visible = visibleRaw.map(filled);
  const allFilled = allStrings([t.hook, t.beats, t.carousel, t.cta, t.music]).map(filled);
  if (visible.some((s) => BAIT.test(s))) e.push("engagement bait (tag someone / comment YES for / share with / like if) is not allowed; ask a real question instead");
  if (allFilled.some((s) => PRIZE.test(s))) need(rules.some((c) => PRIZE_RULES.test(c)) && visibleRaw.some((s) => /\{\{\s*disclosure\s*\}\}/.test(s)), `this template offers a prize or contest, so compliance must include official rules / no purchase necessary, and a beat or slide must show {{disclosure}} (giveaway line: "${GIVEAWAY.disclosure}")`);
  for (const s of visible) { const m = s.match(BODY_RESULT); if (m) e.push(`numeric body or weight result claim ("${m[0]}") is not allowed in ad copy`); }
  if ([...matched.keys()].some((id) => OUTCOME_PACKS.has(id))) for (const s of visible) { const h = hitsOutcome(s); if (h) e.push(`outcome claim "${h}" is not allowed for a regulated niche (${[...matched.keys()].join(", ")})`); }
  for (const s of visibleRaw) { const m = s.match(NAMED_COMPARE); if (m) e.push(`comparison against a named brand ("${m[0]}") is not allowed`); }
  const sentences = new Set([filled(t.cta), ...(t.carousel && Array.isArray(t.carousel.slides) ? t.carousel.slides.map((sl) => filled(sl && sl.body)) : [])]);
  for (const s of new Set(visible)) for (const r of readingErrors(s, sentences.has(s))) e.push(`reads wrong once filled: ${r}`);

  // disclosure required for matched packs
  const needsDisclosure = [...matched.values()].filter(({ pack }) => pack.disclosure);
  if (needsDisclosure.length) {
    need(declared.has("disclosure"), `declare a "disclosure" variable (example: "${needsDisclosure[0].pack.disclosure}") because this template targets ${needsDisclosure.map((x) => x.pack.id).join(", ")} niches`);
    const inBeats = Array.isArray(t.beats) && t.beats.some((b) => b && /\{\{\s*disclosure\s*\}\}/.test(b.on_screen_text || ""));
    const inSlides = t.carousel && Array.isArray(t.carousel.slides) && t.carousel.slides.some((s) => s && /\{\{\s*disclosure\s*\}\}/.test(`${s.headline} ${s.body}`));
    if (t.format === "reel" || t.format === "both") need(inBeats, "the reel must show {{disclosure}} in a beat's on_screen_text");
    if (t.format === "carousel" || t.format === "both") need(inSlides, "the carousel must show {{disclosure}} in a slide");
  }

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
        const secOk = typeof sec === "number" && Number.isFinite(sec) && sec >= 1;
        need(secOk, `${at}.seconds must be a number of 1 or more`);
        sum += secOk ? sec : 0;
        need(minWords(beat.purpose, 1), `${at}.purpose is missing`);
        need(typeof beat.on_screen_text === "string", `${at}.on_screen_text must be text ("" allowed)`);
        need(typeof beat.voiceover === "string", `${at}.voiceover must be text ("" allowed)`);
        const ost = typeof beat.on_screen_text === "string" ? beat.on_screen_text : "";
        const vo = typeof beat.voiceover === "string" ? beat.voiceover : "";
        need(HAS_WORDISH.test(filled(ost)) || HAS_WORDISH.test(filled(vo)), `${at} has no real on-screen text and no voiceover`);
        if (secOk) {
          const limit = Math.floor(sec * WPS) + 1;
          const vw = words(filled(vo)), ow = words(filled(noDisclosure(ost)));
          need(vw <= limit, `${at} voiceover has ${vw} words for ${sec}s once filled; the limit is ${limit} (about ${WPS} words per second)`);
          need(ow <= limit, `${at} on-screen text has ${ow} words for ${sec}s once filled; the limit is ${limit} (the {{disclosure}} fine print is not counted)`);
        }
        const v = beat.visual || {};
        unknownKeys(beat.visual, KEYS.visual, `${at}.visual`, e);
        need(BEAT_TIERS.includes(v.tier), `${at}.visual.tier "${v.tier}" is not a known tier (${BEAT_TIERS.join(", ")})`);
        if (v.tier !== "text_only") need(minWords(v.prompt, 5), `${at}.visual.prompt needs 5+ real, varied words`);
        const beatText = filled([beat.purpose, ost, vo, v.prompt].filter((x) => typeof x === "string").join(" "));
        if (REAL_ONLY.test(beatText) || BODY_RESULT.test(beatText)) need(v.tier === "real_photo" || v.tier === "text_only", `${at} shows a testimonial, review, before/after or result, so it must use real_photo (or text_only), never a generated person`);
        if (CLIP_TIERS.includes(v.tier)) clips++;
        if (v.tier === "clip_hero") hero++;
        if (GEN_CLIPS.includes(v.tier) && secOk) {
          need(Number.isInteger(sec), `${at} is a generated clip, so seconds must be a whole number (the API bills whole seconds)`);
          const mx = TIERS[v.tier].max_seconds;
          if (mx) need(sec <= mx, `${at} asks for a ${sec}s ${v.tier} clip; ${TIERS[v.tier].model} makes at most ${mx}s per clip`);
        }
        credits += cost(v.tier, secOk ? sec : 0);
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
    if (t.music && typeof t.music.feel === "string") need(!SOUNDALIKE.test(t.music.feel) && !/[A-Z][a-z]+ [A-Z][a-z]+/.test(t.music.feel.replace(/^[A-Z]/, "x")), `music.feel must describe genre and instruments, never an artist, song or sound-alike ("${t.music.feel}")`);
    need(hasReel, "music is only for reel or both templates");
    if (hasReel && Number.isInteger(t.duration_seconds)) {
      const mx = TIERS.music.max_seconds;
      if (mx) need(t.duration_seconds <= mx, `music is limited to ${mx}s`);
      credits += cost("music", t.duration_seconds);
    }
  }
  if (t.category === "songwriting" && hasReel) need(t.music !== undefined || /\b(master|own track|real track|licensed (?:track|audio)|client'?s (?:track|song|audio))\b/i.test(`${t.craft && t.craft.notes} ${allStrings(t.do_not).join(" ")}`), "songwriting reels need a music block (tier, bpm, feel, vocals), or must say in craft notes that the artist's own master/track plays");

  // carousel
  const hasCarousel = t.format === "carousel" || t.format === "both";
  if (hasCarousel) {
    unknownKeys(t.carousel, KEYS.carousel, "carousel", e);
    const s = t.carousel && t.carousel.slides;
    need(Array.isArray(s) && s.length >= 5 && s.length <= 10, "carousel.slides needs 5-10 slides");
    if (Array.isArray(s)) s.forEach((sl, i) => {
      unknownKeys(sl, KEYS.slide, `carousel.slides[${i}]`, e);
      need(sl && isStr(sl.headline) && realTokens(filled(sl.headline)).length >= 1 && words(filled(noDisclosure(sl.headline))) <= 10, `carousel.slides[${i}].headline is missing or over 10 words once filled`);
      need(sl && isStr(sl.body) && realTokens(filled(sl.body)).length >= 2, `carousel.slides[${i}].body needs 2+ words once filled`);
      need(sl && minWords(sl.visual_prompt, 5), `carousel.slides[${i}].visual_prompt needs 5+ real, varied words`);
      if (sl) {
        const st = filled([sl.headline, sl.body, sl.visual_prompt].join(" "));
        if (REAL_ONLY.test(st) || BODY_RESULT.test(st)) need(/\b(real|client[- ]supplied|customer[- ]supplied|consented|their own|the client's own)\b/i.test(filled(sl.visual_prompt || "")), `carousel.slides[${i}] shows a testimonial, review or result, so its visual_prompt must call for a real, consented client photo`);
        credits += cost("still", 0);
      }
    });
  } else {
    need(t.carousel === undefined, "carousel is only allowed when format is carousel or both");
  }

  need(credits <= BUDGET.max_credits_per_template, `quoted cost ${round(credits)} credits for one ad; the limit is ${BUDGET.max_credits_per_template}`);
  return { errors: e, credits: round(credits), clips, shingles: shingles(allStrings([t.hook && t.hook.pattern, t.beats, t.carousel]).join(" ")) };
}

const results = [];
const ids = new Map(), names = new Map(), seen = [];
for (const f of files) {
  let t, r;
  try { t = readJson(f); } catch (err) { r = { errors: [`not valid JSON (${String(err.message).split("\n")[0]})`] }; }
  if (!r) r = check(f, t);
  if (t && t.id) { if (ids.has(t.id)) r.errors.push(`duplicate id, also in ${ids.get(t.id)}`); else ids.set(t.id, f); }
  if (t && isStr(t.name)) { const k = t.name.trim().toLowerCase(); if (names.has(k)) r.errors.push(`duplicate name "${t.name}", also in ${names.get(k)}`); else names.set(k, f); }
  if (r.shingles && r.shingles.size) {
    for (const s of seen) { const j = jaccard(r.shingles, s.sh); if (j >= NEAR_DUP) { r.errors.push(`near-copy (${Math.round(j * 100)}% the same wording) of ${path.relative(process.cwd(), s.file)}`); break; } }
    seen.push({ file: f, sh: r.shingles });
  }
  delete r.shingles;
  results.push({ file: path.relative(process.cwd(), f), category: t && t.category, ...r });
}

const perCat = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
results.forEach((r) => { if (r.category in perCat && r.errors.length === 0) perCat[r.category]++; });
const setErrors = [];
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
