"""Likeness scorer: the outside ruler for the model shop.

Compares every candidate image with the real reference photos using an
independent face-recognition model (dlib via face_recognition). It does not
use any generation model, so it can't grade its own work.

Usage:
  python likeness.py --ref refs/ --cand outputs/ [--json scores.json]

Score: likeness = 1 - (mean face distance to the reference photos), 0-1.
dlib's own rule of thumb: distance under 0.6 = same person, so likeness 0.40+
means "same person", and higher is closer. No face found = likeness 0.
Install: pip install dlib-bin face_recognition_models "setuptools<70" numpy pillow
         pip install --no-deps face_recognition
"""
import argparse
import json
import sys
from pathlib import Path

EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def load_faces(fr, path):
    img = fr.load_image_file(str(path))
    return fr.face_encodings(img)


def images(folder):
    p = Path(folder)
    if not p.is_dir():
        sys.exit(f"likeness: folder not found: {folder}")
    files = sorted(f for f in p.iterdir() if f.suffix.lower() in EXTS)
    if not files:
        sys.exit(f"likeness: no .jpg/.png/.webp images in {folder}")
    return files


def main():
    ap = argparse.ArgumentParser(description="Score how much each candidate image looks like the reference person.")
    ap.add_argument("--ref", required=True, help="folder of real reference photos")
    ap.add_argument("--cand", required=True, help="folder of generated images to score")
    ap.add_argument("--json", help="write scores to this JSON file")
    a = ap.parse_args()
    try:
        import face_recognition as fr
        import numpy as np
    except Exception as e:  # clean sentence, not a traceback
        sys.exit(f"likeness: face_recognition is not installed ({e}). See the install line at the top of this file.")

    refs = []
    for f in images(a.ref):
        enc = load_faces(fr, f)
        if len(enc) != 1:
            print(f"skip reference {f.name}: found {len(enc)} faces, need exactly 1")
            continue
        refs.append(enc[0])
    if not refs:
        sys.exit("likeness: no usable reference photo (each needs exactly one clear face)")

    rows = []
    for f in images(a.cand):
        enc = load_faces(fr, f)
        if not enc:
            rows.append({"file": f.name, "faces": 0, "distance": None, "likeness": 0.0, "same_person": False})
            continue
        # if several faces, score the closest one
        d = min(float(np.mean(fr.face_distance(refs, e))) for e in enc)
        rows.append({"file": f.name, "faces": len(enc), "distance": round(d, 4),
                     "likeness": round(max(0.0, 1 - d), 4), "same_person": d < 0.6})

    rows.sort(key=lambda r: -r["likeness"])
    for r in rows:
        print(f"{r['likeness']:.3f}  {'SAME ' if r['same_person'] else 'DIFF '} faces={r['faces']}  {r['file']}")
    print(f"\n{len(refs)} reference photos, {len(rows)} candidates scored")
    if a.json:
        Path(a.json).write_text(json.dumps({"references": len(refs), "scores": rows}, indent=2))


if __name__ == "__main__":
    main()
