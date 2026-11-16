// Shared by the survey page, the results page and the Cloudflare Worker (worker/index.ts).

export const RELEASE = {
  label: "DezWorld Music Group",
  artist: "Marvell Wilson, Jr.",
  aSide: "You Are My Everything",
  bSide: "There Go Our Song",
  // Put a song preview here (e.g. "/survey/you-are-my-everything.mp3" in /public) to show a player.
  previewUrl: ""
};

export type Question = {
  id: string;
  prompt: string;
  type: "single" | "multi" | "scale" | "text";
  options?: string[];
  scaleLabels?: [string, string];
  placeholder?: string;
  required?: boolean;
  // Text answers that are personal and never shown on the public results page.
  private?: boolean;
};

export type Section = { title: string; intro?: string; questions: Question[] };

export const SECTIONS: Section[] = [
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
      { id: "email", prompt: "Email for release news and a free download", type: "text", placeholder: "you@email.com", private: true }
    ]
  }
];

export const QUESTIONS: Question[] = SECTIONS.flatMap((s) => s.questions);

export type AnswerValue = string | string[] | number;
export type Answers = Record<string, AnswerValue>;

const MAX_TEXT = 500;

// Returns cleaned answers (unknown keys and empty values dropped) or an error message.
export function validateAnswers(input: unknown): { ok: true; answers: Answers } | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "Answers must be an object" };
  const raw = input as Record<string, unknown>;
  const answers: Answers = {};

  for (const q of QUESTIONS) {
    const v = raw[q.id];
    const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
    if (empty) {
      if (q.required) return { ok: false, error: `Missing answer: ${q.prompt}` };
      continue;
    }
    if (q.type === "single") {
      if (typeof v !== "string" || !q.options!.includes(v)) return { ok: false, error: `Invalid answer: ${q.id}` };
      answers[q.id] = v;
    } else if (q.type === "multi") {
      if (!Array.isArray(v) || !v.every((o) => typeof o === "string" && q.options!.includes(o))) {
        return { ok: false, error: `Invalid answer: ${q.id}` };
      }
      answers[q.id] = Array.from(new Set(v as string[]));
    } else if (q.type === "scale") {
      if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 5) return { ok: false, error: `Invalid answer: ${q.id}` };
      answers[q.id] = v;
    } else {
      if (typeof v !== "string") return { ok: false, error: `Invalid answer: ${q.id}` };
      const t = v.trim().slice(0, MAX_TEXT);
      if (t) answers[q.id] = t;
    }
  }
  return { ok: true, answers };
}

export type QuestionResult = {
  id: string;
  prompt: string;
  type: Question["type"];
  answered: number;
  counts?: { option: string; count: number }[];
  average?: number;
  // Most recent public text answers (never private ones).
  recent?: string[];
};

export type Results = { total: number; lastResponseAt: string | null; questions: QuestionResult[] };

const RECENT_TEXT = 25;

// `rows` are stored answers, newest first.
export function aggregate(rows: Answers[], lastResponseAt: string | null): Results {
  const questions = QUESTIONS.map((q): QuestionResult => {
    const values = rows.map((r) => r[q.id]).filter((v) => v !== undefined);
    const base = { id: q.id, prompt: q.prompt, type: q.type, answered: values.length };

    if (q.type === "single" || q.type === "multi") {
      const tally = new Map(q.options!.map((o) => [o, 0]));
      for (const v of values) {
        for (const o of Array.isArray(v) ? v : [v]) {
          if (tally.has(o as string)) tally.set(o as string, tally.get(o as string)! + 1);
        }
      }
      return { ...base, counts: q.options!.map((option) => ({ option, count: tally.get(option)! })) };
    }
    if (q.type === "scale") {
      const nums = values.filter((v): v is number => typeof v === "number");
      const counts = [1, 2, 3, 4, 5].map((n) => ({ option: String(n), count: nums.filter((x) => x === n).length }));
      const average = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : undefined;
      return { ...base, counts, average };
    }
    return q.private ? base : { ...base, recent: (values as string[]).slice(0, RECENT_TEXT) };
  });
  return { total: rows.length, lastResponseAt, questions };
}
