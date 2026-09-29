"use client";

import React, { useState } from "react";
import Head from "next/head";
import { CheckCircle, Send } from "lucide-react";

// The release being surveyed.
const RELEASE = {
  label: "DezWorld Music Group",
  artist: "Marvell Wilson, Jr.",
  aSide: "You Are My Everything",
  bSide: "There Go Our Song",
  // Put a song preview here (e.g. "/survey/you-are-my-everything.mp3" in /public) to show a player.
  previewUrl: ""
};

type Question = {
  id: string;
  prompt: string;
  type: "single" | "multi" | "scale" | "text";
  options?: string[];
  scaleLabels?: [string, string];
  placeholder?: string;
  required?: boolean;
};

type Section = { title: string; intro?: string; questions: Question[] };

const SECTIONS: Section[] = [
  {
    title: "You & the lowrider life",
    questions: [
      {
        id: "lowrider_connection",
        prompt: "How are you connected to lowrider culture?",
        type: "single",
        required: true,
        options: [
          "I own or build a lowrider",
          "I'm in a car club",
          "I go to shows and cruises",
          "I'm a fan from the sidelines",
          "Not really, I'm here for the music"
        ]
      },
      {
        id: "oldies_frequency",
        prompt: "How often do you listen to oldies / souldies?",
        type: "single",
        required: true,
        options: ["Every day", "A few times a week", "Now and then", "Rarely"]
      },
      {
        id: "listen_where",
        prompt: "Where do you hear oldies the most? (pick all that apply)",
        type: "multi",
        options: [
          "Cruising in the car",
          "Car shows & meets",
          "Family parties & BBQs",
          "Radio",
          "Spotify / Apple Music",
          "YouTube",
          "TikTok / Instagram",
          "Vinyl at home"
        ]
      },
      {
        id: "favorite_artists",
        prompt: "Who's on your cruising playlist?",
        type: "text",
        placeholder: "e.g. The Delfonics, Brenton Wood, Smokey Robinson, Mary Wells..."
      }
    ]
  },
  {
    title: "The song",
    intro: `Give "${RELEASE.aSide}" a listen, then tell us what you think.`,
    questions: [
      {
        id: "song_rating",
        prompt: `Overall, how much do you like "${RELEASE.aSide}"?`,
        type: "scale",
        required: true,
        scaleLabels: ["Not for me", "Instant classic"]
      },
      {
        id: "cruise_fit",
        prompt: "Would you play it while cruising low and slow?",
        type: "single",
        required: true,
        options: ["Yes, on repeat", "Probably", "Maybe", "No"]
      },
      {
        id: "sounds_like",
        prompt: "How does it compare to the classics you love?",
        type: "single",
        options: [
          "Sounds like a true oldie",
          "Classic feel with a fresh touch",
          "Too modern for oldies",
          "Not sure"
        ]
      },
      {
        id: "best_part",
        prompt: "What grabs you most? (pick all that apply)",
        type: "multi",
        options: ["The vocals", "The groove / bass", "The lyrics", "The horns & strings", "The slow-jam feel", "The vintage sound"]
      },
      {
        id: "song_feedback",
        prompt: "Anything you'd change or want more of?",
        type: "text",
        placeholder: "Your honest take"
      }
    ]
  },
  {
    title: "Getting the music",
    questions: [
      {
        id: "formats",
        prompt: "How would you want this release? (pick all that apply)",
        type: "multi",
        options: ["45 RPM vinyl", "Streaming", "CD", "Cassette", "Digital download"]
      },
      {
        id: "vinyl_price",
        prompt: `What would you pay for the 45 ("${RELEASE.aSide}" / "${RELEASE.bSide}")?`,
        type: "single",
        options: ["Under $10", "$10–$15", "$15–$25", "$25+ for a signed copy", "I wouldn't buy vinyl"]
      },
      {
        id: "extras",
        prompt: "What else would you be into? (pick all that apply)",
        type: "multi",
        options: [
          "Live performance at a car show",
          "T-shirts & merch",
          "Car club plaque / window decal",
          "Music video with lowriders",
          "Meet & greet with the artist"
        ]
      },
      {
        id: "discover_where",
        prompt: "Where should we share it so people like you find it?",
        type: "multi",
        options: ["Car shows", "Car club pages", "Instagram", "TikTok", "YouTube", "Facebook", "Oldies radio", "Word of mouth"]
      }
    ]
  },
  {
    title: "About you",
    intro: "Optional, helps us know who's listening.",
    questions: [
      { id: "age", prompt: "Age range", type: "single", options: ["Under 25", "25–34", "35–44", "45–54", "55+"] },
      { id: "location", prompt: "City / area", type: "text", placeholder: "e.g. East LA, San Diego, San Antonio" },
      { id: "car_club", prompt: "Car club (if any)", type: "text", placeholder: "Club name" },
      { id: "email", prompt: "Email for release news and a free download", type: "text", placeholder: "you@email.com" }
    ]
  }
];

type AnswerValue = string | string[] | number;
type Answers = Record<string, AnswerValue>;

// Where answers go. Replace with the real backend call once it's connected.
async function submitSurvey(answers: Answers) {
  console.log("Souldies survey submission", answers);
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
    } catch {
      setError("Something went wrong. Please try again.");
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
