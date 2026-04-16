/**
 * County records — notice of default / lis pendens (pre-foreclosure) and
 * tax-delinquent lists.
 *
 * Legal status: GREEN — these are public records. But every county publishes
 * them differently: CSV download here, Socrata API there, a PDF somewhere
 * else. This connector is a registry of per-county adapters.
 *
 * Pattern: add a new entry to ADAPTERS keyed by county FIPS; implement
 * `fetchAndParse(env)` returning a list of { address, signalType, observedAt,
 * sourceRef, payload }. The dispatch logic handles the rest.
 */

import type { Env } from "../index";
import {
  IngestSummary,
  politeFetch,
  snapshotToR2,
  upsertProperty,
  upsertSignal
} from "./_common";

interface CountyRecord {
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  parcelId?: string;
  signalType: "pre_foreclosure" | "tax_delinquent";
  sourceRef?: string;
  observedAt: number;
  payload?: unknown;
}

interface CountyAdapter {
  countyFips: string;
  name: string;
  signalType: "pre_foreclosure" | "tax_delinquent";
  fetchAndParse(env: Env): Promise<CountyRecord[]>;
}

// Populate per market. Each adapter should:
//   1. Fetch a public CSV/JSON endpoint.
//   2. snapshotToR2 the raw response.
//   3. Return parsed rows.
const ADAPTERS: CountyAdapter[] = [
  // Example:
  // {
  //   countyFips: "48453",
  //   name: "Travis County, TX",
  //   signalType: "pre_foreclosure",
  //   async fetchAndParse(env) {
  //     const res = await politeFetch("https://<travis-county-public-csv>");
  //     const body = await res.text();
  //     await snapshotToR2(env.SNAPSHOTS, "county_travis_nod", body, "text/csv");
  //     return parseTravisCsv(body);
  //   }
  // }
];

export async function ingestCountyRecords(
  env: Env,
  scope: string
): Promise<IngestSummary> {
  const summary: IngestSummary = {
    source: scope,
    itemsSeen: 0,
    itemsNew: 0,
    itemsUpdated: 0,
    touchedPropertyIds: []
  };

  const wantSignal =
    scope === "county_nod" ? "pre_foreclosure" : "tax_delinquent";
  const active = ADAPTERS.filter((a) => a.signalType === wantSignal);

  if (active.length === 0) {
    return { ...summary, skipped: true, reason: "no adapters configured" };
  }

  for (const adapter of active) {
    try {
      const rows = await adapter.fetchAndParse(env);
      summary.itemsSeen += rows.length;

      for (const row of rows) {
        const propertyId = await upsertProperty(env.DB, {
          address: {
            line1: row.address,
            city: row.city,
            state: row.state,
            zip: row.zip
          },
          parcelId: row.parcelId
        });
        await upsertSignal(env.DB, {
          propertyId,
          signalType: row.signalType,
          source: `county:${adapter.countyFips}`,
          sourceRef: row.sourceRef,
          observedAt: row.observedAt,
          payload: row.payload
        });
        summary.touchedPropertyIds!.push(propertyId);
        summary.itemsNew++;
      }
    } catch (err: any) {
      console.error(`[deal-scout] county ${adapter.countyFips} failed`, err);
    }
  }

  return summary;
}
