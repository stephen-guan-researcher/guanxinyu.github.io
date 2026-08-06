from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "images" / "generated"
LIFE_GENERATED = ROOT / "images" / "life" / "generated"

PAPERS = [
    "paper-silica-identifiability.png",
    "paper-advantage-maxnorm-ac.png",
    "paper-chronomem-overview.png",
    "paper3-cicl-pipeline.png",
    "paper2-suffix-tree.png",
    "paper1-hypergraph.png",
]


def resized(image, width):
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def save_webp(image, destination, quality):
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(destination, "WEBP", quality=quality, method=6)


def generate_avatar():
    with Image.open(ROOT / "images" / "avatar.jpg") as source:
        for width in (208, 352, 528):
            height = round(width * 151 / 176)
            cropped = ImageOps.fit(
                source.convert("RGB"),
                (width, height),
                method=Image.Resampling.LANCZOS,
                centering=(0.5, 0.31),
            )
            save_webp(cropped, GENERATED / f"avatar-{width}.webp", 82)
            if width == 528:
                cropped.save(GENERATED / "avatar-528.jpg", "JPEG", quality=86, optimize=True)


def generate_papers():
    for name in PAPERS:
        with Image.open(ROOT / "images" / name) as source:
            stem = Path(name).stem
            widths = sorted({min(width, source.width) for width in (320, 640, 960)})
            for width in widths:
                target = resized(source.convert("RGB"), width)
                save_webp(target, GENERATED / f"{stem}-{width}.webp", 92)


def generate_life():
    for path in sorted((ROOT / "images" / "life").glob("*.jpg")):
        with Image.open(path) as source:
            source = ImageOps.exif_transpose(source).convert("RGB")
            widths = sorted({min(width, source.width) for width in (320, 640, 960, 1280, source.width)})
            for width in widths:
                save_webp(
                    resized(source, width),
                    LIFE_GENERATED / f"{path.stem}-{width}.webp",
                    76,
                )


if __name__ == "__main__":
    generate_avatar()
    generate_papers()
    generate_life()
