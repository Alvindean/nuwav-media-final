/**
 * Foreclosure auction calendars (trustee sales / sheriff sales).
 *
 * Legal status: GREEN. Trustee and sheriff sales are legally-required
 * public notices. Most counties publish a calendar page (HTML) or CSV.
 *
 * Signals produced:
 *   - foreclosure_auction  (severity ramps as the sale date approaches)
 *
 * This v0.1 is a scaffolding registry. Operators add a per-county adapter
 * in the same pattern as county-records.ts.
 */

import type { Env } from "../index";
import {
  IngestSummary,
  politeFetch,
  snapshotToR2,
  upsertProperty,
  upsertSignal
} from "./_common";

interface AuctionRow {
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  parcelId?: string;
  auctionDate: number; // unix ms
  openingBid?: number;
  sourceRef?: string;
}

interface AuctionAdapter {
  id: string;
  name: string;
  fetchAndParse(env: Env): Promise<AuctionRow[]>;
}

const ADAPTERS: AuctionAdapter[] = [
  // Add per-county adapters here.
];

export async function ingestForeclosureAuctions(env: Env): Promise<IngestSummary> {
  const summary: IngestSummary = {
    source: "foreclosure_auctions",
    itemsSeen: 0,
    itemsNew: 0,
    itemsUpdated: 0,
    touchedPropertyIds: []
  };

  if (ADAPTERS.length === 0) {
    return { ...summary, skipped: true, reason: "no adapters configured" };
  }

  const now = Date.now();
  for (const adapter of ADAPTERS) {
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

        // Severity ramps from 0.5 (>30d out) to 1.0 (≤7d out).
        const daysOut = Math.max(0, (row.auctionDate - now) / 86_400_000);
        const severity =
          daysOut <= 7 ? 1.0 : daysOut <= 30 ? 0.8 : 0.5;

        await upsertSignal(env.DB, {
          propertyId,
          signalType: "foreclosure_auction",
          source: `auction:${adapter.id}`,
          sourceRef: row.sourceRef,
          severity,
          observedAt: now,
          payload: {
            auction_date: row.auctionDate,
            opening_bid: row.openingBid
          }
        });
        summary.touchedPropertyIds!.push(propertyId);
        summary.itemsNew++;
      }
    } catch (err: any) {
      console.error(`[deal-scout] auction ${adapter.id} failed`, err);
    }
  }

  return summary;
}
