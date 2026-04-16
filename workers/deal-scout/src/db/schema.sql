-- Deal Scout D1 schema v0.1
-- Run with:
--   wrangler d1 execute deal_scout --file=./src/db/schema.sql

PRAGMA foreign_keys = ON;

-- =========================================================================
-- Agents (the logged-in users: real estate agents, investors, wholesalers)
-- =========================================================================
CREATE TABLE IF NOT EXISTS agents (
  id              TEXT PRIMARY KEY,              -- uuid
  email           TEXT NOT NULL UNIQUE,
  name            TEXT,
  role            TEXT NOT NULL DEFAULT 'agent', -- agent|investor|broker|other
  phone           TEXT,
  brokerage       TEXT,
  plan            TEXT NOT NULL DEFAULT 'waitlist', -- waitlist|trial|pro|team
  created_at      INTEGER NOT NULL,              -- unix ms
  last_login_at   INTEGER
);

-- Public waitlist signups (pre-auth).
CREATE TABLE IF NOT EXISTS waitlist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL,
  market     TEXT,
  role       TEXT,
  source     TEXT,                               -- utm tag
  ip_hash    TEXT,                               -- salted sha256 of remote IP
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- =========================================================================
-- Saved searches (an agent's farm: geo + filters)
-- =========================================================================
CREATE TABLE IF NOT EXISTS searches (
  id           TEXT PRIMARY KEY,
  agent_id     TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  zip_codes    TEXT,                             -- comma-separated
  counties     TEXT,                             -- comma-separated FIPS
  price_min    INTEGER,
  price_max    INTEGER,
  equity_min   REAL,                             -- 0.0–1.0
  property_types TEXT,                           -- sfh,condo,multi,land
  signal_types   TEXT,                           -- comma-separated enum below
  created_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_searches_agent ON searches(agent_id);

-- =========================================================================
-- Canonical properties
-- One row per real-world property, keyed by a stable hash.
-- =========================================================================
CREATE TABLE IF NOT EXISTS properties (
  id              TEXT PRIMARY KEY,              -- sha256(normalized_address|parcel_id)
  parcel_id       TEXT,
  apn             TEXT,
  address_line1   TEXT NOT NULL,
  city            TEXT,
  state           TEXT,                          -- 2-letter
  zip             TEXT,
  county_fips     TEXT,
  lat             REAL,
  lng             REAL,
  property_type   TEXT,                          -- sfh|condo|multi|land|other
  bedrooms        INTEGER,
  bathrooms       REAL,
  sqft            INTEGER,
  lot_sqft        INTEGER,
  year_built      INTEGER,
  last_sale_date  TEXT,                          -- ISO date
  last_sale_price INTEGER,
  estimated_value INTEGER,                       -- from licensed AVM
  estimated_equity_pct REAL,                     -- 0.0–1.0
  owner_name      TEXT,
  owner_mailing_address TEXT,                    -- for absentee detection
  first_seen_at   INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(zip);
CREATE INDEX IF NOT EXISTS idx_properties_county ON properties(county_fips);
CREATE INDEX IF NOT EXISTS idx_properties_updated ON properties(updated_at);

-- =========================================================================
-- Signals: every motivation event we observe.
-- A property can have many signals over time.
-- =========================================================================
CREATE TABLE IF NOT EXISTS signals (
  id            TEXT PRIMARY KEY,
  property_id   TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  signal_type   TEXT NOT NULL,
  -- allowed signal_type values (v1):
  --   expired_listing
  --   fsbo
  --   pre_foreclosure   (NOD, lis pendens, notice of trustee sale)
  --   foreclosure_auction
  --   probate
  --   tax_delinquent
  --   absentee_owner
  --   vacancy
  --   code_violation
  --   eviction_filing
  --   high_equity
  --   priced_under_comp
  --   days_on_market_long
  --   aerial_decay       (roadmap)
  --   obituary_heir      (roadmap)
  source        TEXT NOT NULL,                   -- hud_reo|county_nod|probate_ct|...
  source_ref    TEXT,                            -- foreign id in source system
  severity      REAL DEFAULT 1.0,                -- 0.0–1.0 multiplier
  payload_json  TEXT,                            -- source-specific JSON
  observed_at   INTEGER NOT NULL,                -- when source published
  ingested_at   INTEGER NOT NULL,                -- when we stored it
  active        INTEGER NOT NULL DEFAULT 1       -- 0 if superseded/withdrawn
);
CREATE INDEX IF NOT EXISTS idx_signals_property ON signals(property_id);
CREATE INDEX IF NOT EXISTS idx_signals_type_active ON signals(signal_type, active);
CREATE INDEX IF NOT EXISTS idx_signals_observed ON signals(observed_at);

-- =========================================================================
-- Leads: denormalized per-agent view onto properties.
-- Recomputed when signals change or when a new search matches.
-- =========================================================================
CREATE TABLE IF NOT EXISTS leads (
  id            TEXT PRIMARY KEY,
  agent_id      TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  property_id   TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  search_id     TEXT REFERENCES searches(id) ON DELETE SET NULL,
  score         INTEGER NOT NULL,                -- 0–100
  signal_count  INTEGER NOT NULL DEFAULT 0,
  signal_types  TEXT,                            -- comma-separated summary
  state         TEXT NOT NULL DEFAULT 'new',     -- new|viewed|contacted|won|lost|snoozed
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  UNIQUE(agent_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_leads_agent_score ON leads(agent_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_state ON leads(agent_id, state);

-- =========================================================================
-- Outreach / activity log
-- =========================================================================
CREATE TABLE IF NOT EXISTS events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id     TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  property_id  TEXT REFERENCES properties(id) ON DELETE SET NULL,
  lead_id      TEXT REFERENCES leads(id) ON DELETE SET NULL,
  kind         TEXT NOT NULL,                    -- viewed|letter_drafted|letter_sent|sms|call|note|won|lost
  payload_json TEXT,
  created_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent_id, created_at DESC);

-- =========================================================================
-- Ingest runs — legal paper trail for every source poll.
-- Keep forever. Useful for compliance audits.
-- =========================================================================
CREATE TABLE IF NOT EXISTS ingest_runs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  source          TEXT NOT NULL,
  status          TEXT NOT NULL,                 -- ok|error|skipped
  items_seen      INTEGER DEFAULT 0,
  items_new       INTEGER DEFAULT 0,
  items_updated   INTEGER DEFAULT 0,
  bytes_fetched   INTEGER DEFAULT 0,
  snapshot_key    TEXT,                          -- R2 key of raw snapshot
  error_message   TEXT,
  started_at      INTEGER NOT NULL,
  finished_at     INTEGER
);
CREATE INDEX IF NOT EXISTS idx_ingest_runs_source ON ingest_runs(source, started_at DESC);
