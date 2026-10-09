#!/usr/bin/env python3
"""Extract the inspected authentic Figure 1 from a private author-supplied PDF."""

import argparse
import hashlib
from pathlib import Path
import re

import fitz


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "images" / "paper-nominate-adjudicate-overview.png"
SOURCE_SHA256 = "d36205c6ccd59353e7fedcfd82cf6028d4b1a877f3e97d486d5d269d504495eb"
TITLE = "Nominate-then-Adjudicate: LLM-Assisted One-Pass and Per-Instance MIP Solver Tuning"
PAGE_INDEX = 1
CLIP = fitz.Rect(49, 52, 561, 160)
SCALE = 4


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    digest = hashlib.sha256(args.source.read_bytes()).hexdigest()
    if digest != SOURCE_SHA256:
        raise ValueError("The source PDF differs from the inspected private copy.")
    with fitz.open(args.source) as document:
        title_page = re.sub(r"\s+", " ", document[0].get_text())
        if TITLE not in title_page or len(document) != 10:
            raise ValueError("Unexpected manuscript title or page count.")
        page = document[PAGE_INDEX]
        if "Fig. 1. The nominate-then-adjudicate pipeline." not in page.get_text():
            raise ValueError("The selected page lacks the inspected Figure 1 caption.")
        clipped_text = page.get_text(clip=CLIP)
        if "Fig. 1." in clipped_text:
            raise ValueError("The crop must exclude the caption.")
        for label in ("EPM", "Compression", "LLM", "skill.md", "1000 random"):
            if label not in clipped_text:
                raise ValueError(f"The method figure is missing its label: {label}")
        pixmap = page.get_pixmap(
            matrix=fitz.Matrix(SCALE, SCALE),
            clip=CLIP,
            colorspace=fitz.csRGB,
            alpha=False,
        )
        if pixmap.width != 2048 or pixmap.height != 432 or pixmap.n != 3:
            raise ValueError("Unexpected crop dimensions or color channels.")
        pixmap.save(OUTPUT)
        print(f"Saved {OUTPUT}")
        print(f"Source SHA-256: {digest}")
        print(f"Page: {PAGE_INDEX + 1}; bbox: {tuple(CLIP)}")
        print(f"Dimensions: {pixmap.width}x{pixmap.height}")


if __name__ == "__main__":
    main()
