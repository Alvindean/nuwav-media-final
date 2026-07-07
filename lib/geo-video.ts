/**
 * geo-video.json — declarative project format for the NUWAV Geo-Video Studio.
 *
 * A project is a timeline of scenes. Each scene drives the globe camera
 * between two points of view and shows a lower-third caption. Points, arcs
 * (routes), rings and labels are global layers that can be time-windowed so
 * they appear/disappear as the playhead moves.
 *
 * The format is deliberately plain JSON so an AI agent can author a full
 * video by emitting a single file (see docs/GEO_VIDEO_AGENT.md).
 */

export interface GeoPov {
  lat: number;
  lng: number;
  /** Camera distance in globe radii (globe.gl altitude). ~2.5 = wide, 0.6 = close. */
  altitude: number;
}

export interface GeoScene {
  id: string;
  /** Small technical label shown top-left of the frame, e.g. "GLOBAL ESTABLISHING VIEW". */
  label: string;
  start: number;
  end: number;
  camera: {
    from: GeoPov;
    to: GeoPov;
    ease?: "linear" | "inOut";
  };
  caption?: {
    text: string;
    /** Accent bar colour of the lower third. Defaults to the skin accent. */
    accent?: string;
  };
  /**
   * Countries to light up while this scene plays. Entries match Natural
   * Earth codes/names case-insensitively: ISO_A3 ("CHN"), ADM0_A3, SOV_A3,
   * or the admin name ("China").
   */
  highlight?: string[];
  /** Picture-in-picture stock media card shown above the caption. */
  media?: {
    /** Image or video URL — self-hosted under /public keeps exports taint-free. */
    src: string;
    /** Small technical label under the card, e.g. "MANUFACTURING CORRIDOR". */
    label?: string;
    kind?: "image" | "video";
  };
  /** Narration for this scene. `src` (audio file) is muxed into exports;
   *  `text` falls back to live browser TTS (preview only). */
  voiceover?: {
    text?: string;
    src?: string;
  };
}

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
  size?: number;
  color?: string;
  start?: number;
  end?: number;
  /** Emit propagating radar rings from this point. */
  ring?: boolean;
}

export interface GeoArc {
  label?: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color?: string;
  start?: number;
  end?: number;
}

export interface GeoVideoProject {
  version: 1;
  meta: {
    title: string;
    slug: string;
  };
  output: {
    width: number;
    height: number;
    fps: number;
  };
  skin?: "briefing" | "draft";
  scenes: GeoScene[];
  points: GeoPoint[];
  arcs: GeoArc[];
}

export const projectDuration = (p: GeoVideoProject): number =>
  p.scenes.reduce((m, s) => Math.max(m, s.end), 0);

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Shortest-path longitude interpolation so the camera never spins the long way round. */
const lerpLng = (a: number, b: number, t: number) => {
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return a + d * t;
};

export function sceneAt(p: GeoVideoProject, time: number): GeoScene | null {
  for (const s of p.scenes) if (time >= s.start && time < s.end) return s;
  return p.scenes.length && time >= projectDuration(p)
    ? p.scenes[p.scenes.length - 1]
    : null;
}

export function cameraAt(p: GeoVideoProject, time: number): GeoPov | null {
  const s = sceneAt(p, time);
  if (!s) return null;
  const span = Math.max(s.end - s.start, 0.0001);
  let t = Math.min(Math.max((time - s.start) / span, 0), 1);
  if (s.camera.ease !== "linear") t = easeInOutCubic(t);
  return {
    lat: lerp(s.camera.from.lat, s.camera.to.lat, t),
    lng: lerpLng(s.camera.from.lng, s.camera.to.lng, t),
    altitude: lerp(s.camera.from.altitude, s.camera.to.altitude, t)
  };
}

export const visibleAt = <T extends { start?: number; end?: number }>(
  items: T[],
  time: number
): T[] => items.filter((i) => time >= (i.start ?? 0) && time <= (i.end ?? Infinity));

/** Case-insensitive match of a scene highlight entry against a Natural Earth feature. */
export function featureMatches(feature: any, highlight: string[]): boolean {
  if (!highlight?.length) return false;
  const p = feature?.properties ?? {};
  const codes = [p.ISO_A3, p.ADM0_A3, p.SOV_A3, p.ADMIN, p.NAME, p.NAME_LONG]
    .filter(Boolean)
    .map((c: string) => String(c).toLowerCase());
  return highlight.some((h) => codes.includes(h.toLowerCase()));
}

/**
 * Default demo project — a short geopolitical "briefing" clip in the style
 * of the reference edit (holographic globe, pressure-point captions).
 */
export const DEFAULT_PROJECT: GeoVideoProject = {
  version: 1,
  meta: {
    title: "Global Pressure Points — Briefing",
    slug: "nuwav-briefing-540-draft"
  },
  output: { width: 540, height: 960, fps: 30 },
  skin: "briefing",
  scenes: [
    {
      id: "establishing",
      label: "GLOBAL ESTABLISHING VIEW",
      start: 0,
      end: 3.4,
      camera: {
        from: { lat: 8, lng: -30, altitude: 2.6 },
        to: { lat: 14, lng: 30, altitude: 2.3 },
        ease: "inOut"
      },
      caption: { text: "GLOBAL SUPPLY LINES ENTER A NEW ERA OF SCRUTINY" },
      media: { src: "/media/freight-network.svg", label: "GLOBAL FREIGHT NETWORK · B-ROLL" },
      voiceover: { text: "Global supply lines are entering a new era of scrutiny." }
    },
    {
      id: "china",
      label: "EAST ASIA · PRESSURE POINT",
      start: 3.4,
      end: 6.8,
      camera: {
        from: { lat: 20, lng: 95, altitude: 1.9 },
        to: { lat: 33, lng: 108, altitude: 1.15 },
        ease: "inOut"
      },
      caption: { text: "CHINA BECOMES THE FIRST PRESSURE POINT" },
      highlight: ["CHN"],
      media: { src: "/media/manufacturing.svg", label: "MANUFACTURING CORRIDOR · SHENZHEN" },
      voiceover: { text: "China becomes the first pressure point." }
    },
    {
      id: "strait",
      label: "TAIWAN STRAIT · ROUTES",
      start: 6.8,
      end: 10.2,
      camera: {
        from: { lat: 24, lng: 121, altitude: 1.1 },
        to: { lat: 25, lng: 125, altitude: 0.85 },
        ease: "inOut"
      },
      caption: { text: "SEMICONDUCTOR ROUTES CONCENTRATE THE RISK", accent: "#ff9f0a" },
      highlight: ["TWN"],
      media: { src: "/media/semiconductor.svg", label: "ADVANCED NODE FABRICATION" },
      voiceover: { text: "Semiconductor routes concentrate the risk." }
    },
    {
      id: "usa",
      label: "UNITED STATES OF AMERICA",
      start: 10.2,
      end: 13.6,
      camera: {
        from: { lat: 30, lng: -80, altitude: 1.8 },
        to: { lat: 39, lng: -98, altitude: 1.25 },
        ease: "inOut"
      },
      caption: { text: "WASHINGTON ANSWERS WITH EXPORT CONTROLS" },
      highlight: ["USA"],
      media: { src: "/media/export-controls.svg", label: "EXPORT CONTROL BRIEFING · D.C." },
      voiceover: { text: "Washington answers with export controls." }
    },
    {
      id: "europe",
      label: "EUROPE · MACRO READABLE HOLD",
      start: 13.6,
      end: 16.6,
      camera: {
        from: { lat: 42, lng: -5, altitude: 1.6 },
        to: { lat: 50, lng: 12, altitude: 1.2 },
        ease: "inOut"
      },
      caption: { text: "EUROPE HEDGES BETWEEN BOTH BLOCS", accent: "#ff9f0a" },
      highlight: ["DEU", "FRA", "NLD", "BEL", "ITA", "ESP", "POL"],
      media: { src: "/media/europe-trade.svg", label: "EU TRADE POLICY DESK" },
      voiceover: { text: "Europe hedges between both blocs." }
    },
    {
      id: "pullback",
      label: "GLOBAL PULL-BACK · CLOSER",
      start: 16.6,
      end: 19.4,
      camera: {
        from: { lat: 30, lng: 60, altitude: 1.6 },
        to: { lat: 12, lng: -20, altitude: 2.6 },
        ease: "inOut"
      },
      caption: { text: "THE MAP IS THE MESSAGE" },
      media: { src: "/media/macro-hold.svg", label: "MACRO READABLE HOLD" },
      voiceover: { text: "The map is the message." }
    }
  ],
  points: [
    { lat: 39.9, lng: 116.4, label: "BEIJING", ring: true, start: 3.4, color: "#ff2d55" },
    { lat: 25.03, lng: 121.5, label: "TAIPEI", ring: true, start: 6.8, color: "#ffd60a" },
    { lat: 1.35, lng: 103.8, label: "SINGAPORE", start: 6.8 },
    { lat: 37.56, lng: 126.9, label: "SEOUL", start: 6.8 },
    { lat: 38.9, lng: -77.0, label: "WASHINGTON D.C.", ring: true, start: 10.2, color: "#ff2d55" },
    { lat: 37.77, lng: -122.4, label: "SAN FRANCISCO", start: 10.2 },
    { lat: 50.1, lng: 8.68, label: "FRANKFURT", start: 13.6 },
    { lat: 52.37, lng: 4.9, label: "AMSTERDAM", start: 13.6 }
  ],
  arcs: [
    { label: "TPE → SEL", startLat: 25.03, startLng: 121.5, endLat: 37.56, endLng: 126.9, start: 6.8 },
    { label: "TPE → SIN", startLat: 25.03, startLng: 121.5, endLat: 1.35, endLng: 103.8, start: 6.8 },
    { label: "TPE → SFO", startLat: 25.03, startLng: 121.5, endLat: 37.77, endLng: -122.4, start: 8.2, color: "#ffd60a" },
    { label: "DC → AMS", startLat: 38.9, startLng: -77.0, endLat: 52.37, endLng: 4.9, start: 10.2 },
    { label: "DC → FRA", startLat: 38.9, startLng: -77.0, endLat: 50.1, endLng: 8.68, start: 11.0 },
    { label: "FRA → PEK", startLat: 50.1, startLng: 8.68, endLat: 39.9, endLng: 116.4, start: 13.6, color: "#ff9f0a" }
  ]
};
