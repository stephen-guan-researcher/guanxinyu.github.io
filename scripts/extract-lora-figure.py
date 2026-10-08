#!/usr/bin/env python3
"""Extract the complete authentic Figure 1(a) method-and-comparison subfigure."""

import hashlib
from pathlib import Path
import re

import fitz


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/Users/stephen/Downloads/2.pdf")
OUTPUT = ROOT / "images" / "paper-lora-attribution.png"
SOURCE_SHA256 = "d00554b656061877f90d4816315dca78be3047638b04ec5eb449dc585b798258"
TITLE = (
    "Static Gradient Attribution Underperforms a Density-Matched Random Mask "
    "on Loss-Based Forgetting Within LoRA’s B-Matrix"
)
PAGE_INDEX = 1
CLIP = fitz.Rect(136, 84, 472, 266)
SCALE = 4


def main():
    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    if digest != SOURCE_SHA256:
        raise ValueError("The source PDF hash differs from the inspected copy.")
    with fitz.open(SOURCE) as document:
        title_page = re.sub(r"\s+", " ", document[0].get_text()).casefold()
        if TITLE.casefold() not in title_page:
            raise ValueError("The PDF title does not match the expected publication.")
        if len(document) != 24:
            raise ValueError("Unexpected PDF page count.")
        page = document[PAGE_INDEX]
        if "Figure 1: The density-matched comparison." not in page.get_text():
            raise ValueError("The selected page lacks the inspected Figure 1 caption.")
        clipped_text = page.get_text(clip=CLIP)
        if any(text in clipped_text for text in (
            "Figure 1:", "Under review", "(a) Method and comparison.",
            "(b) Key effect", "Loss-based BWT  (lower is better)",
        )):
            raise ValueError("The crop includes a caption, result panel, or running header.")
        for label in (
            "(1) PARAMETER POOL", "(2) SELECTION RULE", "(3) COMPARED ARMS",
            "(4) TRAIN AND EVALUATE", "(5) OUTCOME", "Standard zero-init:",
        ):
            if label not in clipped_text:
                raise ValueError(f"The method subfigure is missing an expected label: {label}")
        pixmap = page.get_pixmap(
            matrix=fitz.Matrix(SCALE, SCALE),
            clip=CLIP,
            colorspace=fitz.csRGB,
            alpha=False,
        )
        if pixmap.width < 1200 or pixmap.n != 3:
            raise ValueError("The output must be a sufficiently wide RGB image.")
        pixmap.save(OUTPUT)
        print(f"Saved {OUTPUT}")
        print(f"Source SHA-256: {digest}")
        print(f"Page: {PAGE_INDEX + 1}; bbox: {tuple(CLIP)}")
        print(f"Dimensions: {pixmap.width}x{pixmap.height}; channels: {pixmap.n}")


if __name__ == "__main__":
    main()
