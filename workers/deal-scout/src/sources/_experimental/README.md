# Experimental sources — READ THIS BEFORE ENABLING

Everything in this directory is **disabled by default** and will remain so
unless *all three* of the following are true:

1. `ENABLE_EXPERIMENTAL_SOURCES = "true"` in `wrangler.toml` `[vars]`.
2. A per-source secret (e.g. `ENABLE_EXPERIMENTAL_ZILLOW=true`) is set via
   `wrangler secret put`.
3. The operator has read and acknowledged this document.

## Why these are separate

The "yellow-tier" sources — general-purpose scraping of Zillow, Realtor.com,
Trulia, Redfin, or MLS IDX pages — carry legal and operational risk the
green-tier sources do not:

- **Terms-of-service violation.** Zillow, Realtor.com, Trulia, and Redfin all
  explicitly prohibit automated data collection in their ToS. Running a
  scraper against them is a breach of contract, regardless of whether the
  data is "public."
- **Copyright exposure.** MLS data is copyrighted to NAR and local MLS
  boards. Redistributing it without an IDX license is copyright
  infringement, not just a ToS issue.
- **CFAA / unauthorized-access theories.** Post-*hiQ v. LinkedIn* the CFAA
  landscape is nuanced but unresolved. Platforms aggressively send
  cease-and-desist letters and pursue injunctions.
- **Operational brittleness.** Anti-bot systems (Akamai, PerimeterX, Cloudflare
  itself) will ban your IP ranges, invalidate your session tokens, and
  poison results. Scrapers here will fail silently and often.
- **Business risk.** If Deal Scout's reputation depends on these data sources,
  a single cease-and-desist can zero out the product.

## Rules for code in this directory

- MUST be gated behind both the global flag and a per-source flag.
- MUST refuse to start if any flag is missing.
- MUST log every request with source URL + timestamp to `ingest_runs` so
  operators have a paper trail.
- MUST NOT circumvent CAPTCHAs, rate limits, or auth.
- MUST NOT rotate residential proxies, forge user agents to look human, or
  use any other detection-evasion technique.
- MUST NOT access pages behind a login.
- MUST include a contact email in the User-Agent so site operators can
  reach out before taking legal action.

## What belongs here

- Prototype research code for personal, non-commercial use.
- Experiments against sites whose ToS permit programmatic access but that we
  haven't fully validated (promote to green when validated).

## What does NOT belong here

- Anything targeting MLS IDX systems. MLS data must come through a licensed
  broker integration, full stop.
- Anything that scrapes behind auth.
- Anything that evades rate limits or bot detection.

If you're not sure whether code belongs here or should be deleted, it should
be deleted.
