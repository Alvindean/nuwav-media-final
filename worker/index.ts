// Cloudflare Worker: static site from ./out, plus the Souldies survey API.
// Only /api/* reaches this code (see run_worker_first in wrangler.toml).
//
//   POST /api/survey   save one survey response
//   GET  /api/results  aggregated totals (no emails)
//
// Responses are stored in a SQLite-backed Durable Object, which Cloudflare
// creates on deploy from the [[migrations]] entry, so no dashboard setup is needed.

import { DurableObject } from "cloudflare:workers";
import { aggregate, validateAnswers, type Answers, type Results } from "../lib/souldiesSurvey";

type Env = {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  SURVEY: DurableObjectNamespace<SurveyStore>;
};

const MAX_BODY_BYTES = 16 * 1024;

export class SurveyStore extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS responses (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         created_at TEXT NOT NULL,
         answers TEXT NOT NULL
       )`
    );
  }

  add(answers: Answers): void {
    this.ctx.storage.sql.exec(
      "INSERT INTO responses (created_at, answers) VALUES (?, ?)",
      new Date().toISOString(),
      JSON.stringify(answers)
    );
  }

  results(): Results {
    const rows = this.ctx.storage.sql
      .exec<{ created_at: string; answers: string }>("SELECT created_at, answers FROM responses ORDER BY id DESC")
      .toArray();
    return aggregate(
      rows.map((r) => JSON.parse(r.answers) as Answers),
      rows.length ? rows[0].created_at : null
    );
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    // One store for this survey; a new survey would use a new name.
    const store = env.SURVEY.get(env.SURVEY.idFromName("souldies-you-are-my-everything"));

    if (pathname === "/api/survey") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      const text = await request.text();
      if (text.length > MAX_BODY_BYTES) return json({ error: "Too large" }, 413);
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }
      const result = validateAnswers(body);
      if (!result.ok) return json({ error: result.error }, 400);
      await store.add(result.answers);
      return json({ ok: true }, 201);
    }

    if (pathname === "/api/results") {
      if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
      return json(await store.results());
    }

    if (pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
    return env.ASSETS.fetch(request);
  }
};
