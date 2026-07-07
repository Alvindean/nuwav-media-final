# NUWAV Geo-Video Studio — Agent Setup

The studio at **`/studio`** is an agent-driven video editor: a three.js /
react-globe.gl holographic globe rendered inside a 9:16 (540×960) vertical
video frame, driven entirely by a declarative **`.geo-video.json`** project
file. An AI agent (or a human) authors the JSON; the studio plays it back on a
timeline and exports it to a `.webm` video **in the browser** (canvas capture
+ MediaRecorder — no server render farm needed).

## How the pieces fit

```
agent prompt ──▶ *.geo-video.json ──▶ /studio?src=projects/<file>.geo-video.json
                                          │
                        timeline playback (CAM / CAPTION / FX tracks)
                                          │
                        EXPORT IN BROWSER ──▶ <slug>.webm download
```

- **Load** a project three ways: the default demo, the `?src=` query param
  (any JSON under `public/`), or the **LOAD** button (local file).
- **SAVE** downloads the current project JSON; **COMPILE** validates the
  timeline (gaps, duration, item count).
- **View controls** toggle HUD, routes (arcs), labels, points and grid, and
  switch quality (Draft 540×960 / High 1080×1920) and skin (Briefing/Draft).

## Project format (`*.geo-video.json`)

Types live in [`lib/geo-video.ts`](../lib/geo-video.ts). Example:
[`public/projects/nuwav-briefing.geo-video.json`](../public/projects/nuwav-briefing.geo-video.json).

```jsonc
{
  "version": 1,
  "meta": { "title": "Global Pressure Points", "slug": "my-brief-540" },
  "output": { "width": 540, "height": 960, "fps": 30 },
  "skin": "briefing",              // "briefing" (cyan) | "draft" (mono)
  "scenes": [                      // contiguous timeline of camera moves
    {
      "id": "china",
      "label": "EAST ASIA · PRESSURE POINT",   // top-left HUD tag
      "start": 3.4, "end": 6.8,                // seconds
      "camera": {
        "from": { "lat": 20, "lng": 95,  "altitude": 1.9 },
        "to":   { "lat": 33, "lng": 108, "altitude": 1.15 },
        "ease": "inOut"                        // or "linear"
      },
      "caption": {                             // lower-third
        "text": "CHINA BECOMES THE FIRST PRESSURE POINT",
        "accent": "#ff2d55"                    // optional accent-bar colour
      },
      "highlight": ["CHN"],                    // countries that LIGHT UP on the
                                               // globe (ISO_A3 / ADM0_A3 / name)
      "media": {                               // stock b-roll card above caption
        "src": "/media/manufacturing.svg",     // image or video URL (self-hosted
        "label": "MANUFACTURING CORRIDOR"      //  under /public keeps exports clean)
      },
      "voiceover": {                           // narration for the scene
        "text": "China becomes the first pressure point."
        // "src": "/audio/scene-china.mp3"     // audio file — muxed into exports;
      }                                        // text-only uses live browser TTS
    }
  ],
  "points": [                      // time-windowed markers
    { "lat": 39.9, "lng": 116.4, "label": "BEIJING",
      "ring": true, "start": 3.4, "color": "#ff2d55" }
  ],
  "arcs": [                        // time-windowed animated routes
    { "label": "TPE → SFO",
      "startLat": 25.03, "startLng": 121.5,
      "endLat": 37.77,  "endLng": -122.4,
      "start": 8.2, "color": "#ffd60a" }
  ]
}
```

Field notes:

- `altitude` is camera distance in globe radii: `2.6` ≈ full-globe wide shot,
  `1.2` ≈ continent, `0.7` ≈ region close-up.
- Scenes should be contiguous (`scene[n].start === scene[n-1].end`); COMPILE
  flags gaps. Project duration = max `end`.
- `start`/`end` on points/arcs are optional visibility windows (default:
  visible for the whole video). Points with `"ring": true` emit propagating
  radar rings.
- Captions render as burned-in lower thirds in the export, matching the DOM
  preview.
- `highlight` lights the named countries up while the scene plays: their hex
  dots brighten and a glowing polygon cap is raised over the territory. Match
  by ISO_A3 code ("CHN"), ADM0_A3, SOV_A3 or admin name ("China") —
  case-insensitive.
- `media` shows a 16:9 picture-in-picture stock card above the caption and
  burns it into exports. Six themed placeholder stills ship under
  `/public/media/`; agents can substitute any stock image/video URL that
  matches the script line (self-hosted or CORS-enabled URLs export cleanly).
- `voiceover.text` is read aloud by the browser's speech synthesis during
  playback (toggle VOICE in view controls). `voiceover.src` audio files are
  synced to the scene AND muxed into the exported webm; live TTS cannot be
  captured, so provide `src` files when the narration must be in the file.

## Editing & researching script content in the studio

- **SCRIPT · INSPECTOR** (right panel): click any scene to jump to it, then
  edit its label, caption, voiceover line, highlighted countries and b-roll
  media live. SAVE downloads the updated `.geo-video.json`.
- **COPY AGENT BRIEF**: copies a ready-to-paste research/rewrite prompt
  containing the schema rules and your current project JSON. Paste it into
  any AI agent together with a topic ("rewrite this for the Arctic shipping
  routes story") — it returns a new geo-video.json you LOAD back in.

## Prompt template for an authoring agent

> You are a geo-video editor. Output ONLY a valid `geo-video.json` (schema in
> `lib/geo-video.ts`) for a {duration}s vertical (540×960 @30fps) briefing
> video about: {topic}. Use 5–7 contiguous scenes with easing camera moves
> between real coordinates, ALL-CAPS lower-third captions under 60
> characters, ringed points on the key locations, and animated arcs for the
> routes/relationships mentioned. Save it under `public/projects/` and link
> me to `/studio?src=projects/<slug>.geo-video.json`.

## Local development

```bash
npm install --legacy-peer-deps
npm run dev          # http://localhost:3000/studio
```

The countries dataset is self-hosted at `public/data/countries.geojson`
(Natural Earth 110m admin-0, via the react-globe.gl examples), so the globe
works offline. Export uses `canvas.captureStream()` + `MediaRecorder`
(Chrome/Edge/Firefox; realtime pass, so a 19s video takes ~19s to render).
