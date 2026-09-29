"use client";

import React, { useState } from "react";
import { Music, CheckCircle, Send, Zap } from "lucide-react";

// Songs in the survey. Swap this list for the real one when it's ready.
const SONGS = [
  { id: "stand-by-me", title: "Stand By Me", artist: "Ben E. King", year: 1961 },
  { id: "my-girl", title: "My Girl", artist: "The Temptations", year: 1964 },
  { id: "be-my-baby", title: "Be My Baby", artist: "The Ronettes", year: 1963 },
  { id: "respect", title: "Respect", artist: "Aretha Franklin", year: 1967 },
  { id: "earth-angel", title: "Earth Angel", artist: "The Penguins", year: 1954 },
  { id: "la-bamba", title: "La Bamba", artist: "Ritchie Valens", year: 1958 },
  { id: "unchained-melody", title: "Unchained Melody", artist: "The Righteous Brothers", year: 1965 },
  { id: "dock-of-the-bay", title: "(Sittin' On) The Dock of the Bay", artist: "Otis Redding", year: 1968 }
];

const RATINGS = [
  { value: 1, label: "Skip it" },
  { value: 2, label: "It's okay" },
  { value: 3, label: "Love it" }
];

type Answers = {
  ratings: Record<string, number>;
  favorite: string;
  requested: string;
  name: string;
  email: string;
};

// Where answers go. Replace with the real backend call once it's connected.
async function submitSurvey(answers: Answers) {
  console.log("Oldies survey submission", answers);
}

const colors = {
  blue: "#2563eb",
  purple: "#9333ea",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  soft: "#f9fafb"
};

const card: React.CSSProperties = {
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  padding: 20,
  marginBottom: 20,
  background: "#fff"
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  fontSize: 16,
  boxSizing: "border-box"
};

export default function Survey() {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [favorite, setFavorite] = useState("");
  const [requested, setRequested] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const ratedCount = Object.keys(ratings).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ratedCount === 0) {
      setError("Please rate at least one song.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await submitSurvey({ ratings, favorite, requested, name, email });
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.soft, color: colors.text, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(90deg, ${colors.blue}, ${colors.purple})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap color="#fff" size={20} />
            </span>
            <span style={{ fontWeight: 700, fontSize: 18, color: colors.purple }}>NU WAV Media</span>
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Music size={40} color={colors.purple} />
          <h1 style={{ fontSize: 32, margin: "8px 0" }}>Oldies Song Survey</h1>
          <p style={{ color: colors.muted, fontSize: 17, margin: 0 }}>
            Tell us which classics you love. It takes about a minute.
          </p>
        </div>

        {done ? (
          <div style={{ ...card, textAlign: "center", padding: 40 }}>
            <CheckCircle size={48} color="#16a34a" />
            <h2 style={{ margin: "12px 0 6px" }}>Thanks for voting!</h2>
            <p style={{ color: colors.muted, margin: 0 }}>Your picks have been recorded.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <section style={card}>
              <h2 style={{ fontSize: 20, marginTop: 0 }}>1. Rate these songs</h2>
              {SONGS.map((song) => (
                <div key={song.id} style={{ padding: "12px 0", borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ fontWeight: 600 }}>{song.title}</div>
                  <div style={{ color: colors.muted, fontSize: 14, marginBottom: 8 }}>
                    {song.artist} · {song.year}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {RATINGS.map((r) => {
                      const selected = ratings[song.id] === r.value;
                      return (
                        <button
                          type="button"
                          key={r.value}
                          onClick={() => setRatings({ ...ratings, [song.id]: r.value })}
                          aria-pressed={selected}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 999,
                            border: `1px solid ${selected ? colors.purple : colors.border}`,
                            background: selected ? colors.purple : "#fff",
                            color: selected ? "#fff" : colors.text,
                            cursor: "pointer",
                            fontSize: 15
                          }}
                        >
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>

            <section style={card}>
              <h2 style={{ fontSize: 20, marginTop: 0 }}>2. Your all-time favorite oldie</h2>
              <select value={favorite} onChange={(e) => setFavorite(e.target.value)} style={input}>
                <option value="">Pick one (optional)</option>
                {SONGS.map((song) => (
                  <option key={song.id} value={song.id}>
                    {song.title} – {song.artist}
                  </option>
                ))}
              </select>
            </section>

            <section style={card}>
              <h2 style={{ fontSize: 20, marginTop: 0 }}>3. A song we missed?</h2>
              <input
                type="text"
                value={requested}
                onChange={(e) => setRequested(e.target.value)}
                placeholder="Song title and artist (optional)"
                style={input}
              />
            </section>

            <section style={card}>
              <h2 style={{ fontSize: 20, marginTop: 0 }}>4. About you (optional)</h2>
              <div style={{ display: "grid", gap: 12 }}>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={input} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={input} />
              </div>
            </section>

            {error && <p style={{ color: "#dc2626", margin: "0 0 12px" }}>{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "14px 20px",
                border: "none",
                borderRadius: 10,
                background: `linear-gradient(90deg, ${colors.blue}, ${colors.purple})`,
                color: "#fff",
                fontSize: 17,
                fontWeight: 600,
                cursor: submitting ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: submitting ? 0.7 : 1
              }}
            >
              <Send size={18} />
              {submitting ? "Sending..." : `Submit (${ratedCount} of ${SONGS.length} rated)`}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
