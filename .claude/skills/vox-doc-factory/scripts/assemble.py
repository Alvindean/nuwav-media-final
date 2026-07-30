#!/usr/bin/env python3
"""
Timeline assembler — fills the CapCut gap.

CapCut has no API and no scripting interface, so a 200-shot timeline cannot be
built by an agent. This builds the whole rough cut with FFmpeg instead: every
shot placed against the narration's real word timings, camera moves keyframed,
the house grade and grain applied, captions burned.

Output is publishable on its own. The intended workflow is the hybrid: this
produces the cut, then a human spends ~45 minutes in CapCut upgrading the 15-20
transitions that actually carry the episode (see references/transition-playbook.md).

SETUP
    ffmpeg with libx264 and the zoompan/noise filters (any standard build)

USAGE
    python3 assemble.py --shots shots.json --vo audio/vo.wav --out edit/rough.mp4
    python3 assemble.py --shots shots.json --vo audio/vo.wav --out edit/rough.mp4 \\
                        --music audio/music/bed.wav --srt audio/vo.srt

shots.json schema (produced by the Shot Designer in Stage 6):
    [
      {"id":"SH001","type":"still","src":"media/stills/SH001.png",
       "start":0.0,"end":4.2,"move":"push_in","anchor":"center"},
      {"id":"SH002","type":"hero","src":"media/hero/SH002.mp4",
       "start":4.2,"end":9.2,"move":"none"},
      {"id":"SH003","type":"graphic","src":"graphics/maps/SH003.mov",
       "start":9.2,"end":13.0,"move":"push_out"}
    ]

move: push_in | push_out | pan_left | pan_right | none
"""

import argparse
import json
import os
import subprocess
import sys

W, H, FPS = 1920, 1080, 24

# The house grade, as an ffmpeg filter chain. Mirrors references/color-grade.md:
# lifted blacks, desaturated base, warm mids, then uniform grain LAST so the
# generated, archival and rendered material all sit in one texture.
GRADE = (
    "eq=contrast=1.08:saturation=0.88:gamma=1.02,"
    "colorbalance=rs=0.03:gs=0.00:bs=-0.02:rm=0.04:bm=-0.03,"
    "curves=all='0/0.02 0.5/0.5 1/0.96',"
    "unsharp=5:5:0.6"
)
GRAIN = "noise=alls=9:allf=t+u"


def dur(shot: float) -> int:
    return max(1, int(round(shot * FPS)))


def move_filter(move: str, frames: int) -> str:
    """Keyframed camera moves on stills.

    zoompan runs per output frame. Linear easing is deliberate — an ease curve
    reads as an *effect*, while a real camera push is linear. Scale never goes
    past ~1.08 because softness becomes visible after YouTube's transcode.
    """
    # Upscale first so the crop has real pixels to work with.
    pre = f"scale={W*2}:{H*2}:flags=lanczos,setsar=1"
    z_in = f"min(1+0.08*on/{frames},1.08)"
    z_out = f"max(1.08-0.08*on/{frames},1.0)"
    centre = "x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2)"

    if move == "push_in":
        zp = f"zoompan=z='{z_in}':{centre}:d={frames}:s={W}x{H}:fps={FPS}"
    elif move == "push_out":
        zp = f"zoompan=z='{z_out}':{centre}:d={frames}:s={W}x{H}:fps={FPS}"
    elif move == "pan_left":
        zp = (f"zoompan=z='1.08':x='(iw-iw/zoom)*(1-on/{frames})':"
              f"y=ih/2-(ih/zoom/2):d={frames}:s={W}x{H}:fps={FPS}")
    elif move == "pan_right":
        zp = (f"zoompan=z='1.08':x='(iw-iw/zoom)*(on/{frames})':"
              f"y=ih/2-(ih/zoom/2):d={frames}:s={W}x{H}:fps={FPS}")
    else:
        zp = f"zoompan=z='1.0':{centre}:d={frames}:s={W}x{H}:fps={FPS}"
    return f"{pre},{zp}"


def build_shot(shot: dict, tmp: str, idx: int) -> str:
    """Render one shot to a normalised intermediate clip."""
    out = os.path.join(tmp, f"{idx:04d}.mp4")
    length = shot["end"] - shot["start"]
    frames = dur(length)
    src = shot["src"]

    if not os.path.exists(src):
        raise FileNotFoundError(f"{shot['id']}: missing source {src}")

    if shot["type"] == "still":
        vf = f"{move_filter(shot.get('move', 'push_in'), frames)},format=yuv420p"
        cmd = ["ffmpeg", "-y", "-loop", "1", "-i", src, "-t", f"{length:.3f}",
               "-vf", vf, "-r", str(FPS), "-c:v", "libx264", "-crf", "16",
               "-pix_fmt", "yuv420p", "-an", out]
    else:
        # Video: conform to the timeline, drop any source audio. Generated
        # audio is never used — ElevenLabs carries the whole track.
        vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,"
              f"crop={W}:{H},fps={FPS},format=yuv420p")
        cmd = ["ffmpeg", "-y", "-i", src, "-t", f"{length:.3f}", "-vf", vf,
               "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-an", out]

    subprocess.run(cmd, check=True, capture_output=True)
    return out


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--shots", required=True)
    p.add_argument("--vo", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--music", help="Music bed; ducked under the narration")
    p.add_argument("--srt", help="Burn these captions in")
    p.add_argument("--no-grain", action="store_true")
    a = p.parse_args()

    shots = json.load(open(a.shots))
    if not shots:
        sys.exit("shots.json is empty.")

    runtime = max(s["end"] for s in shots)
    print(f"{len(shots)} shots, {runtime/60:.1f} min")
    if runtime < 660:
        # The hard floor is 11:00. Catch it here rather than at upload.
        print(f"  WARNING: {runtime/60:.1f} min is under the 11:00 floor.", file=sys.stderr)

    avg = sum(s["end"] - s["start"] for s in shots) / len(shots)
    print(f"  average shot {avg:.1f}s (target 3.5-4.5s)")

    tmp = os.path.join(os.path.dirname(os.path.abspath(a.out)) or ".", "_parts")
    os.makedirs(tmp, exist_ok=True)

    parts, failed = [], []
    for i, s in enumerate(shots):
        try:
            parts.append(build_shot(s, tmp, i))
        except (FileNotFoundError, subprocess.CalledProcessError) as e:
            # Self-healing: never abort the whole assembly for one bad shot.
            # Report it loudly at the end so it can't pass silently.
            failed.append(f"{s['id']}: {e}")
            print(f"  SKIPPED {s['id']}", file=sys.stderr)

    if not parts:
        sys.exit("Every shot failed. Nothing to assemble.")

    listing = os.path.join(tmp, "list.txt")
    with open(listing, "w") as f:
        for part in parts:
            f.write(f"file '{os.path.abspath(part)}'\n")

    vf = GRADE if a.no_grain else f"{GRADE},{GRAIN}"
    if a.srt:
        vf += (f",subtitles={a.srt}:force_style="
               "'FontName=Verdana,FontSize=22,PrimaryColour=&HFFFFFF,"
               "OutlineColour=&H000000,BorderStyle=1,Outline=2,MarginV=60'")

    cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listing, "-i", a.vo]
    if a.music:
        # Sidechain the bed to the narration: -8dB duck, matching color-grade.md.
        cmd += ["-i", a.music, "-filter_complex",
                f"[0:v]{vf}[v];"
                "[2:a]volume=0.25[bed];"
                "[bed][1:a]sidechaincompress=threshold=0.05:ratio=8:attack=200:release=400[duck];"
                "[1:a][duck]amix=inputs=2:duration=first:weights=1 0.6[a]",
                "-map", "[v]", "-map", "[a]"]
    else:
        cmd += ["-filter_complex", f"[0:v]{vf}[v]", "-map", "[v]", "-map", "1:a"]

    cmd += ["-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "320k",
            # -14 LUFS is YouTube's normalisation target. Louder just gets
            # turned down and the dynamics are lost for nothing.
            "-af", "loudnorm=I=-14:TP=-1:LRA=11",
            "-shortest", a.out]

    print("Assembling...")
    subprocess.run(cmd, check=True)

    print(f"\nWrote {a.out}")
    if failed:
        print(f"\n{len(failed)} shot(s) FAILED and were skipped:", file=sys.stderr)
        for f_ in failed:
            print(f"  {f_}", file=sys.stderr)
        print("Regenerate these and re-run before publishing.", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
