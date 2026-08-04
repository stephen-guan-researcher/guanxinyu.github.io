import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const index = read("index.html");
const life = read("life.html");
const css = read("phd-styles.css");

function elementWithClass(source, tagName, className) {
  const pattern = new RegExp(
    `<${tagName}\\b(?=[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*")[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
  );
  return source.match(pattern)?.[1] ?? "";
}

function normalizedText(fragment) {
  return fragment
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cssBlock(source, openingBrace) {
  let depth = 0;
  for (let cursor = openingBrace; cursor < source.length; cursor += 1) {
    if (source[cursor] === "{") depth += 1;
    if (source[cursor] === "}") depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, cursor);
  }
  assert.fail("CSS block must close");
}

function cssRule(source, selector, occurrence = -1) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...source.matchAll(new RegExp(`^\\s*${escapedSelector}\\s*\\{`, "gm"))];
  const match = matches.at(occurrence);
  assert.ok(match, `missing ${selector} rule`);
  return cssBlock(source, source.indexOf("{", match.index));
}

function maxWidthMedia(maxWidth) {
  const match = new RegExp(`@media\\s*\\(max-width:\\s*${maxWidth}px\\)\\s*\\{`).exec(css);
  assert.ok(match, `missing max-width: ${maxWidth}px media query`);
  return cssBlock(css, css.indexOf("{", match.index));
}

function mediaQuery(query) {
  const opening = `@media ${query} {`;
  const index = css.indexOf(opening);
  assert.notEqual(index, -1, `missing ${query} media query`);
  return cssBlock(css, css.indexOf("{", index));
}

test("the sticky profile card uses the real portrait without overlay copy", () => {
  const portrait = elementWithClass(index, "figure", "profile-photo");

  assert.match(portrait, /<img\b[^>]*src="images\/avatar\.jpg"/);
  assert.equal(
    normalizedText(portrait),
    "",
    "the profile photo should contain the image only, without dates, labels, or captions",
  );
});

test("the profile title is only the bilingual name", () => {
  const title = index.match(/<h1\b[^>]*id="profile-name"[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "";

  assert.equal(normalizedText(title), "Xinyu Guan 关鑫宇");
  assert.doesNotMatch(title, /Researcher|Alibaba|AutoResearch/);
});

test("both pages keep the navigation landmark immediately after the profile", () => {
  assert.match(
    index,
    /<div class="academic-shell">\s*<div class="sidebar-stack">\s*<aside class="profile-card"[\s\S]*?<\/aside>\s*<\/div>\s*<nav class="workspace-nav"[\s\S]*?<\/nav>\s*<aside class="news-card"[\s\S]*?<\/aside>\s*<main class="workspace-main">/,
  );
  assert.match(
    life,
    /<div class="academic-shell beyond-shell">\s*<div class="sidebar-stack">\s*<aside class="profile-card"[\s\S]*?<\/aside>\s*<\/div>\s*<nav class="workspace-nav"[\s\S]*?<\/nav>\s*<main class="workspace-main">/,
  );
  assert.doesNotMatch(life, /class="news-card"/);
});

test("desktop and narrow desktop keep Now in a right rail while compact screens stack it", () => {
  assert.match(cssRule(css, ".sidebar-stack", 0), /display:\s*contents/);
  assert.match(cssRule(css, ".profile-card", 0), /grid-area:\s*profile/);
  assert.match(cssRule(css, ".workspace-nav", 0), /grid-area:\s*nav/);
  assert.match(cssRule(css, ".news-card", 0), /grid-area:\s*now/);
  assert.match(cssRule(css, ".workspace-main", 0), /grid-area:\s*main/);
  assert.match(
    cssRule(css, ".academic-shell", 0),
    /grid-template-areas:\s*"profile nav now"\s*"profile main now"/,
  );
  assert.match(
    cssRule(css, ".beyond-shell", 0),
    /grid-template-areas:\s*"profile nav nav"\s*"profile main main"/,
  );

  const narrowDesktop = maxWidthMedia(1199);
  const tabletSidebar = cssRule(narrowDesktop, ".sidebar-stack", 0);
  assert.match(tabletSidebar, /display:\s*contents/);
  assert.match(tabletSidebar, /float:\s*none/);
  assert.match(tabletSidebar, /width:\s*auto/);
  assert.match(tabletSidebar, /position:\s*static/);
  assert.match(
    cssRule(narrowDesktop, ".academic-shell", 0),
    /grid-template-areas:\s*"profile profile"\s*"nav now"\s*"main now"/,
  );
  assert.match(
    cssRule(narrowDesktop, ".academic-shell", 0),
    /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+clamp\(160px,\s*22vw,\s*200px\)/,
  );
  assert.match(cssRule(narrowDesktop, ".academic-shell::after", 0), /display:\s*none/);
  assert.match(
    cssRule(narrowDesktop, ".workspace-nav,\n  .workspace-main", 0),
    /margin-left:\s*0/,
  );
  assert.match(cssRule(narrowDesktop, ".workspace-main"), /margin-top:\s*0/);
  const tabletNews = cssRule(narrowDesktop, ".news-card", 0);
  assert.match(tabletNews, /float:\s*none/);
  assert.match(tabletNews, /clear:\s*none/);
  assert.match(tabletNews, /width:\s*auto/);
  assert.match(tabletNews, /margin-top:\s*0/);
  assert.match(tabletNews, /position:\s*sticky/);
  assert.match(
    cssRule(narrowDesktop, ".beyond-shell", 0),
    /grid-template-areas:\s*"profile profile"\s*"nav nav"\s*"main main"/,
  );

  const compact = maxWidthMedia(840);
  assert.match(
    cssRule(compact, ".academic-shell", 0),
    /grid-template-areas:\s*"profile"\s*"nav"\s*"now"\s*"main"/,
  );
  assert.match(
    cssRule(compact, ".beyond-shell", 0),
    /grid-template-areas:\s*"profile"\s*"nav"\s*"main"/,
  );
});

test("responsive breakpoints preserve monotonic main-content width", () => {
  const clamp = (minimum, value, maximum) => Math.min(maximum, Math.max(minimum, value));
  const classicScrollbar = 17;

  const mobileMain = 600 - 24;
  const firstCompactMain = Math.min(760, 601 - 24);
  assert.ok(firstCompactMain >= mobileMain);

  const compactMain = Math.min(600, 840 - classicScrollbar - 24);
  const firstNarrowDesktop = 841;
  const narrowDesktopShell = Math.min(952, firstNarrowDesktop - classicScrollbar - 24);
  const firstNarrowDesktopMain =
    narrowDesktopShell - clamp(160, firstNarrowDesktop * 0.22, 200) - 14;
  assert.ok(
    firstNarrowDesktopMain >= compactMain,
    `main must not shrink at 840→841 (${compactMain}→${firstNarrowDesktopMain})`,
  );

  const lastNarrowDesktopMain = 952 - 200 - 14;
  const firstWide = 1200;
  const wideShell = firstWide - classicScrollbar - 32;
  const firstWideMain =
    wideShell -
    clamp(200, firstWide * 0.17, 260) -
    clamp(170, firstWide * 0.14, 230) -
    2 * clamp(18, firstWide * 0.016, 28);
  assert.ok(
    firstWideMain >= lastNarrowDesktopMain,
    `main must not shrink at 1199→1200 (${lastNarrowDesktopMain}→${firstWideMain})`,
  );
});

test("short wide viewports release the profile card from sticky positioning", () => {
  const shortWide = mediaQuery("(min-width: 1200px) and (max-height: 760px)");
  const profile = cssRule(shortWide, ".profile-card");

  assert.match(profile, /position:\s*static/);
  assert.match(profile, /top:\s*auto/);
});

test("the visual system uses the selected blue-gray research archive tokens", () => {
  for (const token of [
    "--canvas: #f3f5f7",
    "--paper: #ffffff",
    "--accent: #315f8a",
    "--accent-strong: #234a70",
    "--accent-soft: #eaf1f7",
    "--radius: 12px",
  ]) {
    assert.ok(css.toLowerCase().includes(token.toLowerCase()), `missing ${token}`);
  }

  assert.doesNotMatch(css, /#d9a7e7|#aa5eb8|#f5eafb/i);
  assert.match(css, /\.section-index\s*\{/);
  assert.match(css, /\.profile-focus-kicker\s*\{/);
  assert.match(css, /\.workspace-nav a\.active::after\s*\{/);
});

test("current research uses the approved compact three-column layout and progress strip", () => {
  const coreGrid = cssRule(css, ".research-core-grid", 0);
  const progress = cssRule(css, ".research-progress", 0);

  assert.match(coreGrid, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(progress, /display:\s*flex/);
  assert.match(progress, /background:\s*#f7f9fb/);

  const mobile = maxWidthMedia(620);
  assert.match(
    cssRule(mobile, ".research-core-grid", 0),
    /grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  );
});

test("Agent supporting copy stays readable and mobile source links remain tappable", () => {
  for (const selector of [".agent-sources", ".agent-grounding"]) {
    assert.match(cssRule(css, selector, 0), /color:\s*var\(--muted\)/);
  }
  assert.match(cssRule(css, ".agent-form input::placeholder", 0), /color:\s*var\(--muted\)/);
  assert.match(cssRule(css, ".content-card .agent-sources a", 0), /min-height:\s*24px/);
});

test("Now timeline links remain visibly distinguishable inside compact milestone cards", () => {
  const newsLink = cssRule(css, ".news-item a", 0);
  assert.match(newsLink, /color:\s*var\(--accent-strong\)/);
  assert.match(newsLink, /text-decoration:\s*underline/);
});

test("Now uses one continuous compact timeline instead of nested cards", () => {
  assert.match(cssRule(css, ".news-list", 0), /gap:\s*0/);
  const item = cssRule(css, ".news-item", 0);
  assert.match(item, /border:\s*0/);
  assert.match(item, /background:\s*transparent/);
  assert.match(cssRule(css, ".news-item + \.news-item", 0), /border-top:\s*1px solid var\(--line\)/);
});

test("single-mode Agent toolbar reserves only brand and toggle columns", () => {
  assert.match(
    cssRule(css, ".agent-toolbar", 0),
    /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+36px/,
  );
  const mobile = maxWidthMedia(600);
  assert.match(
    cssRule(mobile, ".agent-toolbar", 0),
    /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+44px/,
  );
});

test("desktop uses the selected fluid three-region shell and mobile stacks it cleanly", () => {
  assert.match(
    css,
    /\.academic-shell\s*\{[\s\S]*?width:\s*min\(1480px,\s*calc\(100% - 32px\)\)[\s\S]*?grid-template-columns:\s*clamp\(200px,\s*17vw,\s*260px\)\s+minmax\(0,\s*1fr\)\s+clamp\(170px,\s*14vw,\s*230px\)/,
  );
  assert.match(css, /@media\s*\(max-width:\s*1199px\)/);
  assert.match(css, /@media\s*\(max-width:\s*840px\)/);
  assert.doesNotMatch(css, /@media\s*\(max-width:\s*1503px\)/);
  const mobile = maxWidthMedia(600);
  assert.match(mobile, /\.academic-shell\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(mobile, /\.profile-card\s*\{[\s\S]*?position:\s*static/);
  assert.match(mobile, /\.profile-card\s*\{[^}]*border-radius:\s*(?:var\(--radius\)|12px)/);
});

test("mobile profile links retain accessible touch targets", () => {
  const mobile = maxWidthMedia(600);
  assert.match(mobile, /\.profile-links a\s*,[\s\S]*?min-height:\s*44px/);
});

test("mobile navigation keeps five visible touch targets without masking overflow", () => {
  const mobile = maxWidthMedia(600);
  const navigation = cssRule(mobile, ".workspace-nav");
  const links = cssRule(mobile, ".workspace-nav a");

  assert.match(navigation, /display:\s*grid/);
  assert.match(
    navigation,
    /grid-template-columns:\s*minmax\(44px,\s*0\.8fr\)\s*minmax\(54px,\s*1fr\)\s*minmax\(70px,\s*1\.25fr\)\s*minmax\(64px,\s*1\.15fr\)\s*minmax\(62px,\s*1\.1fr\)/,
  );
  assert.doesNotMatch(navigation, /overflow-x:\s*hidden/);
  assert.match(links, /min-width:\s*0/);
  assert.match(links, /min-height:\s*44px/);
  assert.match(links, /padding:\s*\d+px\s+\d+px/);
  assert.match(links, /font-size:\s*12px/);
  assert.match(links, /white-space:\s*nowrap/);
});

test("narrow mobile navigation preserves whole-word labels and only wraps Life Photos", () => {
  const narrow = maxWidthMedia(360);
  const shell = cssRule(narrow, ".academic-shell");
  const navigation = cssRule(narrow, ".workspace-nav");
  const links = cssRule(narrow, ".workspace-nav a");
  const lifeLink = cssRule(narrow, ".workspace-nav a:last-child");

  assert.match(shell, /width:\s*calc\(100% - 16px\)/);
  assert.match(
    navigation,
    /grid-template-columns:\s*max-content\s*max-content\s*max-content\s*max-content\s*min-content/,
  );
  assert.match(navigation, /justify-content:\s*space-between/);
  assert.match(navigation, /gap:\s*0/);
  assert.match(links, /min-width:\s*0/);
  assert.match(links, /padding:\s*4px\s+0/);
  assert.match(links, /white-space:\s*nowrap/);
  assert.match(links, /overflow-wrap:\s*normal/);
  assert.match(links, /word-break:\s*normal/);
  assert.doesNotMatch(links, /overflow-wrap:\s*anywhere|word-break:\s*break-all/);
  assert.match(lifeLink, /white-space:\s*normal/);
  assert.match(lifeLink, /overflow-wrap:\s*normal/);
  assert.match(lifeLink, /word-break:\s*normal/);
});
