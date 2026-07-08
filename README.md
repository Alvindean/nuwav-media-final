# nuwav-media-final
Nu Wav Media | Marketing That Works

## Geo-Video Studio (`/studio`)

An agent-driven 3D globe video editor built with three.js + react-globe.gl:
a holographic globe in a 9:16 video frame, a multi-track timeline driven by a
declarative `*.geo-video.json` project file, burned-in lower-third captions,
and in-browser `.webm` export (canvas capture + MediaRecorder).

- Open `/studio` for the bundled demo, or `/studio?src=projects/nuwav-briefing.geo-video.json`
- Author your own projects with an AI agent — see [docs/GEO_VIDEO_AGENT.md](docs/GEO_VIDEO_AGENT.md)

```bash
npm install --legacy-peer-deps
npm run dev   # http://localhost:3000/studio
```
