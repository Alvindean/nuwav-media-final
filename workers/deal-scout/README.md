# Deal Scout — API Worker

Cloudflare Worker + D1 backend for Deal Scout. Aggregates real estate deal
signals from legally-sourced public records and pushes them to agents.

See `../../docs/deal-scout/STRATEGY.md` for the full product and architecture
doc.

## Layout

```
workers/deal-scout/
├── package.json
├── wrangler.toml          — Worker config + cron triggers + D1/KV/R2 bindings
├── tsconfig.json
└── src/
    ├── index.ts           — HTTP + scheduled entry
    ├── scoring.ts         — deal-score heuristic + lead recompute
    ├── normalize.ts       — address normalization + canonical property id
    ├── db/
    │   └── schema.sql     — D1 schema
    └── sources/
        ├── _common.ts             — upsert helpers + polite fetch + R2 snapshot
        ├── hud-reo.ts             — HUD REO (green)
        ├── fsbo-rss.ts            — FSBO RSS aggregator (green, allow-listed)
        ├── county-records.ts      — NOD + tax-delinquent (green, per-county adapters)
        ├── foreclosure-auctions.ts— trustee/sheriff sale calendars (green)
        └── _experimental/         — yellow-tier. DISABLED by default.
            ├── README.md          — read before enabling anything here
            ├── gate.ts            — hard gate requireExperimentalEnabled()
            └── zillow.stub.ts     — intentionally empty stub
```

## First-time setup

```bash
cd workers/deal-scout
npm install

# Create the D1 database (save the returned database_id into wrangler.toml):
npx wrangler d1 create deal_scout

# Create the KV namespace:
npx wrangler kv:namespace create deal_scout_kv
# paste id into wrangler.toml

# Create the R2 bucket:
npx wrangler r2 bucket create deal-scout-snapshots

# Apply schema (local):
npm run db:init:local
# Apply schema (prod):
npm run db:init

# Secrets:
npx wrangler secret put JWT_SIGNING_SECRET
npx wrangler secret put ANTHROPIC_API_KEY   # later, for AI outreach
npx wrangler secret put RESEND_API_KEY      # later, for email alerts
npx wrangler secret put ATTOM_API_KEY       # optional, licensed data
```

## Dev

```bash
npm run dev        # local worker + d1
npm run typecheck
```

Hit the dev endpoint:

```bash
curl http://localhost:8787/health
curl -X POST http://localhost:8787/waitlist \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","market":"Austin","role":"agent"}'

# Manual ingest run (dev only):
curl -X POST http://localhost:8787/_ingest/run \
  -H 'Content-Type: application/json' \
  -d '{"source":"hud_reo"}'
```

## Endpoints (v0.1)

| Method | Path | Notes |
| --- | --- | --- |
| GET  | `/health`          | liveness |
| POST | `/waitlist`        | public waitlist signup |
| GET  | `/leads`           | auth: agent's top leads (stub auth in dev) |
| GET  | `/properties/:id`  | auth: property + all signals |
| POST | `/_ingest/run`     | dev-only manual ingest |

## Cron schedule

Configured in `wrangler.toml`:

- `*/15 * * * *`  — foreclosure auctions, hot expired listings
- `0 */6 * * *`   — REO (HUD, Fannie, Freddie)
- `0 4 * * *`     — county NOD + tax-delinquent + FSBO RSS

## Legal posture

Default build is green-tier only: public records, government feeds, licensed
APIs. The `_experimental/` directory is gated three ways (env var + per-source
secret + non-prod environment) and ships empty.

Before adding a new source, document in the PR description:
- Where the data comes from (exact URL or API).
- Whether the source's ToS permits programmatic access (date checked).
- Whether the data is copyrighted and, if so, under what license we use it.

See `_experimental/README.md` for the no-go list.
