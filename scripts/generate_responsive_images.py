from pathlib import Path
import argparse

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "images" / "generated"
LIFE_GENERATED = ROOT / "images" / "life" / "generated"

PAPERS = [
    "paper-figure-pending-background.png",
    "paper-nominate-adjudicate-overview.png",
    "paper-vla-early-exit.png",
    "paper-lora-attribution.png",
    "paper-qeschunker-overview.png",
    "paper-silica-identifiability.png",
    "paper-advantage-maxnorm-ac.png",
    "paper-timbre-overview.png",
    "paper3-cicl-pipeline.png",
    "paper2-suffix-tree.png",
    "paper1-hypergraph.png",
]


def resized(image, width):
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def save_webp(image, destination, quality, max_bytes=None):
    destination.parent.mkdir(parents=True, exist_ok=True)
    rgb = image.convert("RGB")
    while True:
        rgb.save(destination, "WEBP", quality=quality, method=6)
        if max_bytes is None or destination.stat().st_size <= max_bytes:
            break
        if quality <= 50:
            raise ValueError(f"Image exceeds its web byte budget: {destination.name}")
        quality -= 2


def generate_avatar():
    with Image.open(ROOT / "images" / "avatar-20261011.jpg") as source:
        for width in (208, 352, 528):
            cropped = ImageOps.fit(
                ImageOps.exif_transpose(source).convert("RGB"),
                (width, width),
                method=Image.Resampling.LANCZOS,
                centering=(0.5, 0.5),
            )
            save_webp(cropped, GENERATED / f"avatar-20261011-{width}.webp", 74)
            if width == 528:
                cropped.save(GENERATED / "avatar-20261011-528.jpg", "JPEG", quality=80, optimize=True)


def generate_papers():
    for name in PAPERS:
        with Image.open(ROOT / "images" / name) as source:
            stem = Path(name).stem
            widths = sorted({min(width, source.width) for width in (320, 640, 960)})
            for width in widths:
                target = resized(source.convert("RGB"), width)
                save_webp(target, GENERATED / f"{stem}-{width}.webp", 92)


def generate_life(stems=None):
    for path in sorted((ROOT / "images" / "life").glob("*.jpg")):
        if stems is not None and path.stem not in stems:
            continue
        with Image.open(path) as source:
            source = ImageOps.exif_transpose(source).convert("RGB")
            widths = sorted({min(width, source.width) for width in (320, 640, 960, 1280, source.width)})
            for width in widths:
                save_webp(
                    resized(source, width),
                    LIFE_GENERATED / f"{path.stem}-{width}.webp",
                    76,
                    max_bytes=320_000,
                )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate compact responsive site images.")
    parser.add_argument("--only", choices=("all", "avatar", "papers", "life"), default="all")
    parser.add_argument("--life-stem", action="append", help="Limit regeneration to named Life Photo stems.")
    args = parser.parse_args()
    if args.only in ("all", "avatar"):
        generate_avatar()
    if args.only in ("all", "papers"):
        generate_papers()
    if args.only in ("all", "life"):
        generate_life(set(args.life_stem) if args.life_stem else None)
