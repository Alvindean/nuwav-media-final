/**
 * Address normalization + canonical property ID.
 *
 * v0.1 is intentionally simple — upper-case, strip punctuation, collapse
 * whitespace, map common suffixes. v1 will call the USPS/Melissa/Smarty API
 * for full CASS-certified normalization, which is what we'll need for
 * dedupe across sources that disagree on "St" vs "Street".
 */

const SUFFIX_MAP: Record<string, string> = {
  STREET: "ST",
  AVENUE: "AVE",
  BOULEVARD: "BLVD",
  DRIVE: "DR",
  ROAD: "RD",
  LANE: "LN",
  COURT: "CT",
  PLACE: "PL",
  CIRCLE: "CIR",
  HIGHWAY: "HWY",
  PARKWAY: "PKWY",
  TERRACE: "TER",
  TRAIL: "TRL"
};

const DIRECTION_MAP: Record<string, string> = {
  NORTH: "N",
  SOUTH: "S",
  EAST: "E",
  WEST: "W",
  NORTHEAST: "NE",
  NORTHWEST: "NW",
  SOUTHEAST: "SE",
  SOUTHWEST: "SW"
};

export interface AddressInput {
  line1: string;
  city?: string;
  state?: string; // 2-letter
  zip?: string;
}

export interface NormalizedAddress {
  line1: string;
  city: string;
  state: string;
  zip: string;
  hash: string; // canonical property id
}

export async function normalizeAddress(
  input: AddressInput,
  parcelId?: string
): Promise<NormalizedAddress> {
  const line1 = normalizeLine1(input.line1);
  const city = (input.city || "").trim().toUpperCase();
  const state = (input.state || "").trim().toUpperCase().slice(0, 2);
  const zip = (input.zip || "").trim().slice(0, 5);

  const keyBase = parcelId
    ? `PARCEL:${parcelId.toUpperCase()}`
    : `ADDR:${line1}|${city}|${state}|${zip}`;
  const hash = await sha256(keyBase);

  return { line1, city, state, zip, hash };
}

function normalizeLine1(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[.,#]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((tok) => DIRECTION_MAP[tok] ?? SUFFIX_MAP[tok] ?? tok)
    .join(" ");
}

async function sha256(s: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(s)
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
