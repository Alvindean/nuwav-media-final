/**
 * Plain-text script → geo-video project compiler.
 *
 * Paste (or dictate) a script — one sentence per beat — and this builds a
 * full timeline: each sentence becomes a scene, countries mentioned in the
 * sentence are detected against the loaded Natural Earth dataset, the camera
 * flies to them, they light up, arcs connect multi-country sentences, and
 * the sentence itself becomes the caption + voiceover line.
 *
 * No AI/API involved — pure heuristics, runs entirely in the browser.
 */

import { GeoArc, GeoPoint, GeoScene, GeoVideoProject } from "./geo-video";

interface Place {
  name: string;
  lat: number;
  lng: number;
  altitude: number;
  /** codes/names fed into scene.highlight */
  highlight: string[];
}

/** Common ways scripts refer to places that differ from Natural Earth names. */
const ALIASES: Record<string, string> = {
  "united states": "United States of America",
  usa: "United States of America",
  "u.s.": "United States of America",
  "u.s.a.": "United States of America",
  america: "United States of America",
  washington: "United States of America",
  uk: "United Kingdom",
  britain: "United Kingdom",
  england: "United Kingdom",
  "south korea": "South Korea",
  korea: "South Korea",
  "north korea": "North Korea",
  uae: "United Arab Emirates",
  "saudi arabia": "Saudi Arabia",
  holland: "Netherlands",
  beijing: "China",
  shanghai: "China",
  shenzhen: "China",
  taipei: "Taiwan",
  moscow: "Russia",
  tokyo: "Japan",
  delhi: "India",
  mumbai: "India",
  brussels: "Belgium",
  berlin: "Germany",
  paris: "France",
  london: "United Kingdom"
};

/** Multi-country regions get a fixed wide camera + a highlight group. */
const REGIONS: Record<string, Place> = {
  europe: {
    name: "Europe",
    lat: 50,
    lng: 10,
    altitude: 1.7,
    highlight: ["DEU", "FRA", "ITA", "ESP", "NLD", "BEL", "POL", "AUT", "CZE"]
  },
  asia: { name: "Asia", lat: 30, lng: 95, altitude: 2.0, highlight: [] },
  africa: { name: "Africa", lat: 2, lng: 20, altitude: 1.9, highlight: [] },
  "middle east": {
    name: "Middle East",
    lat: 27,
    lng: 45,
    altitude: 1.5,
    highlight: ["SAU", "ARE", "IRN", "IRQ", "ISR", "QAT", "KWT"]
  },
  "latin america": { name: "Latin America", lat: -15, lng: -60, altitude: 2.0, highlight: [] },
  arctic: { name: "Arctic", lat: 78, lng: 0, altitude: 1.8, highlight: [] },
  "south china sea": { name: "South China Sea", lat: 14, lng: 114, altitude: 1.2, highlight: [] }
};

/** Largest-polygon bbox centre — robust for multipolygon countries. */
function featureCenter(f: any): { lat: number; lng: number; span: number } | null {
  const geom = f?.geometry;
  if (!geom) return null;
  const polys: number[][][][] =
    geom.type === "Polygon" ? [geom.coordinates] : geom.type === "MultiPolygon" ? geom.coordinates : [];
  let best: { area: number; minLat: number; maxLat: number; minLng: number; maxLng: number } | null =
    null;
  for (const poly of polys) {
    const ring = poly[0];
    if (!ring?.length) continue;
    let minLat = 90,
      maxLat = -90,
      minLng = 180,
      maxLng = -180;
    for (const [lng, lat] of ring) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
    const area = (maxLat - minLat) * (maxLng - minLng);
    if (!best || area > best.area) best = { area, minLat, maxLat, minLng, maxLng };
  }
  if (!best) return null;
  const span = Math.max(best.maxLat - best.minLat, (best.maxLng - best.minLng) * 0.8);
  return {
    lat: (best.minLat + best.maxLat) / 2,
    lng: (best.minLng + best.maxLng) / 2,
    span
  };
}

const spanToAltitude = (span: number) =>
  Math.min(1.9, Math.max(0.75, span * 0.028 + 0.55));

function findPlaces(sentence: string, countries: any[]): Place[] {
  const lower = ` ${sentence.toLowerCase().replace(/[^a-zÀ-ɏ.\s-]/g, " ")} `;
  const places: Place[] = [];
  const seen = new Set<string>();
  const push = (p: Place) => {
    if (!seen.has(p.name)) {
      seen.add(p.name);
      places.push(p);
    }
  };

  const hasWord = (term: string) =>
    lower.includes(` ${term} `) ||
    lower.includes(` ${term}.`) ||
    lower.includes(` ${term},`) ||
    lower.includes(` ${term}'`);

  for (const [term, region] of Object.entries(REGIONS))
    if (hasWord(term)) push(region);

  const byName = (query: string): Place | null => {
    const f = countries.find((c) => {
      const p = c.properties ?? {};
      return [p.ADMIN, p.NAME, p.NAME_LONG].some(
        (n: string) => n && n.toLowerCase() === query.toLowerCase()
      );
    });
    if (!f) return null;
    const c = featureCenter(f);
    if (!c) return null;
    const iso = f.properties?.ISO_A3 && f.properties.ISO_A3 !== "-99"
      ? f.properties.ISO_A3
      : f.properties?.ADM0_A3;
    return {
      name: f.properties?.ADMIN ?? query,
      lat: c.lat,
      lng: c.lng,
      altitude: spanToAltitude(c.span),
      highlight: [iso ?? query]
    };
  };

  for (const [alias, admin] of Object.entries(ALIASES)) {
    if (hasWord(alias)) {
      const p = byName(admin);
      if (p) push(p);
    }
  }

  for (const f of countries) {
    const admin: string = f.properties?.ADMIN ?? "";
    if (admin && hasWord(admin.toLowerCase())) {
      const p = byName(admin);
      if (p) push(p);
    }
  }
  return places;
}

const BUNDLED_STILLS = [
  "/media/freight-network.svg",
  "/media/manufacturing.svg",
  "/media/semiconductor.svg",
  "/media/export-controls.svg",
  "/media/europe-trade.svg",
  "/media/macro-hold.svg"
];

const truncate = (s: string, n: number) =>
  s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, "") + "…";

export function splitScript(text: string): string[] {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const sentences =
    lines.length > 1
      ? lines
      : text
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter(Boolean);
  return sentences.filter((s) => s.replace(/[^a-zA-Z]/g, "").length > 2);
}

export function compileScript(
  text: string,
  countries: any[],
  title = "Voice-built briefing"
): GeoVideoProject {
  const sentences = splitScript(text);
  if (!sentences.length) throw new Error("No usable sentences in script");

  const scenes: GeoScene[] = [];
  const points: GeoPoint[] = [];
  const arcs: GeoArc[] = [];
  let cursor = 0;
  let prevPov = { lat: 12, lng: -20, altitude: 2.6 };

  sentences.forEach((sentence, i) => {
    const words = sentence.split(/\s+/).length;
    const dur = Math.min(6, Math.max(2.8, words * 0.34));
    const found = places(sentence);
    const target = found[0];
    const to = target
      ? { lat: target.lat, lng: target.lng, altitude: target.altitude }
      : {
          lat: Math.max(-40, Math.min(55, prevPov.lat + 6)),
          lng: prevPov.lng + 28,
          altitude: 2.2
        };
    const from =
      i === 0 ? { ...to, lng: to.lng - 18, altitude: Math.min(2.6, to.altitude + 0.5) } : prevPov;

    const scene: GeoScene = {
      id: `s${i + 1}`,
      label: (target ? `${target.name} · BEAT ${i + 1}` : `BEAT ${i + 1}`).toUpperCase(),
      start: cursor,
      end: cursor + dur,
      camera: { from, to, ease: "inOut" },
      caption: { text: truncate(sentence.toUpperCase(), 72) },
      voiceover: { text: sentence },
      media: {
        src: BUNDLED_STILLS[i % BUNDLED_STILLS.length],
        label: (target ? target.name : truncate(sentence, 26)).toUpperCase() + " · B-ROLL"
      }
    };
    if (found.length) scene.highlight = found.flatMap((p) => p.highlight);

    found.slice(0, 3).forEach((p, j) => {
      points.push({
        lat: p.lat,
        lng: p.lng,
        label: p.name.toUpperCase(),
        ring: j === 0,
        start: cursor,
        color: j === 0 ? "#ff2d55" : undefined
      });
    });
    if (found.length >= 2) {
      arcs.push({
        label: `${found[0].name} → ${found[1].name}`.toUpperCase(),
        startLat: found[0].lat,
        startLng: found[0].lng,
        endLat: found[1].lat,
        endLng: found[1].lng,
        start: cursor
      });
    }

    scenes.push(scene);
    prevPov = to;
    cursor += dur;
  });

  function places(sentence: string): Place[] {
    return findPlaces(sentence, countries);
  }

  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "voice-briefing";

  return {
    version: 1,
    meta: { title, slug },
    output: { width: 540, height: 960, fps: 30 },
    skin: "briefing",
    scenes,
    points,
    arcs
  };
}
