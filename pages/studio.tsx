import dynamic from "next/dynamic";
import Head from "next/head";

// The studio is WebGL/DOM-only (three.js + MediaRecorder), so it must never
// render on the server / at export time.
const GeoVideoStudio = dynamic(() => import("../components/GeoVideoStudio"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#04090f",
        color: "#3fd8ff",
        fontFamily: "monospace",
        letterSpacing: "0.2em"
      }}
    >
      BOOTING GEO-VIDEO RUNTIME…
    </div>
  )
});

export default function StudioPage() {
  return (
    <>
      <Head>
        <title>NUWAV Geo-Video Studio</title>
        <meta
          name="description"
          content="Agent-driven 3D globe video editor — timeline, captions and in-browser export."
        />
        <meta name="robots" content="noindex" />
      </Head>
      <GeoVideoStudio />
    </>
  );
}
