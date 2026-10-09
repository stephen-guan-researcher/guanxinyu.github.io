import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const index = read("index.html");
const life = read("life.html");
const sharedCss = read("phd-styles.css");
const css = read("editorial-styles.css");
const desktop = css.split("@media")[0];

function elementWithClass(source, tagName, className) {
  const pattern = new RegExp(`<${tagName}\\b(?=[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*")[^>]*>([\\s\\S]*?)<\\/${tagName}>`);
  return source.match(pattern)?.[1] ?? "";
}
const normalizedText = (fragment) => fragment.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function cssBlock(source, openingBrace) {
  let depth = 0;
  for (let cursor = openingBrace; cursor < source.length; cursor += 1) {
    if (source[cursor] === "{") depth += 1;
    if (source[cursor] === "}") depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, cursor);
  }
  assert.fail("CSS block must close");
}
function cssRule(source, selector) {
  const rules = [...source.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((match) =>
    match[1].split(",").some((part) => part.trim() === selector || part.trim().replace(/\s+/g, " ").endsWith(` ${selector}`)),
  );
  assert.ok(rules.length > 0, `missing ${selector} rule`);
  return rules.map((match) => match[2]).join("\n");
}
function media(maxWidth) {
  const match = new RegExp(`@media\\s*\\(max-width:\\s*${maxWidth}px\\)\\s*\\{`).exec(css);
  assert.ok(match, `missing max-width: ${maxWidth}px media query`);
  return cssBlock(css, css.indexOf("{", match.index));
}
function property(rule, name) {
  const matches = [...rule.matchAll(new RegExp(`(?:^|[;\\n])\\s*${name}\\s*:\\s*([^;}]+)`, "g"))];
  return matches.at(-1)?.[1].trim() ?? "";
}
const tablet = media(840);
const mobile = media(600);
const mobileRules = desktop + tablet + mobile;

test("the editorial hero uses the real portrait without overlay copy", () => {
  const portrait = elementWithClass(index, "figure", "hero-portrait");
  assert.match(portrait, /<img\b[^>]*src="images\/generated\/avatar-528\.jpg"/);
  assert.equal(normalizedText(portrait), "", "the portrait must contain the image only");
  assert.match(cssRule(desktop, ".hero-portrait img"), /object-fit:\s*cover/);
});

test("the profile title is only the bilingual name", () => {
  const title = index.match(/<h1\b[^>]*id="profile-name"[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "";
  assert.equal(normalizedText(title), "Xinyu Guan 关鑫宇");
  assert.doesNotMatch(title, /Researcher|Alibaba|AutoResearch/);
});

test("both pages keep the navigation and contact rail before the main landmark", () => {
  for (const page of [index, life]) {
    const sidebar = elementWithClass(page, "aside", "editorial-sidebar");
    assert.match(sidebar, /<nav\b[^>]*aria-label="Primary navigation"/);
    assert.match(sidebar, /class="profile-links"/);
    assert.match(sidebar, /Ask Xinyu/);
    const main = page.match(/<main\b[^>]*class="workspace-main"[^>]*>/)?.index;
    assert.ok(main != null && page.indexOf(sidebar) < main);
    assert.doesNotMatch(sidebar, /class="profile-card"|class="news-card"|<img\b/);
  }
  assert.doesNotMatch(life, /class="news-card"/);
});

test("desktop keeps a thin fixed rail that remains reachable on short viewports", () => {
  assert.match(cssRule(desktop, ".editorial-page"), /--editorial-rail:\s*200px/);
  const rail = cssRule(desktop, ".editorial-sidebar");
  assert.equal(property(rail, "position"), "fixed");
  assert.equal(property(rail, "width"), "var(--editorial-rail)");
  assert.match(rail, /overflow-y:\s*auto/, "a fixed rail must scroll when a short viewport cannot fit its contacts");
  assert.match(rail, /border-right:\s*1px solid var\(--line\)/);
});

test("the main column fills remaining width without the retired three-region card shell", () => {
  const shell = cssRule(desktop, ".academic-shell");
  assert.equal(property(shell, "display"), "block");
  assert.equal(property(shell, "width"), "100%");
  assert.equal(property(shell, "max-width"), "none");
  const main = cssRule(desktop, ".workspace-main");
  assert.equal(property(main, "width"), "calc(100% - var(--editorial-rail))");
  assert.equal(property(main, "margin"), "0 0 0 var(--editorial-rail)");
  assert.equal(property(main, "min-width"), "0");
  assert.doesNotMatch(main, /float:\s*(?:left|right)/);
});

test("compact screens turn the rail into horizontal top navigation and release main width", () => {
  const rail = cssRule(tablet, ".editorial-sidebar");
  assert.equal(property(rail, "position"), "sticky");
  assert.equal(property(rail, "top"), "0");
  assert.equal(property(rail, "width"), "100%");
  assert.equal(property(rail, "border-right"), "0");
  assert.equal(property(cssRule(tablet, ".workspace-nav"), "flex-direction"), "row");
  assert.equal(property(cssRule(tablet, ".editorial-utilities"), "display"), "flex");
  assert.equal(property(cssRule(tablet, ".workspace-main"), "width"), "100%");
  assert.equal(property(cssRule(tablet, ".workspace-main"), "margin-left"), "0");
});

test("the visual system is white, flat, and uses restrained active navigation markers", () => {
  assert.match(cssRule(desktop, ".editorial-page"), /background:\s*#fff(?:fff)?\b/);
  assert.match(cssRule(desktop, ".content-card"), /border-radius:\s*0/);
  assert.match(cssRule(desktop, ".content-card"), /box-shadow:\s*none/);
  assert.match(cssRule(desktop, ".workspace-nav"), /backdrop-filter:\s*none/);
  assert.match(cssRule(desktop, ".workspace-nav a.active::after"), /width:\s*2px/);
  assert.match(cssRule(tablet, ".workspace-nav a.active::after"), /height:\s*1px/);
  assert.doesNotMatch(css, /#d9a7e7|#aa5eb8|#f5eafb/i);
});

test("current research retains three clear directions and stacks them on phones", () => {
  assert.match(cssRule(sharedCss.split("@media")[0], ".research-core-grid"), /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(cssRule(desktop, ".research-progress"), /background:\s*#fff(?:fff)?\b/);
  assert.equal(property(cssRule(mobile, ".research-core-grid"), "display"), "block");
  assert.equal(property(cssRule(mobile, ".research-progress"), "display"), "block");
  for (const title of ["AutoResearch", "Post-Training", "Agentic RL"]) assert.ok(index.includes(`<h3>${title}</h3>`));
});

test("Agent supporting copy stays readable and source links remain tappable outside content cards", () => {
  for (const selector of [".agent-sources", ".agent-grounding", ".agent-form input::placeholder"]) {
    assert.match(cssRule(sharedCss, selector), /color:\s*var\(--muted\)/);
  }
  const sources = cssRule(desktop, ".agent-sources a");
  assert.match(sources, /min-height:\s*24px/);
  assert.ok(parseFloat(property(sources, "font-size")) >= 12);
  assert.match(cssRule(desktop, ".agent-dialog"), /max-height:\s*calc\(100dvh/);
});

test("News and updates stays a compact collapsed archive with distinguishable links", () => {
  assert.match(index, /<details\b(?=[^>]*class="news-card")(?=[^>]*id="updates")[^>]*>\s*<summary>/);
  const opening = index.match(/<details\b(?=[^>]*id="updates")[^>]*>/)?.[0] ?? "";
  assert.doesNotMatch(opening, /\bopen\b/);
  assert.match(cssRule(sharedCss, ".news-item a"), /text-decoration:\s*underline/);
  assert.match(cssRule(desktop, ".news-list"), /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.equal(property(cssRule(mobile, ".news-list"), "display"), "block");
  assert.equal(property(cssRule(desktop, ".news-item"), "background"), "none");
});

test("the single-mode Agent toolbar keeps brand and accessible toggle controls", () => {
  assert.match(cssRule(sharedCss.split("@media")[0], ".agent-toolbar"), /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+36px/);
  const sourceMatch = /@media\s*\(max-width:\s*600px\)\s*\{/.exec(sharedCss);
  assert.ok(sourceMatch);
  const sharedMobile = cssBlock(sharedCss, sharedCss.indexOf("{", sourceMatch.index));
  assert.match(cssRule(sharedMobile, ".agent-toolbar"), /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+44px/);
  assert.match(index, /data-agent-toggle[^>]*aria-expanded="false"/);
});

test("illustrated paper rows preserve uncropped figures and stack image before text on phones", () => {
  assert.match(cssRule(desktop, ".publication-card"), /grid-template-columns:\s*40%\s+minmax\(0,\s*1fr\)/);
  assert.equal(property(cssRule(desktop, ".publication-card"), "grid-template-rows"), "auto",
    "the row must reset legacy multi-track metadata placement instead of reserving blank grid rows");
  const images = cssRule(desktop, ".publication-card-figure img");
  assert.equal(property(images, "object-fit"), "contain");
  assert.equal(property(images, "height"), "auto");
  assert.match(cssRule(mobile, ".publication-card"), /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.equal(property(cssRule(mobile, ".publication-card-figure picture"), "max-height"), "230px",
    "the picture wrapper must not clip a taller mobile image");
  assert.equal(property(cssRule(mobile, ".publication-card-figure img"), "max-height"), "230px");
  assert.match(cssRule(desktop, ".publication-card-no-image"), /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  for (const card of index.match(/<article\b[^>]*class="[^"]*\bpublication-card\b[^"]*"[^>]*>[\s\S]*?<\/article>/g) ?? []) {
    if (card.includes('class="publication-card-figure"')) assert.ok(card.indexOf('class="publication-card-figure"') < card.indexOf('class="publication-body"'));
    assert.doesNotMatch(card, /publication-thumb-text/);
  }
});

test("the phone hero keeps a compact 104px portrait and full-width supporting copy", () => {
  assert.match(cssRule(mobile, ".editorial-hero"), /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+104px/);
  assert.equal(property(cssRule(mobile, ".hero-portrait"), "width"), "104px");
  assert.match(cssRule(mobile, ".hero-lead"), /grid-column:\s*1\s*\/\s*-1/);
  assert.match(cssRule(mobile, ".hero-focus"), /grid-column:\s*1\s*\/\s*-1/);
});

test("mobile navigation preserves five whole-word touch targets without masking overflow", () => {
  const navigation = cssRule(mobileRules, ".workspace-nav");
  const links = cssRule(mobileRules, ".workspace-nav a");
  assert.equal(property(navigation, "overflow-x"), "auto");
  assert.ok(parseFloat(property(links, "min-height")) >= 44);
  assert.equal(property(links, "white-space"), "nowrap");
  assert.equal(property(links, "flex-shrink"), "0");
  assert.doesNotMatch(links, /overflow-wrap:\s*anywhere|word-break:\s*break-all/);
  for (const page of [index, life]) assert.equal((elementWithClass(page, "nav", "workspace-nav").match(/<a\b/g) ?? []).length, 5);
});

test("mobile contact and Agent controls retain accessible touch targets and readable type", () => {
  for (const selector of [".profile-links a", ".profile-links button", ".editorial-agent-link"]) {
    const rule = cssRule(mobileRules, selector);
    assert.ok(parseFloat(property(rule, "min-height")) >= 44, `${selector} needs a 44px touch target`);
    assert.ok(parseFloat(property(rule, "font-size")) >= 12, `${selector} needs readable supporting type`);
  }
  assert.ok(parseFloat(property(cssRule(mobileRules, ".site-footer"), "font-size")) >= 12);
});

test("motion-sensitive visitors get motion-free editorial interactions", () => {
  const match = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/.exec(css);
  assert.ok(match);
  const reduced = cssBlock(css, css.indexOf("{", match.index));
  assert.match(reduced, /scroll-behavior:\s*auto/);
  assert.match(reduced, /transition:\s*none/);
});
