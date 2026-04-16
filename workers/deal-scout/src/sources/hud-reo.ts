/**
 * HUD Home Store — FHA/HUD REO (foreclosed government-held) listings.
 *
 * Legal status: GREEN. HUD publishes these listings publicly and encourages
 * broad distribution — they want the homes bought. We use the public data
 * feed; there is no ToS that forbids programmatic read.
 *
 * Signals produced:
 *   - high_equity (these are almost always below-market — discounted REO)
 *   - priced_under_comp_8 (if comp data is available)
 *
 * NOTE: The HUD Home Store JSON endpoint structure has changed over the
 * years. This connector is a best-effort template: it probes a known feed
 * URL, snapshots the response, and parses whatever rows it can. In prod
 * we'll replace the URL and parser with whatever HUD currently ships.
 */

import type { Env } from "../index";
import {
  IngestSummary,
  politeFetch,
  snapshotToR2,
  upsertProperty,
  upsertSignal
} from "./_common";

// Placeholder URL — see note above. Operators should confirm and update.
const HUD_FEED_URL = "https://www.hudhomestore.gov/Listing/ListingSearch.aspx";

export async function ingestHudReo(env: Env): Promise<IngestSummary> {
  const summary: IngestSummary = {
    source: "hud_reo",
    itemsSeen: 0,
    itemsNew: 0,
    itemsUpdated: 0,
    touchedPropertyIds: []
  };

  let body: string;
  try {
    const res = await politeFetch(HUD_FEED_URL);
    if (!res.ok) {
      return {
        ...summary,
        skipped: true,
        reason: `hud http ${res.status}`
      };
    }
    body = await res.text();
    summary.bytesFetched = body.length;
    summary.snapshotKey = await snapshotToR2(
      env.SNAPSHOTS,
      "hud_reo",
      body,
      "text/html"
    );
  } catch (err: any) {
    return { ...summary, skipped: true, reason: `hud fetch: ${err?.message}` };
  }

  // Placeholder parse — in prod this will be replaced with the real schema.
  // We bail here rather than write synthetic rows.
  if (!body || body.length < 500) {
    return { ...summary, note: "empty response" };
  }

  // Example parse shape once we wire the real endpoint:
  //
  //   const rows: HudListing[] = parseHudFeed(body);
  //   for (const row of rows) {
  //     const propertyId = await upsertProperty(env.DB, {
  //       address: { line1: row.street, city: row.city, state: row.state, zip: row.zip },
  //       propertyType: row.type,
  //       estimatedValue: row.listPrice,
  //       lat: row.lat,
  //       lng: row.lng
  //     });
  //     await upsertSignal(env.DB, {
  //       propertyId,
  //       signalType: "high_equity",
  //       source: "hud_reo",
  //       sourceRef: row.caseNumber,
  //       severity: 1.0,
  //       payload: { listPrice: row.listPrice },
  //       observedAt: Date.parse(row.listDate) || Date.now()
  //     });
  //     summary.touchedPropertyIds!.push(propertyId);
  //     summary.itemsNew++;
  //   }

  return {
    ...summary,
    note: "parser stub — wire real HUD schema in src/sources/hud-reo.ts"
  };
}
