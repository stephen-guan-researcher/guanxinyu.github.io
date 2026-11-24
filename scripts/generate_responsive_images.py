from pathlib import Path
import argparse

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "images" / "generated"
LIFE_GENERATED = ROOT / "images" / "life" / "generated"
LIFE_AVIF_WIDTHS = {
    "sunny-patio": (320, 640, 800, 960, 1280),
    "steaming-pool-boardwalk": (320, 400, 640, 800, 960),
    "las-vegas-sign": (320, 400, 640, 800, 960),
}

PAPERS = [
    "paper-figure-pending-background.png",
    "paper-nominate-adjudicate-overview.png",
    "paper-lora-attribution.png",
    "paper-qeschunker-overview.png",
    "paper-silica-identifiability.png",
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


def save_avif(image, destination, quality):
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "AVIF", quality=quality, speed=7, max_threads=2)


def generate_avatar(avif_only=False):
    with Image.open(ROOT / "images" / "avatar-20261011.jpg") as original:
        source = ImageOps.exif_transpose(original).convert("RGB")
        for width in (208, 256, 352, 528):
            cropped = ImageOps.fit(
                source,
                (width, width),
                method=Image.Resampling.LANCZOS,
                centering=(0.5, 0.5),
            )
            save_avif(cropped, GENERATED / f"avatar-20261011-{width}.avif", 56)
            if not avif_only and width != 256:
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


def generate_life(stems=None, avif_only=False):
    for path in sorted((ROOT / "images" / "life").glob("*.jpg")):
        if stems is not None and path.stem not in stems:
            continue
        avif_widths = LIFE_AVIF_WIDTHS.get(path.stem, ())
        if avif_only and not avif_widths:
            continue
        with Image.open(path) as original:
            source = ImageOps.exif_transpose(original).convert("RGB")
            if avif_widths:
                widths = sorted({min(width, source.width) for width in (*avif_widths, source.width)})
                for width in widths:
                    save_avif(
                        resized(source, width),
                        LIFE_GENERATED / f"{path.stem}-{width}.avif",
                        57,
                    )
            if not avif_only:
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
    parser.add_argument("--avif-only", action="store_true", help="Regenerate only prioritized AVIF images.")
    args = parser.parse_args()
    if args.only in ("all", "avatar"):
        generate_avatar(avif_only=args.avif_only)
    if args.only in ("all", "papers") and not args.avif_only:
        generate_papers()
    if args.only in ("all", "life"):
        generate_life(set(args.life_stem) if args.life_stem else None, avif_only=args.avif_only)
