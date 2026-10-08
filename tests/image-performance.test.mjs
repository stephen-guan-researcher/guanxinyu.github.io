import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync, statSync } from "node:fs";

const asset = (path) => new URL(`../${path}`, import.meta.url);

const tags = (html, name) => html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
const attribute = (tag, name) => tag?.match(new RegExp(`\\s${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"))?.[2];
const normalizeSpace = (value) => (value ?? "").replace(/\s+/g, " ").trim();
const srcsetCandidates = (source) => (attribute(source, "srcset") ?? "")
  .split(",").map(normalizeSpace);

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
    "paper-timbre-overview": [320, 640, 960],
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
const releaseToken = "20261008-editorial-1";

test("homepage uses the prioritized responsive portrait while Life keeps gallery-only images", () => {
  const portraits = tags(index, "img").filter((tag) => attribute(tag, "src") === "images/generated/avatar-528.jpg");
  assert.equal(portraits.length, 1, "homepage must retain one real hero portrait");
  const portrait = portraits[0];
  assert.equal(attribute(portrait, "width"), "528");
  assert.equal(attribute(portrait, "height"), "453");
  assert.equal(attribute(portrait, "fetchpriority"), "high");
  assert.equal(attribute(portrait, "decoding"), "async");
  assert.notEqual(attribute(portrait, "loading"), "lazy");

  const source = tags(index, "source").find((tag) => attribute(tag, "srcset")?.includes("avatar-208.webp"));
  assert.ok(source, "homepage portrait must retain its responsive source");
  assert.equal(attribute(source, "type"), "image/webp");
  assert.deepEqual(srcsetCandidates(source), [208, 352, 528].map((width) => `images/generated/avatar-${width}.webp ${width}w`));
  assert.equal(normalizeSpace(attribute(source, "sizes")), "(max-width: 600px) 104px, (max-width: 1000px) 180px, 280px");
  assert.doesNotMatch(life, /images\/generated\/avatar-/);
  assert.equal(tags(life, "img").length, 18, "Life must not fetch an additional profile portrait");
});

test("publication figures are responsive and lazy", () => {
  const figures = (index.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi) ?? []).filter((figure) =>
    (attribute(tags(figure, "figure")[0], "class") ?? "").split(/\s+/).includes("publication-card-figure"),
  );
  assert.equal(figures.length, 6);
  for (const figure of figures) {
    assert.equal(tags(figure, "picture").length, 1);
    const sources = tags(figure, "source");
    assert.equal(sources.length, 1);
    assert.equal(attribute(sources[0], "type"), "image/webp");
    const images = tags(figure, "img");
    assert.equal(images.length, 1);
    assert.equal(attribute(images[0], "loading"), "lazy");
    assert.equal(attribute(images[0], "decoding"), "async");
    assert.ok(Number(attribute(images[0], "width")) > 0);
    assert.ok(Number(attribute(images[0], "height")) > 0);
  }

  const candidates = {
    "paper-silica-identifiability": [320, 640, 960],
    "paper-advantage-maxnorm-ac": [320, 640, 960],
    "paper-timbre-overview": [320, 640, 960],
    "paper3-cicl-pipeline": [320, 640, 850],
    "paper2-suffix-tree": [320, 640, 678],
    "paper1-hypergraph": [320, 640, 692],
  };
  for (const [stem, widths] of Object.entries(candidates)) {
    const figure = figures.find((entry) => entry.includes(`images/generated/${stem}-`));
    assert.ok(figure, `${stem} must keep its own responsive figure`);
    const source = tags(figure, "source")[0];
    assert.deepEqual(srcsetCandidates(source), widths.map((width) => `images/generated/${stem}-${width}.webp ${width}w`));
    assert.equal(attribute(tags(figure, "img")[0], "src"), `images/${stem}.png`, `${stem} must retain its real figure fallback`);
    assert.equal(normalizeSpace(attribute(source, "sizes")), "(max-width: 600px) calc(100vw - 40px), (max-width: 1150px) 220px, 40vw");
  }
});

test("Life Photos retain all eighteen original fallbacks in their established order", () => {
  const expected = [
    "life-road-red-shirt", "life-camera-portrait", "life-jellyfish-aquarium",
    "glasgow-graduation-group", "glasgow-bute-hall-night", "glasgow-graduation-portrait",
    "glasgow-arches-portrait", "glasgow-graduation-contact-sheet", "glasgow-graduation-reception",
    "glasgow-graduation-friends", "ntu-campus", "seaside-cafe", "red-pavilion-portrait",
    "ninghai-swing-seated", "ninghai-swing-front", "beach-walk", "garden-rabbit", "coastal-temple",
  ];
  assert.deepEqual(tags(life, "img").map((image) => attribute(image, "src")), expected.map((stem) => `images/life/${stem}.jpg`));
  for (const stem of expected) assert.equal(existsSync(asset(`images/life/${stem}.jpg`)), true);
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

test("Life Photo sizes match every final mosaic slot without crossing image tiers", () => {
  const tiles = [...life.matchAll(/<figure class="([^"]*\blife-tile\b[^"]*)">([\s\S]*?)<\/figure>/g)];
  assert.equal(tiles.length, 18);

  for (const [, className, tile] of tiles) {
    const isLead = className.includes("life-tile--lead");
    const isWide = className.includes("life-tile--wide");
    const isOpeningPortrait = className.includes("life-tile--opening-portrait");
    const isLandscape = className.includes("life-tile--landscape");
    const phone = isLead || isWide ? "320px" : "160px";
    const largerMobile = isLead || isWide ? "calc(100vw - 62px)" : "calc(50vw - 32px)";
    const compact = isLead ? "361px" : isWide ? "270px" : "179px";
    const tablet = isLead ? "596px" : isWide ? "448px" : "297px";
    const desktop = isLead ? "756px" : isWide ? "568px" : isOpeningPortrait || isLandscape ? "378px" : "284px";
    const expected = `(max-width: 420px) ${phone}, (max-width: 600px) ${largerMobile}, (max-width: 840px) ${compact}, (max-width: 1199px) ${tablet}, ${desktop}`;
    const escapedExpected = expected.replace(/[().]/g, "\\$&");
    assert.match(tile, new RegExp(`sizes="${escapedExpected}"`), `${className} must describe its complete final slot ladder`);
  }
});

test("both pages use the release cache token for changed CSS and JavaScript", () => {
  for (const page of [index, life]) {
    const stylesheets = tags(page, "link").filter((tag) => attribute(tag, "rel") === "stylesheet");
    const siteStylesheets = stylesheets.filter((tag) => /^(?:phd|editorial)-styles\.css(?:\?|$)/.test(attribute(tag, "href") ?? ""));
    assert.deepEqual(siteStylesheets.map((tag) => attribute(tag, "href")), [
      `phd-styles.css?v=${releaseToken}`,
      `editorial-styles.css?v=${releaseToken}`,
    ], "both pages must load the base skin before the release-matched editorial overrides");
    const scripts = tags(page, "script").filter((tag) => /^phd-main\.js(?:\?|$)/.test(attribute(tag, "src") ?? ""));

    assert.equal(scripts.length, 1, "page must load the changed JavaScript through one script element");
    assert.equal(attribute(scripts[0], "src"), `phd-main.js?v=${releaseToken}`);
    assert.equal(attribute(scripts[0], "type"), "module");
    assert.doesNotMatch(page, /20260806-profile-release-2|20261008-publications-1/);
  }
});
