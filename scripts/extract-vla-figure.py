#!/usr/bin/env python3
"""Render the complete authentic VLA Figure 1 without surrounding paper text."""

from pathlib import Path
import re

import fitz


SOURCE = Path("/Users/stephen/Downloads/1.pdf")
OUTPUT = Path(
    "/private/tmp/guanxinyu-editorial-20261008.sFsPZ7/images/paper-vla-early-exit.png"
)
TITLE = (
    "How Deep Should a VLA Think When Thinking Costs Time? "
    "Budget-Constrained RL for Early Exit"
)
PAGE_INDEX = 1
CLIP = fitz.Rect(108, 78, 504, 276)
SCALE = 4


def main():
    with fitz.open(SOURCE) as document:
        normalized_title_page = re.sub(r"\s+", " ", document[0].get_text()).lower()
        if TITLE.lower() not in normalized_title_page:
            raise ValueError("The PDF title does not match the expected publication.")
        if len(document) != 21:
            raise ValueError("Unexpected PDF page count.")
        page = document[PAGE_INDEX]
        if "Figure 1: Method." not in page.get_text():
            raise ValueError("The selected page does not contain the expected figure caption.")
        pixmap = page.get_pixmap(
            matrix=fitz.Matrix(SCALE, SCALE),
            clip=CLIP,
            colorspace=fitz.csRGB,
            alpha=False,
        )
        pixmap.save(OUTPUT)
        print(f"Saved {OUTPUT}")
        print(f"Page: {PAGE_INDEX + 1}; bbox: {tuple(CLIP)}")
        print(f"Dimensions: {pixmap.width}x{pixmap.height}; channels: {pixmap.n}")


if __name__ == "__main__":
    main()
