"use client";

import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { RefreshCw } from "lucide-react";
import { RELEASE, type QuestionResult, type Results } from "../../lib/souldiesSurvey";

const theme = {
  bg: "#1a0a0c",
  panel: "#2a1215",
  gold: "#d9a441",
  cream: "#f5ead6",
  muted: "#c9b79a",
  line: "#4a2a2d",
  track: "#3a1d20"
};

const font = "Georgia, 'Times New Roman', serif";

const card: React.CSSProperties = {
  background: theme.panel,
  border: `1px solid ${theme.line}`,
  borderRadius: 14,
  padding: 20,
  marginBottom: 16
};

const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

function share(q: QuestionResult | undefined, options: string[]) {
  if (!q || !q.answered || !q.counts) return null;
  const hits = q.counts.filter((c) => options.includes(c.option)).reduce((a, c) => a + c.count, 0);
  return pct(hits, q.answered);
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ ...card, marginBottom: 0, padding: 16 }}>
      <div style={{ color: theme.muted, fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: theme.cream, margin: "4px 0" }}>{value}</div>
      {note && <div style={{ color: theme.muted, fontSize: 13 }}>{note}</div>}
    </div>
  );
}

function Bars({ q }: { q: QuestionResult }) {
  const max = Math.max(1, ...q.counts!.map((c) => c.count));
  return (
    <div role="table" aria-label={q.prompt}>
      {q.counts!.map((c) => {
        const p = pct(c.count, q.answered);
        const label = q.type === "scale" ? `${c.option} ★` : c.option;
        return (
          <div
            key={c.option}
            role="row"
            title={`${label}: ${c.count} of ${q.answered} (${p}%)`}
            style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "4px 12px", padding: "6px 0" }}
          >
            <div role="cell" style={{ fontSize: 15 }}>{label}</div>
            <div role="cell" style={{ fontSize: 14, color: theme.muted, textAlign: "right", whiteSpace: "nowrap" }}>
              {c.count} · {p}%
            </div>
            <div style={{ gridColumn: "1 / -1", height: 10, background: theme.track, borderRadius: 4 }}>
              <div
                style={{
                  width: `${(c.count / max) * 100}%`,
                  minWidth: c.count ? 4 : 0,
                  height: "100%",
                  background: theme.gold,
                  borderRadius: "0 4px 4px 0"
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SurveyResults() {
  const [data, setData] = useState<Results | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/results", { cache: "no-store" });
      if (!res.ok) throw new Error(`Results unavailable (${res.status})`);
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Results unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byId = (id: string) => data?.questions.find((q) => q.id === id);
  const rating = byId("song_rating");

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.cream, fontFamily: font }}>
      <Head>
        <title>Souldies Survey Results</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <style>{"body{margin:0;background:#1a0a0c}"}</style>
      </Head>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ color: theme.gold, letterSpacing: 3, fontSize: 13, textTransform: "uppercase" }}>{RELEASE.label}</div>
          <h1 style={{ fontSize: 34, margin: "10px 0 6px" }}>Souldies Survey Results</h1>
          <p style={{ color: theme.muted, margin: 0 }}>
            &ldquo;{RELEASE.aSide}&rdquo; b/w &ldquo;{RELEASE.bSide}&rdquo; · {RELEASE.artist}
          </p>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 999,
              border: `1px solid ${theme.line}`,
              background: "transparent",
              color: theme.cream,
              fontFamily: font,
              fontSize: 15,
              cursor: loading ? "wait" : "pointer"
            }}
          >
            <RefreshCw size={16} /> {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && <div style={{ ...card, color: "#f08a7e" }}>{error}</div>}

        {data && data.total === 0 && (
          <div style={{ ...card, textAlign: "center", color: theme.muted }}>
            No responses yet. Share <a href="/survey/" style={{ color: theme.gold }}>the survey</a> to start collecting.
          </div>
        )}

        {data && data.total > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
              <Stat
                label="Responses"
                value={String(data.total)}
                note={data.lastResponseAt ? `Last: ${new Date(data.lastResponseAt).toLocaleString()}` : undefined}
              />
              <Stat
                label="Song rating"
                value={rating?.average !== undefined ? `${rating.average.toFixed(1)} / 5` : "–"}
                note={`${rating?.answered ?? 0} ratings`}
              />
              <Stat label="Would cruise to it" value={`${share(byId("cruise_fit"), ["Yes, on repeat", "Probably"]) ?? 0}%`} note="Yes or probably" />
              <Stat label="Want the 45" value={`${share(byId("formats"), ["45 RPM vinyl"]) ?? 0}%`} note="Of format answers" />
            </div>

            {data.questions.map((q) =>
              q.counts ? (
                <section key={q.id} style={card}>
                  <h2 style={{ fontSize: 18, margin: "0 0 4px", color: theme.gold }}>{q.prompt}</h2>
                  <div style={{ color: theme.muted, fontSize: 13, marginBottom: 8 }}>
                    {q.answered} answered{q.type === "multi" ? " · people could pick more than one" : ""}
                  </div>
                  <Bars q={q} />
                </section>
              ) : q.recent && q.recent.length > 0 ? (
                <section key={q.id} style={card}>
                  <h2 style={{ fontSize: 18, margin: "0 0 4px", color: theme.gold }}>{q.prompt}</h2>
                  <div style={{ color: theme.muted, fontSize: 13, marginBottom: 8 }}>
                    {q.answered} answered · latest {q.recent.length}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
                    {q.recent.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </section>
              ) : null
            )}
          </>
        )}
      </main>
    </div>
  );
}
