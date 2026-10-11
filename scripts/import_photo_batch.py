"""Prepare web copies without modifying camera originals or publishing EXIF data."""

import argparse
import io
import json
from pathlib import Path

from PIL import Image, ImageCms, ImageOps

from generate_responsive_images import ROOT, generate_avatar, generate_life


def rgb_copy(path):
    with Image.open(path) as original:
        image = ImageOps.exif_transpose(original).copy()
        profile = original.info.get("icc_profile")
        if profile:
            image = ImageCms.profileToProfile(
                image,
                ImageCms.ImageCmsProfile(io.BytesIO(profile)),
                ImageCms.createProfile("sRGB"),
                outputMode="RGB",
            )
        else:
            image = image.convert("RGB")
        image.info.clear()
        return image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--avatar", type=Path, required=True)
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text())
    source_root = args.source_dir.resolve(strict=True)
    destinations = []
    for photo in manifest["photos"]:
        source = (source_root / photo["source"]).resolve(strict=True)
        if source.parent != source_root:
            raise ValueError("Each source must belong to the supplied photo directory")
        name = photo["name"]
        if Path(name).name != name or not name.endswith(".jpg"):
            raise ValueError("Each web filename must be a simple .jpg filename")
        destination = ROOT / "images" / "life" / name
        if destination.exists():
            raise FileExistsError(destination)
        destinations.append((photo, source, destination))

    portrait_path = ROOT / "images" / "avatar-20261011.jpg"
    if portrait_path.exists():
        raise FileExistsError(portrait_path)
    portrait = rgb_copy(args.avatar)
    # A display crop around the face and upper body; no retouching or pixel synthesis.
    left, top, right, bottom = manifest["avatar_crop"]
    portrait = portrait.crop((
        round(left * portrait.width), round(top * portrait.height),
        round(right * portrait.width), round(bottom * portrait.height),
    ))
    portrait = ImageOps.fit(portrait, (1024, 1024), method=Image.Resampling.LANCZOS)
    portrait.save(portrait_path, "JPEG", quality=90, optimize=True)

    result = []
    for photo, source, destination in destinations:
        image = rgb_copy(source)
        image.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, "JPEG", quality=82, optimize=True, progressive=True)
        result.append({
            "name": photo["name"], "width": image.width, "height": image.height,
            "bytes": destination.stat().st_size,
        })
    generate_avatar()
    generate_life({Path(photo["name"]).stem for photo in manifest["photos"]})
    print(json.dumps({"photos": result}, indent=2))


if __name__ == "__main__":
    main()
