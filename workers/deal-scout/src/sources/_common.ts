/**
 * Shared helpers for all source connectors.
 *
 * Every connector returns an IngestSummary so the Worker entry can log it
 * to ingest_runs and (if touchedPropertyIds is set) recompute lead scores.
 */
import { normalizeAddress, AddressInput } from "../normalize";

export interface IngestSummary {
  source: string;
  itemsSeen: number;
  itemsNew: number;
  itemsUpdated: number;
  bytesFetched?: number;
  snapshotKey?: string;
  touchedPropertyIds?: string[];
  note?: string;
  skipped?: boolean;
  reason?: string;
}

export interface UpsertPropertyInput {
  address: AddressInput;
  parcelId?: string;
  apn?: string;
  propertyType?: string;
  estimatedValue?: number;
  lastSalePrice?: number;
  lastSaleDate?: string;
  ownerName?: string;
  ownerMailingAddress?: string;
  lat?: number;
  lng?: number;
}

export interface UpsertSignalInput {
  propertyId: string;
  signalType: string;
  source: string;
  sourceRef?: string;
  severity?: number;
  payload?: unknown;
  observedAt: number;
}

export async function upsertProperty(
  db: D1Database,
  input: UpsertPropertyInput
): Promise<string> {
  const norm = await normalizeAddress(input.address, input.parcelId);
  const now = Date.now();

  await db
    .prepare(
      `INSERT INTO properties (
          id, parcel_id, apn, address_line1, city, state, zip,
          property_type, estimated_value, last_sale_price, last_sale_date,
          owner_name, owner_mailing_address, lat, lng,
          first_seen_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
          parcel_id             = COALESCE(excluded.parcel_id, properties.parcel_id),
          apn                   = COALESCE(excluded.apn, properties.apn),
          property_type         = COALESCE(excluded.property_type, properties.property_type),
          estimated_value       = COALESCE(excluded.estimated_value, properties.estimated_value),
          last_sale_price       = COALESCE(excluded.last_sale_price, properties.last_sale_price),
          last_sale_date        = COALESCE(excluded.last_sale_date, properties.last_sale_date),
          owner_name            = COALESCE(excluded.owner_name, properties.owner_name),
          owner_mailing_address = COALESCE(excluded.owner_mailing_address, properties.owner_mailing_address),
          lat                   = COALESCE(excluded.lat, properties.lat),
          lng                   = COALESCE(excluded.lng, properties.lng),
          updated_at            = excluded.updated_at`
    )
    .bind(
      norm.hash,
      input.parcelId ?? null,
      input.apn ?? null,
      norm.line1,
      norm.city || null,
      norm.state || null,
      norm.zip || null,
      input.propertyType ?? null,
      input.estimatedValue ?? null,
      input.lastSalePrice ?? null,
      input.lastSaleDate ?? null,
      input.ownerName ?? null,
      input.ownerMailingAddress ?? null,
      input.lat ?? null,
      input.lng ?? null,
      now,
      now
    )
    .run();

  return norm.hash;
}

export async function upsertSignal(
  db: D1Database,
  input: UpsertSignalInput
): Promise<void> {
  const id = await signalId(input);
  await db
    .prepare(
      `INSERT INTO signals (
          id, property_id, signal_type, source, source_ref, severity,
          payload_json, observed_at, ingested_at, active
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT(id) DO UPDATE SET
          severity     = excluded.severity,
          payload_json = excluded.payload_json,
          observed_at  = excluded.observed_at,
          active       = 1`
    )
    .bind(
      id,
      input.propertyId,
      input.signalType,
      input.source,
      input.sourceRef ?? null,
      input.severity ?? 1.0,
      input.payload ? JSON.stringify(input.payload) : null,
      input.observedAt,
      Date.now()
    )
    .run();
}

/**
 * Deterministic signal id — if the same source reports the same signal for
 * the same property, we update rather than insert a duplicate row.
 */
async function signalId(input: UpsertSignalInput): Promise<string> {
  const key = `${input.propertyId}|${input.signalType}|${input.source}|${input.sourceRef ?? ""}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(key)
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * Snapshot the raw response body to R2 for audit. Keyed by source + date +
 * timestamp. Never throws — snapshot failure must not fail the ingest.
 */
export async function snapshotToR2(
  bucket: R2Bucket,
  source: string,
  body: ArrayBuffer | string,
  contentType = "application/octet-stream"
): Promise<string | undefined> {
  try {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const key = `${source}/${date}/${Date.now()}`;
    await bucket.put(key, body, { httpMetadata: { contentType } });
    return key;
  } catch (err) {
    console.error("[deal-scout] r2 snapshot failed", err);
    return undefined;
  }
}

/**
 * Polite fetch with a descriptive UA so operators can identify us in their
 * access logs and reach out if they want us to change cadence.
 */
export function politeFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("User-Agent")) {
    headers.set(
      "User-Agent",
      "DealScoutBot/0.1 (+https://nuwavmedia.com/deal-scout; contact hello@nuwavmedia.com)"
    );
  }
  if (!headers.has("Accept")) headers.set("Accept", "*/*");
  return fetch(url, { ...init, headers });
}
