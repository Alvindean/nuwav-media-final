import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import Globe, { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import {
  DEFAULT_PROJECT,
  GeoScene,
  GeoVideoProject,
  cameraAt,
  featureMatches,
  projectDuration,
  sceneAt,
  visibleAt
} from "../lib/geo-video";

const CYAN = "#3fd8ff";
const AMBER = "#ffb020";
const RED = "#ff2d55";

type ExportPhase = "IDLE" | "RENDERING" | "ENCODING" | "DONE" | "ERROR";

interface ExportState {
  phase: ExportPhase;
  progress: number;
  url: string | null;
  sizeMB: number | null;
}

interface Toggles {
  hud: boolean;
  routes: boolean;
  labels: boolean;
  points: boolean;
  grid: boolean;
  media: boolean;
  voice: boolean;
}

const PX_PER_SEC = 64;
const TRACK_LABEL_W = 84;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default function GeoVideoStudio() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const stageRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef(0);
  const playingRef = useRef(false);

  const [project, setProject] = useState<GeoVideoProject>(DEFAULT_PROJECT);
  const [countries, setCountries] = useState<any[]>([]);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [follow, setFollow] = useState(true);
  const [cleanView, setCleanView] = useState(false);
  const [skin, setSkin] = useState<"briefing" | "draft">("briefing");
  const [quality, setQuality] = useState<"draft" | "high">("draft");
  const [toggles, setToggles] = useState<Toggles>({
    hud: true,
    routes: true,
    labels: true,
    points: true,
    grid: true,
    media: true,
    voice: true
  });
  const togglesRef = useRef(toggles);
  togglesRef.current = toggles;
  const mediaImgs = useRef<Map<string, HTMLImageElement>>(new Map());
  const voAudios = useRef<Map<string, HTMLAudioElement>>(new Map());
  const spokenSceneRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const voSrcNodes = useRef<Map<HTMLAudioElement, MediaElementAudioSourceNode>>(
    new Map()
  );
  const [status, setStatus] = useState("Production exporter ready");
  const [stageScale, setStageScale] = useState(0.55);
  const [exportState, setExportState] = useState<ExportState>({
    phase: "IDLE",
    progress: 0,
    url: null,
    sizeMB: null
  });

  const duration = useMemo(() => projectDuration(project), [project]);
  const { width: OUT_W, height: OUT_H, fps } = project.output;
  const accent = skin === "briefing" ? CYAN : "#9aa7b4";
  const scene = sceneAt(project, time);
  const caption = scene?.caption;
  const itemCount =
    project.scenes.length * 2 + project.arcs.length + project.points.length;

  // ---- data loading -------------------------------------------------------

  useEffect(() => {
    fetch("/data/countries.geojson")
      .then((r) => r.json())
      .then((geo) => setCountries(geo.features ?? []))
      .catch(() => setStatus("Countries dataset unavailable — globe runs bare"));
  }, []);

  useEffect(() => {
    const src = new URLSearchParams(window.location.search).get("src");
    if (!src || !/^[\w\-./]+\.geo-video\.json$/.test(src)) return;
    fetch(src.startsWith("/") ? src : `/${src}`)
      .then((r) => r.json())
      .then((p) => loadProject(p, src))
      .catch(() => setStatus(`Failed to load ${src}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProject = (p: any, name: string) => {
    if (!p || !Array.isArray(p.scenes) || !p.output) {
      setStatus(`Invalid geo-video.json (${name})`);
      return;
    }
    p.points = p.points ?? [];
    p.arcs = p.arcs ?? [];
    setProject(p as GeoVideoProject);
    if (p.skin) setSkin(p.skin);
    timeRef.current = 0;
    setTime(0);
    setPlaying(false);
    setStatus(`Loaded ${name} · ${projectDuration(p).toFixed(1)}s`);
  };

  // ---- media + voiceover assets -------------------------------------------

  useEffect(() => {
    project.scenes.forEach((s) => {
      const src = s.media?.src;
      if (src && (s.media?.kind ?? "image") === "image" && !mediaImgs.current.has(src)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        mediaImgs.current.set(src, img);
      }
      const vo = s.voiceover?.src;
      if (vo && !voAudios.current.has(vo)) {
        const a = new Audio(vo);
        a.crossOrigin = "anonymous";
        a.preload = "auto";
        voAudios.current.set(vo, a);
      }
    });
  }, [project]);

  /** Keep narration in sync with the playhead. Audio files seek/pause with
   *  the timeline; text voiceovers use live browser TTS (one shot per scene). */
  const syncVoice = useCallback(
    (t: number, active: boolean) => {
      const sc = sceneAt(project, t);
      voAudios.current.forEach((a, src) => {
        const owner = project.scenes.find((s) => s.voiceover?.src === src);
        const shouldPlay =
          active && toggles.voice && owner && sc?.id === owner.id;
        if (shouldPlay && owner) {
          const offset = t - owner.start;
          if (a.paused) {
            a.currentTime = Math.max(offset, 0);
            a.play().catch(() => undefined);
          }
        } else if (!a.paused) {
          a.pause();
        }
      });
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (!active || !toggles.voice) {
        if (spokenSceneRef.current) {
          window.speechSynthesis.cancel();
          spokenSceneRef.current = null;
        }
        return;
      }
      if (sc && sc.voiceover?.text && !sc.voiceover.src) {
        if (spokenSceneRef.current !== sc.id) {
          spokenSceneRef.current = sc.id;
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(sc.voiceover.text);
          u.rate = 1.02;
          u.pitch = 0.9;
          window.speechSynthesis.speak(u);
        }
      } else if (spokenSceneRef.current && (!sc || !sc.voiceover?.text)) {
        spokenSceneRef.current = null;
      }
    },
    [project, toggles.voice]
  );

  // ---- playback engine ----------------------------------------------------

  const applyCamera = useCallback(
    (t: number) => {
      const pov = cameraAt(project, t);
      if (pov && globeRef.current) globeRef.current.pointOfView(pov, 0);
    },
    [project]
  );

  const syncVoiceRef = useRef(syncVoice);
  syncVoiceRef.current = syncVoice;

  useEffect(() => {
    playingRef.current = playing;
    if (!playing) syncVoiceRef.current(timeRef.current, false);
  }, [playing]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (playingRef.current) {
        timeRef.current = Math.min(timeRef.current + dt, duration);
        if (timeRef.current >= duration) setPlaying(false);
        setTime(timeRef.current);
        applyCamera(timeRef.current);
        syncVoiceRef.current(timeRef.current, true);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, applyCamera]);

  const seek = useCallback(
    (t: number) => {
      timeRef.current = Math.min(Math.max(t, 0), duration);
      setTime(timeRef.current);
      applyCamera(timeRef.current);
    },
    [duration, applyCamera]
  );

  const play = () => {
    if (timeRef.current >= duration) seek(0);
    setPlaying(true);
  };

  const jumpScene = (dir: 1 | -1) => {
    const starts = project.scenes.map((s) => s.start);
    const next =
      dir === 1
        ? starts.find((s) => s > timeRef.current + 0.01)
        : [...starts].reverse().find((s) => s < timeRef.current - 0.01);
    seek(next ?? (dir === 1 ? duration : 0));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        playingRef.current ? setPlaying(false) : play();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  // ---- stage scaling ------------------------------------------------------

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      setStageScale(
        Math.min((r.width - 32) / OUT_W, (r.height - 32) / OUT_H, 1)
      );
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [OUT_W, OUT_H]);

  // ---- follow timeline ----------------------------------------------------

  useEffect(() => {
    if (!follow || !timelineRef.current) return;
    const el = timelineRef.current;
    const x = TRACK_LABEL_W + time * PX_PER_SEC;
    if (x < el.scrollLeft + TRACK_LABEL_W || x > el.scrollLeft + el.clientWidth - 80) {
      el.scrollLeft = Math.max(x - el.clientWidth / 2, 0);
    }
  }, [time, follow]);

  // ---- globe layers (memoised on visibility signature, not raw time) ------

  const arcSig = project.arcs
    .map((a) => (time >= (a.start ?? 0) && time <= (a.end ?? Infinity) ? 1 : 0))
    .join("");
  const pointSig = project.points
    .map((p) => (time >= (p.start ?? 0) && time <= (p.end ?? Infinity) ? 1 : 0))
    .join("");

  const visibleArcs = useMemo(
    () => (toggles.routes ? visibleAt(project.arcs, timeRef.current) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project, arcSig, toggles.routes]
  );
  const visiblePoints = useMemo(
    () => (toggles.points ? visibleAt(project.points, timeRef.current) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project, pointSig, toggles.points]
  );
  const rings = useMemo(
    () => visiblePoints.filter((p) => p.ring),
    [visiblePoints]
  );
  const labels = useMemo(
    () => (toggles.labels ? visiblePoints.filter((p) => p.label) : []),
    [visiblePoints, toggles.labels]
  );

  const highlightList = scene?.highlight ?? [];
  const highlightKey = `${scene?.id ?? ""}:${highlightList.join(",")}`;
  const highlightFeatures = useMemo(
    () => (highlightList.length ? countries.filter((f) => featureMatches(f, highlightList)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [countries, highlightKey]
  );
  const highlightSet = useMemo(
    () => new Set(highlightFeatures),
    [highlightFeatures]
  );

  const hexColor = useCallback(
    (f: any) => {
      if (highlightSet.has(f)) return "rgba(160,240,255,0.95)";
      return skin === "briefing"
        ? "rgba(64,216,255,0.55)"
        : "rgba(160,180,196,0.45)";
    },
    [highlightSet, skin]
  );

  const globeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: "#08131e",
        emissive: "#041019",
        transparent: true,
        opacity: 0.96,
        shininess: 12
      }),
    []
  );

  // ---- actions ------------------------------------------------------------

  const handleSave = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.meta.slug}.geo-video.json`;
    a.click();
    setStatus(`Saved ${project.meta.slug}.geo-video.json`);
  };

  const handleCompile = () => {
    const gaps = project.scenes.filter(
      (s, i) => i > 0 && Math.abs(s.start - project.scenes[i - 1].end) > 0.001
    );
    setStatus(
      `Compiled · ${duration.toFixed(1)}s · ${itemCount} items · ${
        gaps.length ? `${gaps.length} gap(s) in scene track` : "timeline OK"
      }`
    );
  };

  /** Immutable patch of the scene under the playhead — powers the inspector. */
  const updateScene = (id: string, patch: Partial<GeoScene>) => {
    setProject((p) => ({
      ...p,
      scenes: p.scenes.map((s) => (s.id === id ? { ...s, ...patch } : s))
    }));
  };

  /**
   * "Research" hand-off: copies a complete authoring brief (schema notes +
   * the current project JSON) so the user can paste it into any AI agent to
   * rewrite the script, research a new topic, or extend the timeline.
   */
  const copyAgentBrief = async () => {
    const brief = [
      "You are a geo-video script editor. Below is my current *.geo-video.json",
      "project for a vertical 540x960 @30fps globe briefing video.",
      "",
      "Rewrite or extend it for the topic I give you. Rules:",
      "- Output ONLY valid JSON in the same schema (no commentary).",
      "- Scenes are contiguous (each start == previous end); keep ~3-4s each.",
      "- camera: real lat/lng; altitude 2.6=globe, 1.2=continent, 0.7=region.",
      '- caption.text: ALL-CAPS lower third, under 60 chars.',
      '- highlight: ISO_A3 codes of countries the script mentions ("CHN")',
      "  so they light up on the globe.",
      '- media: { src, label } — stock image/video URL for the scene topic',
      "  (or keep the bundled /media/*.svg placeholders).",
      "- voiceover.text: one spoken sentence per scene (browser TTS reads it;",
      "  supply voiceover.src audio files for narration baked into exports).",
      "- points/arcs: ringed points on key locations, arcs for routes, with",
      "  start times matching when their scene begins.",
      "",
      "Research the topic first so coordinates, routes and claims are real.",
      "",
      "CURRENT PROJECT:",
      JSON.stringify(project, null, 2)
    ].join("\n");
    try {
      await navigator.clipboard.writeText(brief);
      setStatus("Agent brief copied — paste it into your AI agent with a topic");
    } catch {
      setStatus("Clipboard unavailable — use SAVE and share the JSON instead");
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text()
      .then((txt) => loadProject(JSON.parse(txt), f.name))
      .catch(() => setStatus(`Could not parse ${f.name}`));
    e.target.value = "";
  };

  // ---- export (in-browser render via canvas capture + MediaRecorder) ------

  const drawFrame = useCallback(
    (ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, t: number) => {
      const W = ctx.canvas.width;
      const H = ctx.canvas.height;
      const s = W / OUT_W;
      ctx.fillStyle = "#02070d";
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(src, 0, 0, W, H);

      const sc = sceneAt(project, t);
      if (toggles.hud) {
        ctx.strokeStyle = "rgba(63,216,255,0.35)";
        ctx.lineWidth = 2 * s;
        ctx.strokeRect(10 * s, 10 * s, W - 20 * s, H - 20 * s);
        ctx.fillStyle = "rgba(63,216,255,0.85)";
        ctx.font = `${11 * s}px monospace`;
        ctx.textBaseline = "top";
        if (sc) ctx.fillText(sc.label, 24 * s, 26 * s);
        ctx.fillText(`${t.toFixed(1)}s`, W - 70 * s, 26 * s);
        ctx.fillText("NUWAV · GEO-VIDEO", 24 * s, H - 40 * s);
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(W - 34 * s, H - 34 * s, 5 * s, 0, Math.PI * 2);
        ctx.fill();
      }

      // picture-in-picture stock media card (matches the DOM .media-card)
      if (togglesRef.current.media && sc?.media) {
        const img = mediaImgs.current.get(sc.media.src);
        const mx = 48 * s;
        const my = 150 * s;
        const mw = W - 96 * s;
        const mh = mw * (9 / 16);
        ctx.fillStyle = "rgba(2,10,18,0.85)";
        ctx.fillRect(mx, my, mw, mh + 24 * s);
        if (img && img.complete && img.naturalWidth > 0) {
          const scale = Math.max(mw / img.naturalWidth, mh / img.naturalHeight);
          const sw = mw / scale;
          const sh = mh / scale;
          try {
            ctx.drawImage(
              img,
              (img.naturalWidth - sw) / 2,
              (img.naturalHeight - sh) / 2,
              sw,
              sh,
              mx,
              my,
              mw,
              mh
            );
          } catch {
            /* cross-origin taint — leave the card background */
          }
        }
        ctx.strokeStyle = "rgba(63,216,255,0.6)";
        ctx.lineWidth = 1.5 * s;
        ctx.strokeRect(mx, my, mw, mh + 24 * s);
        ctx.fillStyle = "rgba(63,216,255,0.9)";
        ctx.font = `${11 * s}px monospace`;
        ctx.textBaseline = "middle";
        ctx.fillText(
          (sc.media.label ?? "STOCK / B-ROLL").toUpperCase(),
          mx + 10 * s,
          my + mh + 12 * s
        );
        ctx.textBaseline = "top";
      }

      const cap = sc?.caption;
      if (cap) {
        ctx.font = `800 ${28 * s}px Arial, sans-serif`;
        const maxW = W - 130 * s;
        const lines = wrapText(ctx, cap.text.toUpperCase(), maxW);
        const lh = 36 * s;
        const boxH = lines.length * lh + 24 * s;
        const y0 = H - 120 * s - boxH;
        ctx.fillStyle = "rgba(2,10,18,0.72)";
        ctx.fillRect(48 * s, y0, W - 96 * s, boxH);
        ctx.fillStyle = cap.accent ?? RED;
        ctx.fillRect(48 * s, y0, 7 * s, boxH);
        ctx.fillStyle = "#f2f7fa";
        lines.forEach((l, i) =>
          ctx.fillText(l, 70 * s, y0 + 14 * s + i * lh)
        );
      }
    },
    [project, toggles.hud, OUT_W]
  );

  const handleExport = async () => {
    if (exportState.phase === "RENDERING" || exportState.phase === "ENCODING")
      return;
    const globe = globeRef.current;
    if (!globe) return;
    const src = globe.renderer().domElement as HTMLCanvasElement;
    const mult = quality === "high" ? 2 : 1;
    const canvas = document.createElement("canvas");
    canvas.width = OUT_W * mult;
    canvas.height = OUT_H * mult;
    const ctx = canvas.getContext("2d");
    if (!ctx || typeof MediaRecorder === "undefined") {
      setExportState((s) => ({ ...s, phase: "ERROR" }));
      setStatus("MediaRecorder not supported in this browser");
      return;
    }
    const stream = canvas.captureStream(fps);

    // Mux narration audio files (scene.voiceover.src) into the recording.
    // Live TTS (voiceover.text) can't be captured — it stays preview-only.
    const hasVoiceTracks =
      toggles.voice && project.scenes.some((s) => s.voiceover?.src);
    if (hasVoiceTracks) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
        audioDestRef.current =
          audioCtxRef.current.createMediaStreamDestination();
      }
      const actx = audioCtxRef.current;
      const dest = audioDestRef.current!;
      voAudios.current.forEach((a) => {
        if (!voSrcNodes.current.has(a)) {
          const node = actx.createMediaElementSource(a);
          node.connect(dest);
          node.connect(actx.destination);
          voSrcNodes.current.set(a, node);
        }
      });
      await actx.resume().catch(() => undefined);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    }

    const mimeCandidates = hasVoiceTracks
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
    const mime =
      mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ??
      "video/webm";
    const rec = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: quality === "high" ? 16_000_000 : 8_000_000
    });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const stopped = new Promise<Blob>((res) => {
      rec.onstop = () => res(new Blob(chunks, { type: "video/webm" }));
    });

    setPlaying(false);
    seek(0);
    setExportState({ phase: "RENDERING", progress: 0, url: null, sizeMB: null });
    setStatus("Rendering on this machine (realtime pass)…");
    rec.start(250);

    await new Promise<void>((resolve) => {
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - t0) / 1000, duration);
        timeRef.current = t;
        setTime(t);
        applyCamera(t);
        syncVoiceRef.current(t, true);
        drawFrame(ctx, src, t);
        setExportState((s) => ({ ...s, progress: t / duration }));
        if (t < duration) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });

    syncVoiceRef.current(timeRef.current, false);
    setExportState((s) => ({ ...s, phase: "ENCODING" }));
    setStatus("Finalising encoder…");
    rec.stop();
    const blob = await stopped;
    const url = URL.createObjectURL(blob);
    setExportState({
      phase: "DONE",
      progress: 1,
      url,
      sizeMB: blob.size / 1e6
    });
    setStatus(`Export complete · ${(blob.size / 1e6).toFixed(1)} MB webm`);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.meta.slug}.webm`;
    a.click();
  };

  // ---- timeline scrubbing --------------------------------------------------

  const scrubFromEvent = (e: React.PointerEvent) => {
    const el = timelineRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left + el.scrollLeft - TRACK_LABEL_W;
    seek(x / PX_PER_SEC);
  };

  const onTimelineDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setPlaying(false);
    scrubFromEvent(e);
  };

  // ---- render ---------------------------------------------------------------

  const exporting =
    exportState.phase === "RENDERING" || exportState.phase === "ENCODING";
  const timelineW = TRACK_LABEL_W + duration * PX_PER_SEC + 120;
  const seconds = Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => i);

  const chips: Array<[string, string, boolean]> = [
    ["GPU", exporting ? "ACTIVE" : "READY", exporting],
    [
      "ENCODER",
      exportState.phase === "ENCODING"
        ? "ACTIVE"
        : exportState.phase === "DONE"
        ? "DONE"
        : "PENDING",
      exportState.phase === "ENCODING"
    ],
    ["RUNTIME WORKER", exporting ? "BUSY" : "IDLE", exporting]
  ];

  return (
    <div className="studio">
      {/* ============ TOP BAR ============ */}
      <header className="topbar">
        <div className="path">
          <span className="dot" />
          nuwav.studio/projects/{project.meta.slug}
          <span className="path-dim">
            ?src={project.meta.slug}.geo-video.json
          </span>
        </div>
        <div className="transport">
          <button className="tbtn" onClick={() => jumpScene(-1)} title="Previous scene">
            ‹
          </button>
          <button
            className="tbtn play"
            onClick={() => (playing ? setPlaying(false) : play())}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button className="tbtn" onClick={() => jumpScene(1)} title="Next scene">
            ›
          </button>
          <span className="clock">
            {time.toFixed(1)}s <em>/</em> {duration.toFixed(1)}s
          </span>
          <button
            className={`follow ${follow ? "on" : ""}`}
            onClick={() => setFollow(!follow)}
          >
            FOLLOW TIMELINE
          </button>
        </div>
        <div className="actions">
          <div className="tabs">
            {(["draft", "briefing"] as const).map((k) => (
              <button
                key={k}
                className={`tab ${skin === k ? "on" : ""}`}
                onClick={() => setSkin(k)}
              >
                {k.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="abtn" onClick={() => fileRef.current?.click()}>
            ⤒ LOAD
          </button>
          <button className="abtn" onClick={handleSave}>
            ⛃ SAVE
          </button>
          <button className="abtn" onClick={handleCompile}>
            ⚙ COMPILE
          </button>
          <button
            className={`abtn ${cleanView ? "lit" : ""}`}
            onClick={() => setCleanView(!cleanView)}
          >
            ◉ PREVIEW
          </button>
          <button className="abtn export" onClick={handleExport}>
            ⇩ EXPORT
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={handleFile}
          />
        </div>
      </header>

      {/* ============ MAIN ============ */}
      <div className="main">
        {/* ---- stage ---- */}
        <div className="stage" ref={stageRef}>
          {!cleanView && (
            <div className="stage-tag">
              PREVIEW · {scene ? scene.label : "GLOBAL ESTABLISHING VIEW"}
            </div>
          )}
          <div
            className="frame"
            style={{
              width: OUT_W,
              height: OUT_H,
              transform: `scale(${stageScale})`
            }}
          >
            <Globe
              ref={globeRef as any}
              width={OUT_W}
              height={OUT_H}
              backgroundColor="#020a12"
              rendererConfig={{
                antialias: true,
                alpha: true,
                preserveDrawingBuffer: true
              }}
              globeMaterial={globeMaterial}
              showAtmosphere
              atmosphereColor={accent}
              atmosphereAltitude={0.22}
              showGraticules={toggles.grid}
              hexPolygonsData={countries}
              hexPolygonResolution={3}
              hexPolygonMargin={0.58}
              hexPolygonColor={hexColor}
              polygonsData={highlightFeatures}
              polygonCapColor={() => "rgba(63,216,255,0.22)"}
              polygonSideColor={() => "rgba(63,216,255,0.35)"}
              polygonStrokeColor={() => "rgba(140,235,255,0.9)"}
              polygonAltitude={0.012}
              polygonsTransitionDuration={400}
              arcsData={visibleArcs}
              arcColor={(a: any) => a.color ?? accent}
              arcStroke={0.55}
              arcAltitudeAutoScale={0.4}
              arcDashLength={0.45}
              arcDashGap={0.25}
              arcDashAnimateTime={1500}
              pointsData={visiblePoints}
              pointColor={(p: any) => p.color ?? accent}
              pointAltitude={0.015}
              pointRadius={(p: any) => p.size ?? 0.32}
              ringsData={rings}
              ringColor={(r: any) => (t: number) => {
                const c = r.color ?? RED;
                const alpha = Math.round((1 - t) * 200)
                  .toString(16)
                  .padStart(2, "0");
                return `${c}${alpha}`;
              }}
              ringMaxRadius={4.2}
              ringPropagationSpeed={2.2}
              ringRepeatPeriod={900}
              labelsData={labels}
              labelText={(d: any) => d.label}
              labelSize={0.95}
              labelDotRadius={0.22}
              labelAltitude={0.012}
              labelColor={() => "rgba(220,244,255,0.85)"}
              labelResolution={2}
              onGlobeReady={() => applyCamera(timeRef.current)}
            />

            {/* HUD overlays (DOM mirror of what the exporter burns in) */}
            {toggles.hud && !cleanView && (
              <>
                <div className="hud-border" />
                <div className="hud-topleft">
                  {scene?.label ?? "—"}
                  <span className="hud-time">{time.toFixed(1)}s</span>
                </div>
                <div className="hud-watermark">NUWAV · GEO-VIDEO</div>
                {exporting && <div className="hud-rec" />}
              </>
            )}
            {toggles.media && scene?.media && (
              <div className="media-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={scene.media.src} alt={scene.media.label ?? "b-roll"} />
                <div className="media-label">
                  <span>{scene.media.label ?? "STOCK / B-ROLL"}</span>
                  <span className="media-src">SRC 02</span>
                </div>
              </div>
            )}
            {caption && (
              <div className="lower-third">
                <span
                  className="lt-accent"
                  style={{ background: caption.accent ?? RED }}
                />
                <span className="lt-text">{caption.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* ---- export / controls panel ---- */}
        <aside className="panel">
          <button
            className="export-banner"
            onClick={handleExport}
            disabled={exporting}
          >
            EXPORT IN BROWSER
            <small>(RENDERS ON THIS MACHINE VIA CANVAS CAPTURE)</small>
          </button>

          <div className="chips">
            {chips.map(([label, state, hot]) => (
              <div className="chip" key={label}>
                <span className="chip-label">{label}</span>
                <span className={`chip-state ${hot ? "hot" : ""}`}>
                  {state}
                </span>
              </div>
            ))}
          </div>

          <div className="grid">
            <div className="cell">
              <label>MODE</label>
              <b>{exporting ? exportState.phase : "READY"}</b>
            </div>
            <div className="cell">
              <label>QUALITY</label>
              <b>{quality.toUpperCase()}</b>
            </div>
            <div className="cell">
              <label>FRAME</label>
              <b>
                {OUT_W * (quality === "high" ? 2 : 1)}×
                {OUT_H * (quality === "high" ? 2 : 1)}
              </b>
            </div>
            <div className="cell">
              <label>FPS</label>
              <b>{fps}</b>
            </div>
            <div className="cell">
              <label>DURATION</label>
              <b>{duration.toFixed(2)}s</b>
            </div>
            <div className="cell">
              <label>SIZE</label>
              <b>
                {exportState.sizeMB
                  ? `${exportState.sizeMB.toFixed(1)} MB`
                  : "PENDING"}
              </b>
            </div>
          </div>

          <div className="progress">
            <div
              className="progress-fill"
              style={{ width: `${exportState.progress * 100}%` }}
            />
          </div>
          <div className="status-line">
            <b>{exportState.phase}</b> {status}
          </div>

          {exportState.url && (
            <div className="result">
              <video src={exportState.url} controls playsInline />
              <a href={exportState.url} download={`${project.meta.slug}.webm`}>
                ⇩ {project.meta.slug}.webm
              </a>
            </div>
          )}

          <div className="section-title">⚙ VIEW CONTROLS</div>
          <div className="controls">
            <div className="ctl">
              <label>QUALITY</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as any)}
              >
                <option value="draft">Draft</option>
                <option value="high">High (2×)</option>
              </select>
            </div>
            <div className="ctl">
              <label>SKIN</label>
              <select
                value={skin}
                onChange={(e) => setSkin(e.target.value as any)}
              >
                <option value="briefing">Briefing</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            {(
              [
                ["hud", "HUD"],
                ["routes", "ROUTES"],
                ["labels", "LABELS"],
                ["points", "POINTS"],
                ["grid", "GRID"],
                ["media", "B-ROLL"],
                ["voice", "VOICE"]
              ] as const
            ).map(([key, label]) => (
              <div className="ctl" key={key}>
                <label>{label}</label>
                <button
                  className={`switch ${toggles[key] ? "on" : ""}`}
                  onClick={() =>
                    setToggles((t) => ({ ...t, [key]: !t[key] }))
                  }
                >
                  <span />
                </button>
              </div>
            ))}
          </div>

          {/* ---- script / inspector ---- */}
          <div className="section-title">✎ SCRIPT · INSPECTOR</div>
          <div className="scene-list">
            {project.scenes.map((s, i) => (
              <button
                key={s.id}
                className={`scene-row ${scene?.id === s.id ? "on" : ""}`}
                onClick={() => {
                  setPlaying(false);
                  seek(s.start + 0.01);
                }}
              >
                <span className="scene-idx">{String(i + 1).padStart(2, "0")}</span>
                <span className="scene-name">{s.label}</span>
                <span className="scene-time">
                  {s.start.toFixed(1)}–{s.end.toFixed(1)}s
                </span>
              </button>
            ))}
          </div>

          {scene && (
            <div className="inspector">
              <div className="ins-field">
                <label>SCENE LABEL</label>
                <input
                  value={scene.label}
                  onChange={(e) => updateScene(scene.id, { label: e.target.value })}
                />
              </div>
              <div className="ins-field">
                <label>CAPTION</label>
                <textarea
                  rows={2}
                  value={scene.caption?.text ?? ""}
                  onChange={(e) =>
                    updateScene(scene.id, {
                      caption: e.target.value
                        ? { ...scene.caption, text: e.target.value }
                        : undefined
                    })
                  }
                />
              </div>
              <div className="ins-field">
                <label>VOICEOVER (SPOKEN LINE)</label>
                <textarea
                  rows={2}
                  value={scene.voiceover?.text ?? ""}
                  onChange={(e) =>
                    updateScene(scene.id, {
                      voiceover: e.target.value
                        ? { ...scene.voiceover, text: e.target.value }
                        : undefined
                    })
                  }
                />
              </div>
              <div className="ins-field">
                <label>HIGHLIGHT COUNTRIES (ISO A3, COMMA-SEP)</label>
                <input
                  value={(scene.highlight ?? []).join(", ")}
                  onChange={(e) =>
                    updateScene(scene.id, {
                      highlight: e.target.value
                        .split(",")
                        .map((c) => c.trim())
                        .filter(Boolean)
                    })
                  }
                  placeholder="CHN, TWN, USA…"
                />
              </div>
              <div className="ins-field">
                <label>B-ROLL MEDIA URL</label>
                <input
                  value={scene.media?.src ?? ""}
                  onChange={(e) =>
                    updateScene(scene.id, {
                      media: e.target.value
                        ? { ...scene.media, src: e.target.value }
                        : undefined
                    })
                  }
                  placeholder="/media/… or https://…"
                />
              </div>
              <div className="ins-field">
                <label>B-ROLL LABEL</label>
                <input
                  value={scene.media?.label ?? ""}
                  onChange={(e) =>
                    scene.media &&
                    updateScene(scene.id, {
                      media: { ...scene.media, label: e.target.value }
                    })
                  }
                  disabled={!scene.media}
                />
              </div>
              <button className="brief-btn" onClick={copyAgentBrief}>
                ⧉ COPY AGENT BRIEF (RESEARCH / REWRITE SCRIPT)
              </button>
              <div className="ins-hint">
                Paste the brief into any AI agent with a new topic — it returns
                a full geo-video.json to LOAD. Edits here apply live; SAVE
                downloads the updated file.
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ============ TIMELINE ============ */}
      <footer className="timeline-wrap">
        <div className="timeline-head">
          <span>
            TIMELINE · {itemCount} ITEMS · {project.meta.title.toUpperCase()}
          </span>
          <span className="tl-hint">click / drag to scrub · space = play</span>
        </div>
        <div
          className="timeline"
          ref={timelineRef}
          onPointerDown={onTimelineDown}
          onPointerMove={(e) => e.buttons === 1 && scrubFromEvent(e)}
        >
          <div className="tl-inner" style={{ width: timelineW }}>
            {/* ruler */}
            <div className="ruler">
              <div className="track-label" />
              {seconds.map((sec) => (
                <div
                  key={sec}
                  className="tick"
                  style={{ left: TRACK_LABEL_W + sec * PX_PER_SEC }}
                >
                  {sec % 2 === 0 ? `${sec}.0s` : ""}
                </div>
              ))}
            </div>
            {/* camera track */}
            <div className="track">
              <div className="track-label">CAM</div>
              {project.scenes.map((s) => (
                <div
                  key={s.id}
                  className="clip cam"
                  style={{
                    left: TRACK_LABEL_W + s.start * PX_PER_SEC,
                    width: (s.end - s.start) * PX_PER_SEC - 2
                  }}
                  title={s.label}
                >
                  {s.label}
                </div>
              ))}
            </div>
            {/* caption track */}
            <div className="track">
              <div className="track-label">CAPTION</div>
              {project.scenes
                .filter((s) => s.caption)
                .map((s) => (
                  <div
                    key={s.id}
                    className="clip cap"
                    style={{
                      left: TRACK_LABEL_W + s.start * PX_PER_SEC,
                      width: (s.end - s.start) * PX_PER_SEC - 2,
                      borderLeftColor: s.caption?.accent ?? RED
                    }}
                    title={s.caption!.text}
                  >
                    {s.caption!.text}
                  </div>
                ))}
            </div>
            {/* fx track */}
            <div className="track">
              <div className="track-label">FX</div>
              {project.arcs.map((a, i) => (
                <div
                  key={`a${i}`}
                  className="clip fx"
                  style={{
                    left: TRACK_LABEL_W + (a.start ?? 0) * PX_PER_SEC,
                    width: Math.max(
                      ((a.end ?? duration) - (a.start ?? 0)) * PX_PER_SEC - 2,
                      26
                    )
                  }}
                  title={a.label}
                >
                  {a.label ?? "ARC"}
                </div>
              ))}
            </div>
            {/* voiceover track */}
            <div className="track">
              <div className="track-label">VO</div>
              {project.scenes
                .filter((s) => s.voiceover?.text || s.voiceover?.src)
                .map((s) => (
                  <div
                    key={s.id}
                    className="clip vo"
                    style={{
                      left: TRACK_LABEL_W + s.start * PX_PER_SEC,
                      width: (s.end - s.start) * PX_PER_SEC - 2
                    }}
                    title={s.voiceover?.text ?? s.voiceover?.src}
                  >
                    🗣 {s.voiceover?.text ?? s.voiceover?.src}
                  </div>
                ))}
            </div>
            {/* playhead */}
            <div
              className="playhead"
              style={{ left: TRACK_LABEL_W + time * PX_PER_SEC }}
            />
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html,
        body,
        #__next {
          height: 100%;
          margin: 0;
          background: #04090f;
        }
      `}</style>
      <style jsx>{`
        .studio {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #04090f;
          color: #cfe8f5;
          font-family: "SF Mono", "Cascadia Code", Menlo, monospace;
          font-size: 12px;
          overflow: hidden;
          user-select: none;
        }

        /* ---------- top bar ---------- */
        .topbar {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 8px 14px;
          background: #071019;
          border-bottom: 1px solid #102536;
          flex-wrap: wrap;
        }
        .path {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #7fb6cc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 34vw;
        }
        .path-dim {
          color: #3f6377;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${CYAN};
          box-shadow: 0 0 8px ${CYAN};
        }
        .transport {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tbtn {
          background: #0b1a28;
          border: 1px solid #16344a;
          color: #cfe8f5;
          border-radius: 6px;
          width: 30px;
          height: 26px;
          cursor: pointer;
          font-size: 13px;
        }
        .tbtn.play {
          width: 40px;
          color: ${CYAN};
          border-color: ${CYAN}55;
        }
        .tbtn:hover {
          border-color: ${CYAN};
        }
        .clock {
          color: ${AMBER};
          min-width: 110px;
          text-align: center;
        }
        .clock em {
          color: #4d6d80;
          font-style: normal;
        }
        .follow {
          background: transparent;
          border: 1px solid #3a4a2a;
          color: #6d7d5d;
          padding: 5px 12px;
          border-radius: 6px;
          cursor: pointer;
          letter-spacing: 0.08em;
          font-size: 11px;
        }
        .follow.on {
          border-color: ${AMBER};
          color: ${AMBER};
          box-shadow: 0 0 10px ${AMBER}33 inset;
        }
        .actions {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tabs {
          display: flex;
          border: 1px solid #16344a;
          border-radius: 6px;
          overflow: hidden;
          margin-right: 6px;
        }
        .tab {
          background: transparent;
          border: 0;
          color: #4d6d80;
          padding: 5px 10px;
          cursor: pointer;
          font-size: 11px;
          letter-spacing: 0.06em;
        }
        .tab.on {
          background: #0e2233;
          color: #e6f6ff;
        }
        .abtn {
          background: #0b1a28;
          border: 1px solid #16344a;
          color: #cfe8f5;
          padding: 5px 12px;
          border-radius: 6px;
          cursor: pointer;
          letter-spacing: 0.06em;
          font-size: 11px;
          white-space: nowrap;
        }
        .abtn:hover {
          border-color: ${CYAN};
        }
        .abtn.lit {
          border-color: ${CYAN};
          color: ${CYAN};
        }
        .abtn.export {
          border-color: ${AMBER};
          color: ${AMBER};
        }

        /* ---------- main ---------- */
        .main {
          flex: 1;
          display: flex;
          min-height: 0;
        }
        .stage {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: radial-gradient(
            ellipse at 50% 40%,
            #071523 0%,
            #04090f 70%
          );
        }
        .stage-tag {
          position: absolute;
          top: 12px;
          left: 16px;
          color: #4d8299;
          letter-spacing: 0.12em;
          font-size: 11px;
          z-index: 3;
        }
        .frame {
          position: relative;
          flex: none;
          border: 1px solid #1d4a63;
          box-shadow: 0 0 40px #0a2a4088, 0 0 0 1px #0a1c2a;
          background: #020a12;
          transform-origin: center center;
        }
        .hud-border {
          position: absolute;
          inset: 10px;
          border: 1px solid rgba(63, 216, 255, 0.35);
          pointer-events: none;
        }
        .hud-topleft {
          position: absolute;
          top: 24px;
          left: 24px;
          right: 24px;
          display: flex;
          justify-content: space-between;
          color: rgba(63, 216, 255, 0.9);
          font-size: 11px;
          letter-spacing: 0.1em;
          pointer-events: none;
        }
        .hud-watermark {
          position: absolute;
          left: 24px;
          bottom: 28px;
          color: rgba(63, 216, 255, 0.55);
          font-size: 10px;
          letter-spacing: 0.14em;
          pointer-events: none;
        }
        .hud-rec {
          position: absolute;
          right: 28px;
          bottom: 28px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: ${RED};
          animation: blink 1s steps(2) infinite;
        }
        @keyframes blink {
          50% {
            opacity: 0.15;
          }
        }
        .media-card {
          position: absolute;
          left: 48px;
          right: 48px;
          top: 150px;
          background: rgba(2, 10, 18, 0.85);
          border: 1.5px solid rgba(63, 216, 255, 0.6);
          pointer-events: none;
        }
        .media-card img {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
        }
        .media-label {
          display: flex;
          justify-content: space-between;
          padding: 5px 10px;
          color: rgba(63, 216, 255, 0.9);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .media-src {
          color: rgba(63, 216, 255, 0.45);
        }
        .lower-third {
          position: absolute;
          left: 48px;
          right: 48px;
          bottom: 120px;
          display: flex;
          background: rgba(2, 10, 18, 0.72);
          pointer-events: none;
        }
        .lt-accent {
          width: 7px;
          flex: none;
        }
        .lt-text {
          padding: 12px 16px;
          font-family: Arial, Helvetica, sans-serif;
          font-weight: 800;
          font-size: 26px;
          line-height: 1.25;
          color: #f2f7fa;
          text-transform: uppercase;
        }

        /* ---------- side panel ---------- */
        .panel {
          width: 320px;
          flex: none;
          border-left: 1px solid #102536;
          background: #060e17;
          padding: 14px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .export-banner {
          background: #0a2416;
          border: 1px solid #1f6b3d;
          color: #7be3a4;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          letter-spacing: 0.1em;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-family: inherit;
        }
        .export-banner small {
          color: #3f8f5e;
          font-size: 9px;
          letter-spacing: 0.08em;
        }
        .export-banner:hover:not(:disabled) {
          border-color: #35c96f;
        }
        .export-banner:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .chips {
          display: flex;
          gap: 8px;
        }
        .chip {
          flex: 1;
          background: #0a1622;
          border: 1px solid #16344a;
          border-radius: 8px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .chip-label {
          color: ${AMBER};
          font-size: 9px;
          letter-spacing: 0.1em;
        }
        .chip-state {
          color: #6f93a6;
          font-size: 11px;
        }
        .chip-state.hot {
          color: ${CYAN};
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .cell {
          background: #0a1622;
          border: 1px solid #10283a;
          border-radius: 8px;
          padding: 8px;
        }
        .cell label {
          display: block;
          color: ${AMBER};
          font-size: 9px;
          letter-spacing: 0.12em;
          margin-bottom: 4px;
        }
        .cell b {
          color: #e6f6ff;
          font-weight: 600;
        }
        .progress {
          height: 6px;
          background: #0a1622;
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, ${CYAN}, ${AMBER});
          transition: width 0.15s linear;
        }
        .status-line {
          color: #6f93a6;
          font-size: 11px;
        }
        .status-line b {
          color: ${AMBER};
          margin-right: 6px;
        }
        .result video {
          width: 100%;
          border-radius: 8px;
          border: 1px solid #16344a;
        }
        .result a {
          display: block;
          margin-top: 6px;
          color: ${CYAN};
          text-decoration: none;
        }
        .section-title {
          color: ${CYAN};
          letter-spacing: 0.14em;
          font-size: 10px;
          margin-top: 4px;
        }
        .controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .ctl {
          background: #0a1622;
          border: 1px solid #10283a;
          border-radius: 8px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ctl label {
          color: #6f93a6;
          font-size: 9px;
          letter-spacing: 0.12em;
        }
        .ctl select {
          background: #071019;
          color: #e6f6ff;
          border: 1px solid #16344a;
          border-radius: 6px;
          padding: 4px;
          font-family: inherit;
          font-size: 11px;
        }
        .switch {
          width: 38px;
          height: 20px;
          border-radius: 12px;
          border: 1px solid #16344a;
          background: #071019;
          cursor: pointer;
          position: relative;
          padding: 0;
        }
        .switch span {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #35566b;
          transition: all 0.15s;
        }
        .switch.on {
          border-color: ${CYAN};
        }
        .switch.on span {
          left: 20px;
          background: ${CYAN};
          box-shadow: 0 0 8px ${CYAN};
        }

        /* ---------- script / inspector ---------- */
        .scene-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .scene-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0a1622;
          border: 1px solid #10283a;
          border-radius: 6px;
          padding: 6px 8px;
          color: #9db8c6;
          font-family: inherit;
          font-size: 10px;
          cursor: pointer;
          text-align: left;
        }
        .scene-row:hover {
          border-color: ${CYAN}66;
        }
        .scene-row.on {
          border-color: ${AMBER};
          color: #ffe9c4;
        }
        .scene-idx {
          color: ${AMBER};
        }
        .scene-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .scene-time {
          color: #4d6d80;
        }
        .inspector {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ins-field label {
          display: block;
          color: #6f93a6;
          font-size: 9px;
          letter-spacing: 0.12em;
          margin-bottom: 4px;
        }
        .ins-field input,
        .ins-field textarea {
          width: 100%;
          box-sizing: border-box;
          background: #071019;
          color: #e6f6ff;
          border: 1px solid #16344a;
          border-radius: 6px;
          padding: 6px 8px;
          font-family: inherit;
          font-size: 11px;
          resize: vertical;
        }
        .ins-field input:focus,
        .ins-field textarea:focus {
          outline: none;
          border-color: ${CYAN};
        }
        .ins-field input:disabled {
          opacity: 0.4;
        }
        .brief-btn {
          background: #241a08;
          border: 1px solid ${AMBER};
          color: ${AMBER};
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-size: 10px;
          letter-spacing: 0.08em;
        }
        .brief-btn:hover {
          background: #33240b;
        }
        .ins-hint {
          color: #4d6d80;
          font-size: 10px;
          line-height: 1.5;
        }

        /* ---------- timeline ---------- */
        .timeline-wrap {
          flex: none;
          border-top: 1px solid #102536;
          background: #060e17;
        }
        .timeline-head {
          display: flex;
          justify-content: space-between;
          padding: 6px 14px;
          color: #4d8299;
          font-size: 10px;
          letter-spacing: 0.12em;
        }
        .tl-hint {
          color: #35566b;
        }
        .timeline {
          overflow-x: auto;
          overflow-y: hidden;
          cursor: crosshair;
        }
        .tl-inner {
          position: relative;
          padding-bottom: 10px;
        }
        .ruler {
          position: relative;
          height: 20px;
          border-bottom: 1px solid #10283a;
        }
        .tick {
          position: absolute;
          top: 2px;
          color: #4d6d80;
          font-size: 9px;
          border-left: 1px solid #1a3a52;
          padding-left: 3px;
          height: 16px;
        }
        .track {
          position: relative;
          height: 34px;
          border-bottom: 1px solid #0b1c2b;
        }
        .track-label {
          position: sticky;
          left: 0;
          width: ${TRACK_LABEL_W}px;
          height: 100%;
          display: flex;
          align-items: center;
          padding-left: 12px;
          color: #4d8299;
          font-size: 9px;
          letter-spacing: 0.14em;
          background: #060e17;
          z-index: 2;
          box-sizing: border-box;
        }
        .clip {
          position: absolute;
          top: 4px;
          height: 26px;
          border-radius: 4px;
          font-size: 9px;
          line-height: 26px;
          padding: 0 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          box-sizing: border-box;
        }
        .clip.cam {
          background: #0d3244;
          border: 1px solid #1f5a77;
          color: #9fdcf2;
        }
        .clip.cap {
          background: #3a0d1c;
          border: 1px solid #7a1f38;
          border-left: 3px solid ${RED};
          color: #f2b8c6;
        }
        .clip.fx {
          background: #10264a;
          border: 1px solid #26538f;
          color: #a9c8f2;
        }
        .clip.vo {
          background: #0d3a2a;
          border: 1px solid #1f7a55;
          color: #a8ecc9;
        }
        .playhead {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: ${AMBER};
          box-shadow: 0 0 8px ${AMBER};
          pointer-events: none;
          z-index: 3;
        }
        .playhead::before {
          content: "";
          position: absolute;
          top: 0;
          left: -4px;
          border: 5px solid transparent;
          border-top-color: ${AMBER};
        }

        @media (max-width: 900px) {
          .panel {
            display: none;
          }
          .path {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
