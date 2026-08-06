import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync, statSync } from "node:fs";

const asset = (path) => new URL(`../${path}`, import.meta.url);

function assertWebP(path, maxBytes) {
  assert.equal(existsSync(asset(path)), true, `${path} must exist`);
  const bytes = readFileSync(asset(path));
  assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
  assert.ok(statSync(asset(path)).size <= maxBytes, `${path} must be <= ${maxBytes} bytes`);
}

test("responsive avatar variants are real compact WebP assets", () => {
  assertWebP("images/generated/avatar-208.webp", 12_000);
  assertWebP("images/generated/avatar-352.webp", 20_000);
  assertWebP("images/generated/avatar-528.webp", 30_000);
  assert.equal(existsSync(asset("images/generated/avatar-528.jpg")), true);
});

test("every visual publication has correctly labelled responsive WebP variants", () => {
  const variants = {
    "paper-silica-identifiability": [320, 640, 960],
    "paper-advantage-maxnorm-ac": [320, 640, 960],
    "paper-chronomem-overview": [320, 640, 960],
    "paper3-cicl-pipeline": [320, 640, 850],
    "paper2-suffix-tree": [320, 640, 678],
    "paper1-hypergraph": [320, 640, 692],
  };
  for (const [stem, widths] of Object.entries(variants)) {
    for (const width of widths) {
      assertWebP(`images/generated/${stem}-${width}.webp`, 90_000);
    }
  }
});

test("every current Life Photo has compact 320-pixel and 640-pixel WebP variants", () => {
  const life = readFileSync(asset("life.html"), "utf8");
  const stems = [...life.matchAll(/src="images\/life\/([^\"]+)\.jpg"/g)]
    .map((match) => match[1]);
  assert.equal(new Set(stems).size, 18);
  for (const stem of new Set(stems)) {
    assertWebP(`images/life/generated/${stem}-320.webp`, 100_000);
    assertWebP(`images/life/generated/${stem}-640.webp`, 180_000);
  }
});

test("Life Photo JPEG fallbacks expose no private metadata blocks", () => {
  const life = readFileSync(asset("life.html"), "utf8");
  const stems = [...life.matchAll(/src="images\/life\/([^\"]+)\.jpg"/g)]
    .map((match) => match[1]);
  const signatures = [
    Buffer.from("Exif\0\0", "binary"),
    Buffer.from("http://ns.adobe.com/xap/1.0/", "ascii"),
    Buffer.from("Photoshop 3.0", "ascii"),
  ];
  for (const stem of new Set(stems)) {
    const bytes = readFileSync(asset(`images/life/${stem}.jpg`));
    for (const signature of signatures) {
      assert.equal(bytes.includes(signature), false, `${stem}.jpg must be metadata-free`);
    }
  }
});

const index = readFileSync(asset("index.html"), "utf8");
const life = readFileSync(asset("life.html"), "utf8");

test("both pages use the prioritized responsive avatar", () => {
  for (const page of [index, life]) {
    assert.match(page, /avatar-208\.webp 208w,\s*images\/generated\/avatar-352\.webp 352w,\s*images\/generated\/avatar-528\.webp 528w/);
    assert.match(page, /src="images\/generated\/avatar-528\.jpg"[^>]*width="528"[^>]*height="453"[^>]*fetchpriority="high"[^>]*decoding="async"/);
  }
});

test("publication figures are responsive and lazy", () => {
  const figures = index.match(/<figure class="publication-card-figure">[\s\S]*?<\/figure>/g) ?? [];
  assert.equal(figures.length, 6);
  for (const figure of figures) {
    assert.match(figure, /<picture>/);
    assert.match(figure, /type="image\/webp"/);
    assert.match(figure, /loading="lazy"/);
    assert.match(figure, /decoding="async"/);
    assert.match(figure, /\bwidth="\d+"/);
    assert.match(figure, /\bheight="\d+"/);
  }

  const candidates = {
    "paper-silica-identifiability": [320, 640, 960],
    "paper-advantage-maxnorm-ac": [320, 640, 960],
    "paper-chronomem-overview": [320, 640, 960],
    "paper3-cicl-pipeline": [320, 640, 850],
    "paper2-suffix-tree": [320, 640, 678],
    "paper1-hypergraph": [320, 640, 692],
  };
  for (const [stem, widths] of Object.entries(candidates)) {
    const figure = figures.find((entry) => entry.includes(`images/generated/${stem}-`));
    assert.ok(figure, `${stem} must keep its own responsive figure`);
    for (const width of widths) {
      assert.match(figure, new RegExp(`${stem}-${width}\\.webp ${width}w`));
    }
    assert.match(figure, /sizes="\(max-width: 600px\) calc\(100vw - 90px\), \(max-width: 1199px\) 124px, 148px"/);
  }
});

test("Life Photos keep one prioritized gallery image and seventeen lazy images", () => {
  const gallery = life.match(/<section class="life-gallery"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.equal((gallery.match(/fetchpriority="high"/g) ?? []).length, 1);
  assert.equal((gallery.match(/loading="lazy"/g) ?? []).length, 17);
  const pictures = gallery.match(/<picture>[\s\S]*?<\/picture>/g) ?? [];
  assert.equal(pictures.length, 18);
  for (const picture of pictures) {
    const stem = picture.match(/src="images\/life\/([^\"]+)\.jpg"/)?.[1];
    const sourceWidth = Number(picture.match(/\bwidth="(\d+)"/)?.[1]);
    assert.ok(stem && sourceWidth, "every Life picture must retain its JPEG fallback dimensions");
    const widths = new Set([Math.min(320, sourceWidth), Math.min(640, sourceWidth), Math.min(960, sourceWidth), Math.min(1280, sourceWidth), sourceWidth]);
    for (const width of widths) {
      assert.match(picture, new RegExp(`${stem}-${width}\\.webp ${width}w`));
    }
  }
});

test("Life Photo tablet sizes respect the capped 600-pixel shell", () => {
  const tiles = [...life.matchAll(/<figure class="([^"]*\blife-tile\b[^"]*)">([\s\S]*?)<\/figure>/g)];
  assert.equal(tiles.length, 18);

  for (const [, className, tile] of tiles) {
    const expectedWidth = className.includes("life-tile--lead")
      ? 361
      : className.includes("life-tile--wide")
        ? 270
        : 179;
    assert.match(
      tile,
      new RegExp(`sizes="[^\"]+, \\(max-width: 840px\\) ${expectedWidth}px,`),
      `${className} must use its capped 800px tablet slot width`,
    );
  }
});

test("Life Photo mobile source hints use browser-compatible DPR-two payload caps", () => {
  const tiles = [...life.matchAll(/<figure class="([^"]*\blife-tile\b[^"]*)">([\s\S]*?)<\/figure>/g)];
  assert.equal(tiles.length, 18);

  for (const [, className, tile] of tiles) {
    const expectedSize = className.includes("life-tile--lead") || className.includes("life-tile--wide")
      ? "320px"
      : "160px";
    assert.match(
      tile,
      new RegExp(`sizes="\\(max-width: 600px\\) ${expectedSize},`),
      `${className} must cap its mobile source hint before the DPR-two selection`,
    );
  }
});

test("both pages use the release cache token for changed CSS and JavaScript", () => {
  for (const page of [index, life]) {
    assert.match(page, /href="phd-styles\.css\?v=20260806-life-mosaic-1"/);
    assert.match(page, /src="phd-main\.js\?v=20260806-life-mosaic-1"/);
  }
});
