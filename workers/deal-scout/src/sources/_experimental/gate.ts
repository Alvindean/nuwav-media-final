/**
 * Hard gate for experimental (yellow-tier) sources.
 *
 * All connectors in this directory must call `requireExperimentalEnabled()`
 * at the top of their ingest function and short-circuit if it returns false.
 *
 * See ./README.md for the policy. Do not weaken this gate.
 */

import type { Env } from "../../index";

export function requireExperimentalEnabled(
  env: Env & Record<string, string | undefined>,
  perSourceFlag: string
): { enabled: true } | { enabled: false; reason: string } {
  if (env.ENABLE_EXPERIMENTAL_SOURCES !== "true") {
    return {
      enabled: false,
      reason: "ENABLE_EXPERIMENTAL_SOURCES is not 'true' in wrangler.toml"
    };
  }
  if (env[perSourceFlag] !== "true") {
    return {
      enabled: false,
      reason: `${perSourceFlag} secret is not set to 'true'`
    };
  }
  // Belt-and-suspenders: never run experimental in prod.
  if (env.DEAL_SCOUT_ENV === "prod") {
    return {
      enabled: false,
      reason: "experimental sources are forbidden in DEAL_SCOUT_ENV=prod"
    };
  }
  return { enabled: true };
}
