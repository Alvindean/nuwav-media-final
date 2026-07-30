#!/usr/bin/env python3
"""
ElevenLabs narration renderer — fills the gap where no ElevenLabs MCP exists.

Renders a script to vo.wav, chunk by chunk, with the house voice settings.
Chunking matters: a 2,400-word script rendered in one call means one bad word
forces a full re-render. Chunk seams are inaudible when settings match.

SETUP (one time)
    export ELEVENLABS_API_KEY="sk_..."     # elevenlabs.io -> Profile -> API Key
    pip install requests

USAGE
    # See which voices the account has, and their IDs
    python3 elevenlabs_tts.py --list-voices

    # Render a whole script
    python3 elevenlabs_tts.py --script script.md --out audio/vo.wav --voice Adam

    # Re-render one line as a pickup, then splice it in manually
    python3 elevenlabs_tts.py --text "Hor-mooz is twenty-one miles wide." \
                              --out audio/pickup_014.wav --voice Adam

Requires ffmpeg on PATH for concatenation (already needed by assemble.py).
"""

import argparse
import os
import re
import subprocess
import sys
import tempfile

try:
    import requests
except ImportError:
    sys.exit("Missing dependency. Run: pip install requests")

API = "https://api.elevenlabs.io/v1"

# House settings — see references/voice-spec.md.
# stability 0.55 keeps the read delivered rather than recited; below ~0.45 it
# drifts over a long script.
HOUSE = {
    "stability": 0.55,
    "similarity_boost": 0.75,
    "style": 0.35,
    "use_speaker_boost": True,
}
DEFAULT_MODEL = "eleven_v3"
FALLBACK_MODEL = "eleven_multilingual_v2"  # steadier across very long reads

# Roughly one act. Small enough that a re-render is cheap, large enough that
# the model keeps its footing within a chunk.
CHUNK_WORDS = 400


def key() -> str:
    k = os.environ.get("ELEVENLABS_API_KEY")
    if not k:
        sys.exit(
            "ELEVENLABS_API_KEY is not set.\n"
            "  1. elevenlabs.io -> your profile -> API Key\n"
            '  2. export ELEVENLABS_API_KEY="sk_..."\n'
            "  3. re-run"
        )
    return k


def list_voices() -> None:
    r = requests.get(f"{API}/voices", headers={"xi-api-key": key()}, timeout=30)
    r.raise_for_status()
    for v in r.json().get("voices", []):
        labels = v.get("labels") or {}
        desc = ", ".join(f"{k}={v2}" for k, v2 in labels.items()) or "-"
        print(f"{v['voice_id']}  {v['name']:<22} {desc}")


def resolve_voice(name_or_id: str) -> str:
    """Accept either a voice name ('Adam') or a raw voice_id."""
    if re.fullmatch(r"[A-Za-z0-9]{20,}", name_or_id):
        return name_or_id
    r = requests.get(f"{API}/voices", headers={"xi-api-key": key()}, timeout=30)
    r.raise_for_status()
    for v in r.json().get("voices", []):
        if v["name"].lower() == name_or_id.lower():
            return v["voice_id"]
    sys.exit(f"No voice named {name_or_id!r}. Run --list-voices to see what's available.")


def strip_script(raw: str) -> str:
    """Remove the bracketed visual notes and markdown so only spoken words remain.

    The script carries [MAP: ...] / [ARCHIVAL: ...] notes for the shot designer.
    Reading those aloud would be a spectacular failure, so they go first.
    """
    text = re.sub(r"\[[A-Z][A-Z ]*:[^\]]*\]", " ", raw)   # [MAP: ...]
    text = re.sub(r"^#{1,6}\s.*$", " ", text, flags=re.M)  # headings
    text = re.sub(r"^\s*[-*]\s+", "", text, flags=re.M)    # bullets
    text = re.sub(r"[*_`>]", "", text)                     # md emphasis
    return re.sub(r"\s+", " ", text).strip()


def chunk(text: str, size: int = CHUNK_WORDS):
    """Split on sentence boundaries, never mid-sentence — seams must land in silence."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    out, cur, n = [], [], 0
    for s in sentences:
        w = len(s.split())
        if n + w > size and cur:
            out.append(" ".join(cur))
            cur, n = [], 0
        cur.append(s)
        n += w
    if cur:
        out.append(" ".join(cur))
    return out


def render(text: str, voice_id: str, model: str, path: str) -> None:
    r = requests.post(
        f"{API}/text-to-speech/{voice_id}",
        headers={"xi-api-key": key(), "Content-Type": "application/json"},
        json={"text": text, "model_id": model, "voice_settings": HOUSE},
        timeout=300,
    )
    if r.status_code == 422 and model != FALLBACK_MODEL:
        # Usually means this voice/account can't serve the requested model.
        print(f"  {model} rejected it; falling back to {FALLBACK_MODEL}", file=sys.stderr)
        return render(text, voice_id, FALLBACK_MODEL, path)
    r.raise_for_status()
    with open(path, "wb") as f:
        f.write(r.content)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--script", help="Path to script.md")
    p.add_argument("--text", help="Render this literal string instead (for pickups)")
    p.add_argument("--out", default="vo.wav")
    p.add_argument("--voice", default="Adam", help="Voice name or voice_id")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--list-voices", action="store_true")
    a = p.parse_args()

    if a.list_voices:
        list_voices()
        return
    if not a.script and not a.text:
        sys.exit("Give --script or --text (or --list-voices).")

    voice_id = resolve_voice(a.voice)
    text = a.text if a.text else strip_script(open(a.script).read())
    words = len(text.split())
    print(f"{words} words -> about {words / 155:.1f} min at 155 wpm")
    if not a.text and words < 1700:
        # Gate 4 is checked against the real audio, but warn early — this is
        # cheaper to fix now than after rendering.
        print("  WARNING: likely under the 11:00 floor. Expect Gate 4 to fail.", file=sys.stderr)

    chunks = chunk(text)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)) or ".", exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        parts = []
        for i, c in enumerate(chunks, 1):
            part = os.path.join(tmp, f"{i:03d}.mp3")
            print(f"  chunk {i}/{len(chunks)} ({len(c.split())} words)")
            render(c, voice_id, a.model, part)
            parts.append(part)

        listing = os.path.join(tmp, "list.txt")
        with open(listing, "w") as f:
            for part in parts:
                f.write(f"file '{part}'\n")

        # 48kHz mono, unprocessed. The audio chain happens in Stage 8, not here.
        subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listing,
             "-ar", "48000", "-ac", "1", a.out],
            check=True, capture_output=True,
        )

    print(f"\nWrote {a.out}")
    print("Next: run Whisper for word timestamps ->")
    print(f"  whisper {a.out} --model medium --word_timestamps True --output_format json")


if __name__ == "__main__":
    main()
