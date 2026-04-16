/**
 * ZILLOW — EXPERIMENTAL STUB. Disabled by default.
 *
 * This file exists as a placeholder so the directory structure documents
 * our policy: if someone wants to research Zillow for personal use, this
 * is where that code would go. It ships with NO parsing logic and will
 * refuse to run unless the operator has explicitly enabled experimental
 * sources (see ./README.md and ./gate.ts).
 *
 * DO NOT add parsing logic here and then enable this by default. Any change
 * that flips experimental sources on in production-facing config must come
 * with a written sign-off from counsel in the PR description.
 */

import type { Env } from "../../index";
import { IngestSummary } from "../_common";
import { requireExperimentalEnabled } from "./gate";

export async function ingestZillowExperimental(env: Env): Promise<IngestSummary> {
  const gate = requireExperimentalEnabled(
    env as Env & Record<string, string | undefined>,
    "ENABLE_EXPERIMENTAL_ZILLOW"
  );
  if (!gate.enabled) {
    return {
      source: "experimental_zillow",
      itemsSeen: 0,
      itemsNew: 0,
      itemsUpdated: 0,
      skipped: true,
      reason: gate.reason
    };
  }

  // Intentionally no implementation. See ./README.md.
  return {
    source: "experimental_zillow",
    itemsSeen: 0,
    itemsNew: 0,
    itemsUpdated: 0,
    skipped: true,
    reason: "no implementation; see _experimental/README.md"
  };
}
