import re
import unittest
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PAPERS = {
    "paper-figure-pending-background": [320, 640, 960],
    "paper-nominate-adjudicate-overview": [320, 640, 960],
    "paper-vla-early-exit": [320, 640, 960],
    "paper-lora-attribution": [320, 640, 960],
    "paper-qeschunker-overview": [320, 640, 960],
    "paper-silica-identifiability": [320, 640, 960],
    "paper-advantage-maxnorm-ac": [320, 640, 960],
    "paper-timbre-overview": [320, 640, 960],
    "paper3-cicl-pipeline": [320, 640, 850],
    "paper2-suffix-tree": [320, 640, 678],
    "paper1-hypergraph": [320, 640, 692],
}
AVATAR_STEM = "avatar-20261011"


class ResponsiveImageAssetsTest(unittest.TestCase):
    def assert_image(self, path, image_format, width, max_bytes):
        self.assertTrue(path.exists(), path)
        with Image.open(path) as image:
            self.assertEqual(image.format, image_format)
            self.assertEqual(image.width, width)
        self.assertLessEqual(path.stat().st_size, max_bytes, path)

    def assert_metadata_free(self, path):
        with Image.open(path) as image:
            self.assertFalse(image.getexif(), path)
            self.assertFalse(any(key in image.info for key in ("exif", "xmp", "photoshop", "icc_profile")), path)

    def test_avatar_formats_dimensions_and_byte_ceilings(self):
        for width, max_bytes in ((208, 12_000), (352, 20_000), (528, 30_000)):
            self.assert_image(
                ROOT / "images" / "generated" / f"{AVATAR_STEM}-{width}.webp",
                "WEBP",
                width,
                max_bytes,
            )
            variant = ROOT / "images" / "generated" / f"{AVATAR_STEM}-{width}.webp"
            self.assert_metadata_free(variant)
            with Image.open(variant) as image:
                self.assertEqual(image.size, (width, width))
        fallback = ROOT / "images" / "generated" / f"{AVATAR_STEM}-528.jpg"
        self.assert_image(fallback, "JPEG", 528, 50_000)
        self.assert_metadata_free(fallback)
        with Image.open(fallback) as image:
            self.assertEqual(image.size, (528, 528))
        source = ROOT / "images" / f"{AVATAR_STEM}.jpg"
        self.assert_metadata_free(source)
        with Image.open(source) as image:
            self.assertEqual(image.size, (1024, 1024))

    def test_publication_filename_widths_match_intrinsic_widths(self):
        for stem, widths in PAPERS.items():
            for width in widths:
                self.assert_image(
                    ROOT / "images" / "generated" / f"{stem}-{width}.webp",
                    "WEBP",
                    width,
                    90_000,
                )

    def test_life_tiers_and_metadata(self):
        html = (ROOT / "life.html").read_text()
        stems = set(re.findall(r'src="images/life/([^\"]+)\.jpg"', html))
        self.assertEqual(len(stems), 33)
        for stem in stems:
            source = ROOT / "images" / "life" / f"{stem}.jpg"
            with Image.open(source) as image:
                expected = {min(320, image.width), min(640, image.width), min(960, image.width), min(1280, image.width), image.width}
            self.assert_metadata_free(source)
            for width in expected:
                variant = ROOT / "images" / "life" / "generated" / f"{stem}-{width}.webp"
                self.assert_image(
                    variant,
                    "WEBP",
                    width,
                    320_000,
                )
                self.assert_metadata_free(variant)

    def test_life_markup_dimensions_and_srcset_match_fallbacks(self):
        html = (ROOT / "life.html").read_text()
        pictures = re.findall(r"<picture>.*?</picture>", html, re.DOTALL)
        self.assertEqual(len(pictures), 33)
        for picture in pictures:
            tag = re.search(r"<img\b[^>]*>", picture).group()
            attributes = dict(re.findall(r'([\w-]+)="([^"]*)"', tag))
            source = ROOT / attributes["src"]
            with Image.open(source) as image:
                self.assertEqual((int(attributes["width"]), int(attributes["height"])), image.size, source)
                expected = sorted({min(width, image.width) for width in (320, 640, 960, 1280, image.width)})
            declared = re.search(r'srcset="([^"]+)"', picture).group(1)
            candidates = [candidate.strip() for candidate in declared.split(",")]
            self.assertEqual(candidates, [f"images/life/generated/{source.stem}-{width}.webp {width}w" for width in expected])


if __name__ == "__main__":
    unittest.main()
