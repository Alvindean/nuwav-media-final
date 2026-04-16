# Deal Scout — Strategy & Architecture

**Owner:** Nu Wav Media
**Status:** v0.1 — design + MVP scaffold
**Branch:** `claude/real-estate-deal-scraper-nwznZ`

Deal Scout is a lead-generation platform for real estate agents and investors.
It aggregates legally-sourced signals about distressed, expired, off-market,
and under-priced properties, scores them for "deal quality," and pushes the
highest-scoring leads to the agent's dashboard, email, SMS, or CRM.

This document is the single source of truth for what we're building, why, and
what we are explicitly *not* building.

---

## 1. The deal-sourcing landscape (2026)

Based on current industry data:

| Lead type | National list rate | Sold rate | Conversion cycle |
| --- | --- | --- | --- |
| Expired listings | 44.0% | 20.7% | ~30 days |
| FSBOs | 27.8% | 13.1% | ~43 days |
| Pre-foreclosure / NOD | high intent, low volume | varies | 60–120 days |
| Probate | high intent | varies | 90+ days |
| Tax-delinquent | high intent | varies | 90+ days |
| Absentee / vacant | medium intent | varies | variable |

Agents running **four or more concurrent lead sources** close ~40% more deals
annually than single-channel agents. Time-to-contact matters: contacting an
expired listing within 24 hours yields 15–25% conversion; speed-to-contact
under 5 minutes makes you 10x more likely to reach the owner.

**Implication for product:** Deal Scout's value is not "one more data source."
It's (a) multi-source aggregation, (b) de-duplication + motivation scoring,
and (c) sub-minute notification so agents can be the first call.

---

## 2. Source catalog

We categorize sources by legal risk so every connector can be audited.

### 2a. Green-tier sources (legal, primary)

These are the core of the product. All are public records or sources that
affirmatively permit programmatic access.

| Source | Data | Access method | Notes |
| --- | --- | --- | --- |
| **HUD Home Store** | FHA/HUD REO listings | Public RSS / HTML | No ToS blocker on public index |
| **Fannie Mae HomePath** | GSE REO | Public listings page | Daily export |
| **Freddie Mac HomeSteps** | GSE REO | Public listings page | Daily export |
| **USDA REO** | Rural REO | Public CSV | Low volume, high quality |
| **VA Vendee** | VA REO | Public listings | Low volume |
| **County recorder / assessor** | Deeds, NOD, lis pendens, tax-delinquent lists | Varies by county — RSS, CSV, bulk, or paid API | County-by-county connector |
| **Foreclosure auction calendars** | Trustee sale dates + addresses | County sheriff / trustee sites | Public notice |
| **Probate court filings** | Estate proceedings | County court e-filing portals | Public record |
| **Code-violation / condemnation lists** | Distressed homes | City open-data portals | CKAN / Socrata |
| **Eviction filings** | Landlord frustration signal | Court public records | Varies by jurisdiction |
| **FSBO sites that allow it** | Owner-listed properties | Official APIs, RSS, or robots-allowed pages | Must check per-site |
| **Licensed data APIs** | MLS-adjacent + public records | ATTOM, Estated, BatchData, RealtyMole, Datafiniti | Paid, covered by license |

### 2b. Yellow-tier sources (gray area, OFF by default)

Available only in the `experimental/` module, disabled in production, gated
behind an explicit config flag and a user-acknowledgement click.

- Public-search scraping of portals (Zillow, Realtor.com, Trulia, Redfin)
- MLS IDX display scraping

**Legal exposure:** ToS violation, copyright (MLS data is copyrighted to NAR
and local boards), possible CFAA exposure (cf. *hiQ Labs v. LinkedIn* —
platforms have broad latitude to assert data-control rights), and rapid
IP/account banning. No public court case has yet hammered a real-estate
scraper, but cease-and-desist is routine and the business risk is real.

**Policy:** We never ship yellow-tier sources enabled. The code exists so a
user acting on their own research can flip it on for personal use. Any
commercial multi-tenant deployment must ship with experimental off.

### 2c. Red-tier sources (never)

- Circumventing CAPTCHAs, rate limits, or auth systems
- Impersonating real users (fake accounts, forged headers posing as humans)
- Acquiring MLS data without a license
- Scraping behind a login
- Residential proxy rotation to evade detection

These are off-limits. Don't ship them. Don't build them.

---

## 3. The seven lead categories Deal Scout produces

1. **Expired listings** — via licensed feeds (REDX/Vulcan7 partner, or direct
   MLS licensing once a broker sponsors us) + public "sold/expired" signals
   from county records.
2. **FSBOs** — FSBO-friendly site APIs, MLS partner feed, classified RSS.
3. **Pre-foreclosures** — County NOD / lis pendens filings.
4. **Probate** — County probate court filings.
5. **Tax-delinquent** — County treasurer delinquent-tax rolls.
6. **Absentee / vacant / code-violation** — Assessor owner-address mismatch,
   USPS vacancy (licensed), city code-violation open data.
7. **Divorce / estate** — Family-court filings where publicly indexed.

Each lead row carries: address, parcel ID, owner(s), owner mailing address,
equity estimate, last-sale price/date, motivation signal(s), source, first-seen
timestamp, and a 0–100 deal score.

---

## 4. Creative + futuristic angles (what we'll build that the incumbents don't)

The incumbents (PropStream, REDX, Vulcan7, BatchLeads) own MLS licensing and
dialer workflows. We won't beat them on raw data breadth. We'll win on three
edges:

### 4a. Speed + agentic outreach
- Sub-minute push to the agent the moment a signal appears.
- Optional AI-drafted first-touch letter / SMS / email per lead, pre-filled
  with motivation-specific copy (expired ≠ probate ≠ pre-foreclosure).
- Voice-AI first-call option (disclosed, compliant with TCPA + state rules).

### 4b. Cross-signal "stacked motivation"
A house with one signal is a lead. A house with **three stacked signals**
(expired + tax-delinquent + absentee) is a near-certain deal. Our scoring
explicitly rewards stacked signals; most incumbent dashboards silo by source.

### 4c. Futuristic signals (roadmap, not v1)
- **Satellite + aerial imagery diffs** (licensed from Planet / Nearmap) to
  detect roof damage, pool neglect, deferred maintenance, vacant look.
- **Street-view time-series diffs** (Mapillary — open license) for curb appeal
  decay.
- **Permit / 311 / utility-shutoff signals** from city open-data portals.
- **Obituary + probate NLP matching** to identify heirs before the formal
  probate filing hits the docket.
- **Social signal NLP** (only on *publicly posted, TOS-allowed* content) —
  "moving," "downsizing," "inherited a house" posts on platforms that allow
  programmatic public read access.
- **Estate-planning-attorney partnership network** — offer agents warm
  referrals in exchange for a marketing fee; attorneys get a CRM of their
  estate-client properties.
- **On-market underpricing detector** — a house listed 8%+ below comps is a
  deal regardless of motivation. Licensed comps + regression model.

---

## 5. Architecture

```
        ┌─────────────────────────┐
        │   nuwavmedia site       │   static marketing, Cloudflare Pages
        │   /deal-scout landing   │   (existing Next.js export)
        └─────────────────────────┘
                   │ POST /leads (waitlist)
                   ▼
        ┌─────────────────────────┐
        │  Deal Scout API Worker  │   Cloudflare Worker (TypeScript)
        │   - REST endpoints      │
        │   - auth (JWT)          │
        │   - scoring             │
        └──────────┬──────────────┘
                   │
        ┌──────────┴──────────────┐
        ▼                         ▼
  ┌──────────┐            ┌──────────────┐
  │ D1 (SQL) │            │  KV / R2     │
  │ leads,   │            │  raw feed    │
  │ agents,  │            │  snapshots   │
  │ events   │            │              │
  └──────────┘            └──────────────┘
                   ▲
        ┌──────────┴──────────────┐
        │  Cron-triggered ingest  │   Cloudflare Cron Triggers
        │  per-source connectors  │
        └─────────────────────────┘
                   │
        ┌──────────┴──────────────┐
        ▼          ▼          ▼
   HUD REO    FSBO RSS    County RSS   (green-tier sources)
```

**Why Cloudflare Workers + D1:** The marketing site is already on Cloudflare
Pages. Workers keep latency low for the "sub-minute alert" feature, D1 is
cheap for the lead table (<10M rows easily), cron triggers handle polling, and
it all lives behind one account. If we outgrow D1 we migrate to Postgres on
Neon/Supabase behind the same Worker API.

**Why not a traditional Node server:** Cold-start matters for cron +
alert-push workloads. Workers are already warm.

---

## 6. Tech stack (v1)

- **Marketing site:** Next.js 13 static export (existing). Adds `/deal-scout`
  landing page + waitlist form.
- **API:** Cloudflare Worker, TypeScript. Minimal routing (no framework
  needed at v1 — we can add Hono later).
- **DB:** Cloudflare D1. Schema in `workers/deal-scout/src/db/schema.sql`.
- **Queues:** Cloudflare Queues for per-source ingest fan-out (later).
- **Storage:** R2 for raw HTML/RSS snapshots (auditability).
- **Auth:** JWT via Worker. Magic-link email via Resend/Postmark (later).
- **Dialer / SMS:** Twilio (later, behind TCPA compliance gate).
- **Email:** Resend for transactional, Mailgun/SendGrid for outbound.
- **LLM calls:** Claude (Anthropic) for letter/SMS drafting. Prompt-cached
  per-agent profile.

---

## 7. Data model (D1)

See `workers/deal-scout/src/db/schema.sql`. Core tables:

- `agents` — user accounts (agents + investors)
- `searches` — saved geo + filter queries per agent
- `properties` — canonical property rows keyed by parcel ID + address hash
- `signals` — every motivation signal observed, with source + timestamp
- `leads` — denormalized view rows per (agent, property) with score + state
- `events` — outreach/activity log for agent-property pairs
- `ingest_runs` — audit log of every source poll (legal paper trail)

---

## 8. Deal-scoring model (v1, heuristic)

Score = base_score + Σ(signal_weights) + stacking_bonus − staleness_penalty.

```
Signal weights (v1):
  expired_listing       +25
  pre_foreclosure       +30
  probate               +28
  tax_delinquent        +22
  absentee_owner        +10
  vacancy               +12
  code_violation        +15
  high_equity_>=50%     +15
  high_equity_>=80%     +25   (replaces 50% bonus, not additive)
  priced_under_comp_8%  +20
  priced_under_comp_15% +30   (replaces 8% bonus)
  days_on_market_>180   +8

Stacking bonus:
  2 signals             +10
  3 signals             +25
  4+ signals            +40

Staleness penalty:
  signal age > 14 days  −5
  signal age > 45 days  −15
  signal age > 90 days  −30
```

v2 replaces this with a logistic model trained on closed-deal outcomes once
we have a corpus.

---

## 9. Phased build plan

**Phase 0 — done in this branch**
- [x] Strategy doc (this file)
- [x] `/deal-scout` landing page with waitlist capture
- [x] Worker scaffold with D1 schema, scoring, green-tier connector stubs
- [x] Experimental module skeleton (disabled)

**Phase 1 — first real pull (~1 week of work)**
- [ ] Wire one green-tier source end-to-end (HUD REO is easiest)
- [ ] Persist to D1, dedupe, score, expose GET /leads
- [ ] Minimal agent auth + dashboard page at `/deal-scout/app`
- [ ] Email alerts via Resend

**Phase 2 — multi-source + motivation stacking**
- [ ] Add 3 county connectors (pilot market: one metro we pick)
- [ ] Add FSBO RSS aggregator
- [ ] Cross-signal matching + stacking bonus

**Phase 3 — outreach**
- [ ] Claude-drafted first-touch letter/SMS per motivation type
- [ ] Skip-trace integration (BatchData or similar)
- [ ] Twilio SMS w/ TCPA compliance gate

**Phase 4 — licensed data + billing**
- [ ] ATTOM or BatchData license for comps + owner data nationwide
- [ ] Stripe billing, tiered plans
- [ ] Multi-tenant isolation audit

**Phase 5 — differentiators**
- [ ] Imagery-diff signal (roof/pool/vacancy)
- [ ] Obituary → heir matching
- [ ] On-market underpricing detector

---

## 10. What we're explicitly NOT doing

- Not scraping Zillow, Realtor.com, Trulia, or Redfin in production.
- Not scraping MLS IDX pages.
- Not scraping behind auth.
- Not rotating residential proxies to evade detection.
- Not sending outreach without per-state TCPA/CAN-SPAM compliance checks.
- Not storing PII beyond the minimum needed for the lead.
- Not reselling MLS-licensed data outside the license terms.

If any of these change, it's a business decision that belongs in a separate
document approved by counsel, not a pull request.
