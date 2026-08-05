import re
import unittest
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PAPERS = {
    "paper-silica-identifiability": [320, 640, 960],
    "paper-advantage-maxnorm-ac": [320, 640, 960],
    "paper-chronomem-overview": [320, 640, 960],
    "paper3-cicl-pipeline": [320, 640, 850],
    "paper2-suffix-tree": [320, 640, 678],
    "paper1-hypergraph": [320, 640, 692],
}


class ResponsiveImageAssetsTest(unittest.TestCase):
    def assert_image(self, path, image_format, width, max_bytes):
        self.assertTrue(path.exists(), path)
        with Image.open(path) as image:
            self.assertEqual(image.format, image_format)
            self.assertEqual(image.width, width)
        self.assertLessEqual(path.stat().st_size, max_bytes)

    def test_avatar_formats_dimensions_and_byte_ceilings(self):
        for width, max_bytes in ((208, 12_000), (352, 20_000), (528, 30_000)):
            self.assert_image(
                ROOT / "images" / "generated" / f"avatar-{width}.webp",
                "WEBP",
                width,
                max_bytes,
            )
        fallback = ROOT / "images" / "generated" / "avatar-528.jpg"
        self.assert_image(fallback, "JPEG", 528, 50_000)
        with Image.open(fallback) as image:
            self.assertEqual(image.size, (528, 453))

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
        self.assertEqual(len(stems), 15)
        for stem in stems:
            source = ROOT / "images" / "life" / f"{stem}.jpg"
            with Image.open(source) as image:
                expected = {min(640, image.width), min(960, image.width), min(1280, image.width), image.width}
                self.assertFalse(image.getexif(), source)
                self.assertFalse(any(key in image.info for key in ("exif", "xmp", "photoshop")), source)
            for width in expected:
                self.assert_image(
                    ROOT / "images" / "life" / "generated" / f"{stem}-{width}.webp",
                    "WEBP",
                    width,
                    320_000,
                )


if __name__ == "__main__":
    unittest.main()
