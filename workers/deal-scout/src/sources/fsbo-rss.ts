/**
 * FSBO RSS aggregator.
 *
 * Legal status: GREEN, conditional. We only pull from FSBO sites that:
 *   (a) publish a public RSS/Atom feed, AND
 *   (b) have no ToS clause forbidding programmatic read of the feed.
 *
 * Operators must keep this allow-list current. Adding a new source requires
 * a written note in the PR that says "I checked their ToS on <date> and it
 * permits this." Don't scrape generic listing pages here — that belongs in
 * src/sources/_experimental/.
 */

import type { Env } from "../index";
import {
  IngestSummary,
  politeFetch,
  snapshotToR2,
  upsertProperty,
  upsertSignal
} from "./_common";

interface FeedSource {
  id: string;
  name: string;
  url: string;
  // Minimal regex-based parse: we pull <item>…<title>…<description>…</item>
  // shapes. This is intentionally dumb; replace with a real XML parser
  // (e.g. fast-xml-parser bundled via esbuild) once we have a real feed.
}

// Allow-list. Empty in v0.1 — operators must populate when onboarding a
// market. Leaving it empty means this connector cleanly no-ops.
const FEEDS: FeedSource[] = [
  // { id: "example_fsbo", name: "Example FSBO", url: "https://example.com/feed.rss" }
];

export async function ingestFsboRss(env: Env): Promise<IngestSummary> {
  const summary: IngestSummary = {
    source: "fsbo_rss",
    itemsSeen: 0,
    itemsNew: 0,
    itemsUpdated: 0,
    touchedPropertyIds: []
  };

  if (FEEDS.length === 0) {
    return { ...summary, skipped: true, reason: "no feeds configured" };
  }

  for (const feed of FEEDS) {
    try {
      const res = await politeFetch(feed.url);
      if (!res.ok) continue;
      const body = await res.text();
      summary.bytesFetched = (summary.bytesFetched ?? 0) + body.length;
      await snapshotToR2(env.SNAPSHOTS, `fsbo_rss/${feed.id}`, body, "application/xml");

      const items = parseItems(body);
      summary.itemsSeen += items.length;

      for (const item of items) {
        if (!item.address) continue;
        const propertyId = await upsertProperty(env.DB, {
          address: {
            line1: item.address,
            city: item.city,
            state: item.state,
            zip: item.zip
          }
        });
        await upsertSignal(env.DB, {
          propertyId,
          signalType: "fsbo",
          source: `fsbo_rss:${feed.id}`,
          sourceRef: item.guid,
          observedAt: item.pubDate ? Date.parse(item.pubDate) : Date.now()
        });
        summary.touchedPropertyIds!.push(propertyId);
        summary.itemsNew++;
      }
    } catch (err: any) {
      console.error(`[deal-scout] fsbo feed ${feed.id} failed`, err);
    }
  }

  return summary;
}

interface FeedItem {
  guid?: string;
  pubDate?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

function parseItems(xml: string): FeedItem[] {
  const out: FeedItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const chunk = m[1] ?? "";
    const guid = pick(chunk, /<guid[^>]*>([\s\S]*?)<\/guid>/i);
    const pubDate = pick(chunk, /<pubDate>([\s\S]*?)<\/pubDate>/i);
    const title = pick(chunk, /<title>([\s\S]*?)<\/title>/i);
    const description = pick(chunk, /<description>([\s\S]*?)<\/description>/i);
    const address = extractAddress(title + " " + description);
    out.push({ guid, pubDate, ...address });
  }
  return out;
}

function pick(s: string, re: RegExp): string | undefined {
  const m = s.match(re);
  return m?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

/**
 * Very loose address extractor — grabs "Street, City, ST ZIP" shapes.
 * Replace with a licensed USPS / Smarty parse in v1.
 */
function extractAddress(text: string): {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
} {
  const m = text.match(
    /([\w.\s#-]+?),\s*([A-Za-z .-]+?),\s*([A-Z]{2})\s*(\d{5})(?:-\d{4})?/
  );
  if (!m) return {};
  return { address: m[1]!.trim(), city: m[2]!.trim(), state: m[3], zip: m[4] };
}
