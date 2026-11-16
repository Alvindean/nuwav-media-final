"use client";

import React, { useState } from "react";
import Head from "next/head";
import { CheckCircle, Send } from "lucide-react";
import { RELEASE, SECTIONS, type AnswerValue, type Answers, type Question } from "../lib/souldiesSurvey";

async function submitSurvey(answers: Answers) {
  const res = await fetch("/api/survey", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(answers)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || "Could not save your answers");
  }
}

const theme = {
  bg: "#1a0a0c",
  panel: "#2a1215",
  maroon: "#7a1f24",
  gold: "#d9a441",
  cream: "#f5ead6",
  muted: "#c9b79a",
  line: "#4a2a2d"
};

const font = "Georgia, 'Times New Roman', serif";

function Record45({ side, title }: { side: string; title: string }) {
  return (
    <div
      style={{
        width: 150,
        height: 150,
        borderRadius: "50%",
        background: "repeating-radial-gradient(circle, #111 0 2px, #1d1d1d 2px 4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
        flexShrink: 0
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: theme.maroon,
          border: `2px solid ${theme.gold}`,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 4px",
          boxSizing: "border-box",
          color: theme.gold,
          textAlign: "center",
          fontFamily: font
        }}
      >
        <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 0.5 }}>DEZWORLD</span>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: theme.bg }} />
        <span style={{ fontSize: 5.5, lineHeight: 1.1 }}>
          {side} · {title}
        </span>
      </div>
    </div>
  );
}

const pill = (selected: boolean): React.CSSProperties => ({
  padding: "9px 14px",
  borderRadius: 999,
  border: `1px solid ${selected ? theme.gold : theme.line}`,
  background: selected ? theme.gold : "transparent",
  color: selected ? theme.bg : theme.cream,
  cursor: "pointer",
  fontSize: 15,
  fontFamily: font,
  textAlign: "left"
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  border: `1px solid ${theme.line}`,
  borderRadius: 8,
  fontSize: 16,
  boxSizing: "border-box",
  background: theme.bg,
  color: theme.cream,
  fontFamily: font
};

export default function Survey() {
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const setAnswer = (id: string, value: AnswerValue) => setAnswers((prev) => ({ ...prev, [id]: value }));

  const toggleMulti = (id: string, option: string) => {
    const current = (answers[id] as string[]) || [];
    setAnswer(id, current.includes(option) ? current.filter((o) => o !== option) : [...current, option]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = SECTIONS.flatMap((s) => s.questions).filter(
      (q) => q.required && (answers[q.id] === undefined || answers[q.id] === "")
    );
    if (missing.length) {
      setError(`Please answer: ${missing.map((q) => q.prompt).join(" · ")}`);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await submitSurvey(answers);
      setDone(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (q: Question) => {
    const value = answers[q.id];
    return (
      <div key={q.id} style={{ padding: "16px 0", borderTop: `1px solid ${theme.line}` }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>
          {q.prompt}
          {q.required && <span style={{ color: theme.gold }}> *</span>}
        </div>

        {q.type === "single" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {q.options!.map((o) => (
              <button type="button" key={o} aria-pressed={value === o} onClick={() => setAnswer(q.id, o)} style={pill(value === o)}>
                {o}
              </button>
            ))}
          </div>
        )}

        {q.type === "multi" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {q.options!.map((o) => {
              const selected = ((value as string[]) || []).includes(o);
              return (
                <button type="button" key={o} aria-pressed={selected} onClick={() => toggleMulti(q.id, o)} style={pill(selected)}>
                  {o}
                </button>
              );
            })}
          </div>
        )}

        {q.type === "scale" && (
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  aria-pressed={value === n}
                  onClick={() => setAnswer(q.id, n)}
                  style={{ ...pill(value === n), flex: 1, textAlign: "center", fontWeight: 700 }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: theme.muted, fontSize: 13, marginTop: 6 }}>
              <span>{q.scaleLabels![0]}</span>
              <span>{q.scaleLabels![1]}</span>
            </div>
          </div>
        )}

        {q.type === "text" && (
          <input
            type={q.id === "email" ? "email" : "text"}
            value={(value as string) || ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            placeholder={q.placeholder}
            style={inputStyle}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.cream, fontFamily: font }}>
      <Head>
        <title>Souldies Survey | {RELEASE.aSide}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{"body{margin:0;background:#1a0a0c}"}</style>
      </Head>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ color: theme.gold, letterSpacing: 3, fontSize: 13, textTransform: "uppercase" }}>{RELEASE.label}</div>
          <h1 style={{ fontSize: 36, margin: "10px 0 6px", color: theme.cream }}>Souldies Survey</h1>
          <p style={{ color: theme.muted, fontSize: 17, margin: "0 auto", maxWidth: 520 }}>
            For the lowriders, the car clubs, and everyone who cruises to the classics. Tell us what you think of the new 45.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 16, margin: "24px 0 12px", flexWrap: "wrap" }}>
            <Record45 side="A" title={RELEASE.aSide} />
            <Record45 side="B" title={RELEASE.bSide} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: theme.gold }}>&ldquo;{RELEASE.aSide}&rdquo;</div>
          <div style={{ color: theme.muted }}>
            b/w &ldquo;{RELEASE.bSide}&rdquo; · {RELEASE.artist}
          </div>
          {RELEASE.previewUrl && (
            <audio controls src={RELEASE.previewUrl} style={{ width: "100%", maxWidth: 420, marginTop: 16 }} />
          )}
        </div>

        {done ? (
          <div style={{ background: theme.panel, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 40, textAlign: "center" }}>
            <CheckCircle size={48} color={theme.gold} />
            <h2 style={{ margin: "12px 0 6px" }}>Gracias, thank you!</h2>
            <p style={{ color: theme.muted, margin: 0 }}>Your answers are in. Keep it low and slow.</p>
            <a href="/survey/results/" style={{ display: "inline-block", marginTop: 18, color: theme.gold }}>
              See how everyone voted →
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {SECTIONS.map((section, i) => (
              <section
                key={section.title}
                style={{ background: theme.panel, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 20, marginBottom: 20 }}
              >
                <h2 style={{ fontSize: 22, margin: 0, color: theme.gold }}>
                  {i + 1}. {section.title}
                </h2>
                {section.intro && <p style={{ color: theme.muted, margin: "6px 0 4px" }}>{section.intro}</p>}
                <div style={{ marginTop: 10 }}>{section.questions.map(renderQuestion)}</div>
              </section>
            ))}

            {error && <p style={{ color: "#f08a7e", margin: "0 0 12px" }}>{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "15px 20px",
                border: "none",
                borderRadius: 10,
                background: theme.gold,
                color: theme.bg,
                fontSize: 18,
                fontWeight: 700,
                fontFamily: font,
                cursor: submitting ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: submitting ? 0.7 : 1
              }}
            >
              <Send size={18} />
              {submitting ? "Sending..." : "Submit my answers"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
