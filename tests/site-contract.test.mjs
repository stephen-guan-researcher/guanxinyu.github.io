import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const index = read("index.html");
const css = read("phd-styles.css");
const editorialCss = existsSync(new URL("../editorial-styles.css", import.meta.url)) ? read("editorial-styles.css") : "";
const editorialBase = editorialCss.split("@media")[0];
const behavior = read("phd-main.js");
const lifeExists = existsSync(new URL("../life.html", import.meta.url));
const life = lifeExists ? read("life.html") : "";
const releaseToken = "20261008-editorial-8";

function assertReleaseAssets(page) {
  const stylesheet = (page.match(/<link\b[^>]*>/g) ?? []).find((tag) =>
    /\brel="stylesheet"/.test(tag) && /\bhref="phd-styles\.css\?v=/.test(tag),
  );
  const script = (page.match(/<script\b[^>]*>/g) ?? []).find((tag) =>
    /\bsrc="phd-main\.js\?v=/.test(tag),
  );

  assert.ok(stylesheet, "page must load the shared stylesheet through a link element");
  assert.ok(script, "page must load the shared behavior through a script element");
  assert.match(stylesheet, new RegExp(`\\bhref="phd-styles\\.css\\?v=${releaseToken}"`));
  assert.match(page, new RegExp(`<link\\b(?=[^>]*\\brel="stylesheet")(?=[^>]*\\bhref="editorial-styles\\.css\\?v=${releaseToken}")[^>]*>`));
  assert.match(script, new RegExp(`\\bsrc="phd-main\\.js\\?v=${releaseToken}"`));
  assert.match(script, /\btype="module"/);
  assert.doesNotMatch(page, /20260806-profile-release-2/);
}

function assertInOrder(source, values) {
  let cursor = -1;
  for (const value of values) {
    const next = source.indexOf(value, cursor + 1);
    assert.ok(next > cursor, `${value} must appear after the previous navigation label`);
    cursor = next;
  }
}

test("both pages expose the five approved destinations in order", () => {
  const homeNavigation = [
    ["About", "#home"],
    ["Experience", "#experience"],
    ["Research", "#research"],
    ["Publications", "#papers"],
    ["Life Photos", "life.html"],
  ];
  const lifeNavigation = [
    ["About", "index.html#home"],
    ["Experience", "index.html#experience"],
    ["Research", "index.html#research"],
    ["Publications", "index.html#papers"],
    ["Life Photos", "life.html"],
  ];

  assertInOrder(index, homeNavigation.map(([label]) => `>${label}<`));
  assertInOrder(life, lifeNavigation.map(([label]) => `>${label}<`));
  for (const [label, href] of homeNavigation) {
    assert.match(index, new RegExp(`href="${href.replace(".", "\\.")}"[^>]*>${label}<`));
  }
  for (const [label, href] of lifeNavigation) {
    assert.match(life, new RegExp(`href="${href.replace(".", "\\.")}"[^>]*>${label}<`));
  }
  assert.doesNotMatch(index + life, />Beyond</);
  assert.match(life, /aria-current="page"[^>]*>Life Photos</);
});

test("homepage keeps the approved career-first semantic sections in order", () => {
  const sectionIds = [...index.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(sectionIds, ["home", "experience", "papers", "research", "about", "research-experience", "education"]);
  for (const [id, title] of [
    ["experience", "Work experience"], ["papers", "Publications &amp; Manuscripts"],
    ["research", "Current research"], ["research-experience", "Research experience"], ["education", "Education"],
  ]) {
    assert.match(contentSection(id), new RegExp(`<h2[^>]*>${title}<\\/h2>`));
  }
  assert.doesNotMatch(index, /class="section-index"/);
});

test("both pages use the approved editorial skin and retain a compact Updates archive", () => {
  assert.match(index, /class="[^"]*\beditorial-page\b/);
  assert.match(life, /class="[^"]*\beditorial-page\b/);
  assert.match(index, /<details\b[^>]*class="news-card"[^>]*id="updates"/);
  assert.match(index, /<summary[^>]*>[\s\S]*?<span id="news-title">News &amp; updates<\/span>[\s\S]*?<\/summary>/);

  for (const page of [index, life]) {
    assertReleaseAssets(page);
  }
});

test("Now presents the verified 2026 milestones as a reverse-chronological timeline", () => {
  const news = index.match(/<details\b[^>]*class="news-card"[\s\S]*?<\/details>/)?.[0] ?? "";
  const items = news.match(/<article class="news-item">[\s\S]*?<\/article>/g) ?? [];
  const dates = [...news.matchAll(/<time datetime="([^"]+)">/g)].map((match) => match[1]);

  assert.equal(items.length, 9, "Now must expose nine concise milestone cards");
  assert.deepEqual(dates, ["2026-10", "2026-10", "2026-09", "2026-09", "2026-08", "2026-08", "2026-07", "2026-06", "2026-02"]);
  for (const status of ["Accepted", "Preparing", "Updated", "Submitted", "Preprint", "Career"]) {
    assert.match(news, new RegExp(`<span>${status}<\\/span>`));
  }
  assert.match(
    items[4],
    /Decision-Aware Memory Cards was accepted for publication in the Springer CCIS proceedings of ICONIP 2026\./,
  );
  assert.match(items[4], /href="https:\/\/arxiv\.org\/abs\/2606\.08151"[^>]*target="_blank"[^>]*rel="noopener"/);
  assert.match(items[0], /Preparing[\s\S]*PIVOT[\s\S]*for CVPR/);
  assert.match(items[1], /TIMBRE[\s\S]*first-author[\s\S]*ICASSP 2027/);
  assert.match(items[2], /Three ICLR 2027 submissions/);
  assert.match(items[3], /ICONIP 2026 camera-ready/);
  assert.ok(news.indexOf("Decision-Aware Memory Cards was accepted") < news.indexOf("Submitted SILICA"));
  assert.match(news, /August 2026 ACL ARR cycle, with EACL as the preferred venue/);
  assert.doesNotMatch(news, /Preparing an ICASSP 2027 manuscript/);
  assert.match(news, /Submitted Advantage Scale Calibration to AAAI 2027/);
  assert.match(news, /href="#experience"/);
});

test("profile page preserves the approved identity and real assets", () => {
  for (const text of [
    "Xinyu Guan",
    "关鑫宇",
    "AI Agent Researcher",
    "AutoResearch",
    "Post-Training",
    "Agentic RL",
    "Xianyu Multimodal Quality Inspection",
    "TaoTian Group @ Alibaba",
    "University of Glasgow",
  ]) {
    assert.ok(index.includes(text), `index.html must retain ${text}`);
  }
  assert.match(index, /images\/generated\/avatar-528\.jpg/);
  for (const image of ["paper1-hypergraph.png", "paper2-suffix-tree.png"]) {
    assert.equal(
      existsSync(new URL(`../images/${image}`, import.meta.url)),
      true,
      `${image} must remain present`,
    );
  }
});

test("homepage About Me reflects approved AI-agent and foundation-model work", () => {
  const about = contentSection("about");

  assert.match(about, /I research and build reliable AI agents/);
  assert.match(about, /At <strong>TaoTian Group @ Alibaba<\/strong>, my current work focuses on <strong>AI agent research<\/strong>/);
  assert.match(about, /<strong>Hunyuan Foundation Model<\/strong>/);
  assert.match(about, /<strong>Yuanbao AI Search<\/strong>/);
  assert.match(about, /<strong>ERNIE Bot 5 \(EB5\) Foundation Model<\/strong>/);
  assert.match(about, /<strong>knowledge graphs<\/strong>/);
  assert.match(about, /<strong>LLM-based security<\/strong>/);
});

test("verified public metadata and profile wording stay synchronized", () => {
  assert.match(index, /University of Glasgow professor and University of Oxford graduate/);
  assert.match(index, /AI Agent research spanning General AutoResearch and multimodal quality inspection for Xianyu\./);
  assert.doesNotMatch(index, /AI Agent research across AutoResearch, post-training, and agentic RL, applied in Xianyu AI systems/);
  assert.doesNotMatch(index, /Xianyu AI agents for photo-compliance detection and physical-defect inspection/);
  assert.match(contentSection("about"), /apply these ideas in <strong>Xianyu AI systems<\/strong>/);
  assert.match(contentSection("research"), /Xianyu AI as a practical application domain/);
  assert.match(
    contentSection("experience"),
    /AI Agent research spanning General AutoResearch and multimodal quality inspection for Xianyu\./,
  );
  assert.match(contentSection("experience"), /Mathematical and biomedical capability enhancement/);
  assert.match(contentSection("experience"), /training time <strong>30%<\/strong> lower/);
  assert.match(index, /<strong>Xinyu Guan<\/strong>, Zhirong Zhang, Hongyuan Liu, Pengcheng Xu, Yu Sun, Chen Song, Qianyang Zhao/);

  const textSearch = cardWithText(
    "publication-card",
    "Optimizing Text Search: A Novel Pattern Matching Algorithm Based on Ukkonen's Approach",
  );
  assert.ok(textSearch);
  assert.match(textSearch, /class="status-label">Preprint/);
  assert.match(textSearch, /<strong>Xinyu Guan<\/strong>, Shaohua Zhang/);
  assert.match(textSearch, /arXiv:2512\.16927 \[cs\.DS\] · Nov 2025/);
  assert.match(textSearch, /href="https:\/\/arxiv\.org\/abs\/2512\.16927"/);

  const hypergraph = cardWithText(
    "publication-card",
    "Basket-Enhanced Heterogenous Hypergraph for Price-Sensitive Next Basket Recommendation",
  );
  assert.ok(hypergraph);
  assert.match(hypergraph, /class="status-label">Published/);
  assert.match(hypergraph, /ICASSP 2025 · Apr 2025/);
  assert.match(hypergraph, /Yuening Zhou, Yulin Wang, Qian Cui, <strong>Xinyu Guan<\/strong>, Francisco Cisternas/);
  assert.match(hypergraph, /href="https:\/\/doi\.org\/10\.1109\/ICASSP49660\.2025\.10887705"/);
  assert.match(hypergraph, /<a\b(?=[^>]*href="https:\/\/arxiv\.org\/abs\/2409\.11695")(?=[^>]*class="publication-inline-link")(?=[^>]*target="_blank")(?=[^>]*rel="noopener")[^>]*>arXiv<\/a>/);
  assert.match(cssRule(css, ".publication-inline-link"), /position:\s*relative[\s\S]*z-index:\s*2/);

  assert.doesNotMatch(behavior, /Answered by Llama 3\.2/);
  assert.match(behavior, /Answered by \$\{formatAgentModelName\(reply\.model\)\} through Workers AI/);

  assert.doesNotMatch(index, /Evaluation and Optimization of Efficient Text Search Algorithms/);
  assert.doesNotMatch(index, /Price-Aware Dynamic Heterogeneous Hypergraph Network/);
  assert.doesNotMatch(index, /Alibaba Experience/);
  assert.doesNotMatch(index, /Biomedical domain enhancement|processing time <strong>30%<\/strong> lower/);
});

test("Xinyu Agent lives in a closed accessible dialog with a compact answer panel", () => {
  const dialog = agentDialog();
  const agent = dialog.match(/<aside\b[^>]*class="xinyu-agent"[\s\S]*?<\/aside>/)?.[0] ?? "";

  assert.ok(agent, "the dialog must contain the Xinyu Agent card");
  assert.doesNotMatch(dialog.match(/^<dialog\b[^>]*>/)?.[0] ?? "", /\bopen\b/);
  assert.match(dialog, /aria-labelledby="agent-dialog-title"/);
  assert.match(dialog, /<h2 id="agent-dialog-title">Ask Xinyu<\/h2>/);
  assert.match(index, /<button\b(?=[^>]*\bdata-agent-open)(?=[^>]*\baria-controls="xinyu-agent-dialog")(?=[^>]*\baria-haspopup="dialog")[^>]*>/);
  assert.match(dialog, /<button\b(?=[^>]*\bdata-agent-close)(?=[^>]*\baria-label="Close Xinyu Agent")[^>]*>/);
  assert.match(
    agent,
    /<button\b(?=[^>]*\btype="button")(?=[^>]*\bdata-agent-toggle)(?=[^>]*\baria-expanded="false")(?=[^>]*\baria-controls="xinyu-agent-panel")[^>]*>/,
  );
  assert.match(agent, /<div\b[^>]*id="xinyu-agent-panel"[^>]*\bhidden\b[^>]*>/);
  assert.match(agent, /<form\b[^>]*data-agent-form[^>]*>/);
  assert.match(agent, /<input\b[^>]*aria-label="Ask Xinyu Agent"/);
  assert.match(agent, /<button\b(?=[^>]*\btype="submit")(?=[^>]*\baria-label="Send question")[^>]*>/);
  assert.equal((agent.match(/type="button"/g) ?? []).length, 1);
  assert.doesNotMatch(agent, /Tech Demo|About Xinyu|data-agent-mode|data-agent-panel/);
  assert.match(agent, /data-agent-status/);
  assert.match(agent, /<input\b[^>]*maxlength="300"/);
  assert.doesNotMatch(agent, /<img\b|class="[^"]*\b(?:chat-)?avatar\b/i);
  assert.match(agent, /class="ri-sparkling-2-line" aria-hidden="true"/);
  assert.ok(index.indexOf(dialog) > index.indexOf("</main>"), "dialog must not interrupt the career-first reading flow");
  assert.match(life, /href="index\.html#ask-xinyu"/);
});

test("Xinyu Agent does not present a scripted profile summary as a model answer", () => {
  const agent = agentDialog();

  assert.match(agent, /Xinyu Agent <span>Llama 4 Scout<\/span>/i);
  assert.match(agent, /response will be generated live by Llama 4 Scout/i);
  assert.match(agent, /No scripted answer fallback/i);
  assert.doesNotMatch(agent, /I am currently focused on <strong>AutoResearch<\/strong>/);
});

test("homepage exposes the deployed no-secret Agent API endpoint", () => {
  assert.match(
    index,
    /<meta name="xinyu-agent-api" content="https:\/\/xinyu-agent-api\.798750933strikerg\.workers\.dev\/api\/chat"\s*\/>/,
  );
  assert.doesNotMatch(index, /(?:api[_-]?key|bearer\s+[a-z0-9._-]+)/i);
  assert.doesNotMatch(behavior, /(?:innerHTML|outerHTML|insertAdjacentHTML)/);
});

test("Agent answers link back to the resume evidence", () => {
  const agent = agentDialog();

  assert.match(agent, /href="#research"[^>]*>Current Research<\/a>/);
  assert.match(agent, /href="#experience"[^>]*>Work Experience<\/a>/);
  assert.match(agent, /href="#papers"[^>]*>Publications<\/a>/);
  assert.match(agent, /aria-live="polite"/);
});

test("CICL is a linked ICONIP 2026 acceptance with conservative publication wording", () => {
  const title =
    "Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents";
  const card = cardWithText("publication-card", title);

  assert.ok(card, "CICL must retain its own publication card");
  assert.match(card, /class="publication-card publication-card-linked"/);
  assert.match(card, /class="status-label">Accepted/);
  assert.match(card, /ICONIP 2026 · Springer CCIS · Accepted Aug 2026/);
  assert.match(card, /href="https:\/\/arxiv\.org\/abs\/2606\.08151"/);
  assert.match(card, /<strong>Xinyu Guan<\/strong>, Qianyang Zhao, Yuming Deng/);
  assert.doesNotMatch(card, /class="status-label">(?:Preprint|Published)/);
  assert.equal(
    existsSync(new URL("../images/paper3-cicl-pipeline.png", import.meta.url)),
    true,
    "the CICL publication image must be present",
  );
});

test("publication author lines use names only and preserve SILICA order", () => {
  const publications = contentSection("papers");
  const silica = cardWithText(
    "publication-card",
    "SILICA: Certified Counterfactual Evaluation of Identifiability in Unseen-Language Induction",
  );

  assert.match(
    silica,
    /<p class="publication-authors">Pengcheng Xu, <strong>Xinyu Guan<\/strong><\/p>/,
  );
  assert.doesNotMatch(publications, /(?:First|Second) Author/);
});

test("every verified paper title remains keyboard-accessible without swallowing secondary links", () => {
  const cards = cardsWithClass("publication-card");
  const linkedCards = cards.filter((card) => /<h3><a\b[^>]*href=/.test(card));

  assert.equal(linkedCards.length, 7, "the seven publications with verified public paper destinations should be linked");
  for (const card of linkedCards) {
    assert.match(card, /class="[^\"]*\bpublication-card-linked\b[^\"]*"/);
    assert.match(card, /target="_blank"/);
    assert.match(card, /rel="noopener"/);
  }
  assert.match(index, /href="https:\/\/arxiv\.org\/abs\/2606\.08151"/);
  assert.match(index, /href="https:\/\/arxiv\.org\/abs\/2512\.16927"/);
  assert.match(index, /href="https:\/\/doi\.org\/10\.1109\/ICASSP49660\.2025\.10887705"/);
  assert.match(cssRule(editorialBase, ".publication-card h3 a::after"), /display:\s*none/,
    "title links must not place an invisible hit layer over separate Paper/Code links");
  assert.match(cssRule(editorialBase, ":focus-visible"), /outline:\s*2px/);

  for (const card of cards.filter((candidate) => !/<h3><a\b[^>]*href=/.test(candidate))) {
    assert.doesNotMatch(card, /\bpublication-card-linked\b/);
  }
});

test("verified publication figures remain scoped to their corresponding cards", () => {
  const figureContracts = [
    {
      title: "SILICA: Certified Counterfactual Evaluation of Identifiability in Unseen-Language Induction",
      src: "images/paper-silica-identifiability.png",
      alt: "SILICA shared-state counterfactual identifiability evaluation",
    },
    {
      title:
        "Advantage Scale Calibration Imbalance in Group-Relative Optimization under Low-Variance Rewards: Diagnosis and Bounded Recovery",
      src: "images/paper-advantage-maxnorm-ac.png",
      alt: "MaxNorm-AC advantage-scale calibration pipeline",
    },
    {
      title: "TIMBRE: Teaching Time Series Forecasters to Read, Remember, and Reconcile",
      src: "images/paper-timbre-overview.png",
      alt: "TIMBRE source-aware evidence, historical response memory, and reliability-guided fusion",
    },
    {
      title:
        "Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents",
      src: "images/paper3-cicl-pipeline.png",
      alt: "CICL decision-aware context and memory-card pipeline",
    },
    {
      title: "Optimizing Text Search: A Novel Pattern Matching Algorithm Based on Ukkonen's Approach",
      src: "images/paper2-suffix-tree.png",
      alt: "Suffix-tree search illustration",
    },
    {
      title: "Basket-Enhanced Heterogenous Hypergraph for Price-Sensitive Next Basket Recommendation",
      src: "images/paper1-hypergraph.png",
      alt: "Price-aware heterogeneous hypergraph",
    },
  ];

  for (const { title, src, alt } of figureContracts) {
    const card = cardWithText("publication-card", title);
    assert.ok(card, `${title} must retain its own publication card`);
    assert.match(
      card,
      new RegExp(
        `<figure class="publication-card-figure">[\\s\\S]*?<img[^>]*src="${src}"[^>]*alt="${alt}"[^>]*>[\\s\\S]*?<\\/figure>`,
      ),
      `${title} must keep its verified figure inside its publication card`,
    );
  }
});

test("publication metadata keeps an explicit visual order", () => {
  for (const className of ["publication-meta", "publication-authors", "publication-summary"]) {
    assert.match(css, new RegExp(`\\.publication-card \\.${className}\\s*\\{`));
  }
  assert.doesNotMatch(css, /\.publication-card\s*>\s*p:nth-of-type/);
  assert.doesNotMatch(css, /\.publication-card\s*>\s*p:last-of-type/);
  for (const card of cardsWithClass("publication-card")) {
    assert.match(card, /class="publication-body"/);
    assertInOrder(card, ["<h3", 'class="publication-authors"', 'class="publication-metadata"', 'class="publication-summary"']
      .filter((token) => token !== 'class="publication-authors"' || card.includes(token)));
  }
});

test("workspace navigation uses the white editorial rail and a restrained active marker", () => {
  const rail = cssRule(editorialBase, ".editorial-sidebar");
  const navigation = cssRule(editorialBase, ".workspace-nav");
  const active = cssRule(editorialBase, ".workspace-nav a.active");

  assert.match(rail, /background:\s*#fff(?:fff)?\b/);
  assert.match(navigation, /border-radius:\s*0/);
  assert.match(navigation, /backdrop-filter:\s*none/);
  assert.match(active, /background:\s*transparent/);
  assert.match(active, /color:\s*var\(--ink\)/);
  assert.match(cssRule(editorialBase, ".workspace-nav a.active::after"), /width:\s*2px/);
});

test("profile contact list places the public WeChat ID immediately after email", () => {
  for (const page of [index, life]) {
    assert.doesNotMatch(page, /href="javascript:void\(0\)"/);
    const profileLinks = page.match(/<div class="profile-links"[^>]*>[\s\S]*?<\/div>/)?.[0] ?? "";
    assert.match(
      profileLinks,
      /mailto:xinyuguanphd@outlook\.com[\s\S]*?<button\b(?=[^>]*\btype="button")(?=[^>]*\bclass="profile-contact-button")(?=[^>]*\bid="wechatCopyBtn")(?=[^>]*\bdata-wechat="super_lucky_magic")(?=[^>]*\baria-label="Copy WeChat ID: super_lucky_magic")[^>]*>WeChat<\/button>[\s\S]*?scholar\.google\.com/,
    );
    assert.doesNotMatch(page, /class="profile-copy-actions"/);
    assert.doesNotMatch(page, /phoneCopyBtn|data-phone=|Phone:|18018735289|\+86 180 1873 5289/);
  }
  assert.match(cssRule(editorialBase, ".profile-links button"), /display:\s*inline-flex/);
  assert.match(cssRule(editorialBase, ".profile-links button"), /border:\s*0/);
  assert.match(cssRule(editorialBase, ".profile-links button"), /background:\s*none/);
});

test("desktop profile contacts keep one shared text size", () => {
  const links = cssRule(editorialBase, ".profile-links a");
  const buttons = cssRule(editorialBase, ".profile-links button");
  assertFontSizeAtLeast(links, 12, "desktop contact links");
  assertFontSizeAtLeast(buttons, 12, "desktop contact buttons");
  assert.equal(links.match(/font-size:\s*([^;]+)/)?.[1], buttons.match(/font-size:\s*([^;]+)/)?.[1]);
});

test("compact utility labels retain full email and WeChat identifiers accessibly", () => {
  assert.match(cssRule(editorialBase, ".profile-links"), /flex-direction:\s*column/);
  for (const page of [index, life]) {
    assert.match(page, /<a\b(?=[^>]*href="mailto:xinyuguanphd@outlook\.com")(?=[^>]*title="xinyuguanphd@outlook\.com")[^>]*>Email<\/a>/);
    assert.match(page, /<button\b(?=[^>]*data-wechat="super_lucky_magic")(?=[^>]*aria-label="Copy WeChat ID: super_lucky_magic")[^>]*>WeChat<\/button>/);
  }
});

test("life page publishes eighteen accessible photographs with the new opening sequence", () => {
  assert.equal(lifeExists, true, "life.html must exist");
  assert.equal((life.match(/class="life-tile\b/g) || []).length, 18);
  assert.equal((life.match(/<img\b(?=[^>]*\bclass="[^"]*\blife-photo\b[^"]*")(?=[^>]*\balt="[^"]+")[^>]*>/g) || []).length, 18);
  assert.doesNotMatch(life, /class="[^"]*\bhero-portrait\b/, "Life Photos should not duplicate the homepage hero");
  assert.doesNotMatch(life, /Oxford, UK|class="year-line/);
  assert.doesNotMatch(life, /frame-empty|Add life photo|role="presentation"/);

  for (const filename of [
    "life-road-red-shirt.jpg",
    "life-camera-portrait.jpg",
    "life-jellyfish-aquarium.jpg",
    "coastal-temple.jpg",
    "seaside-cafe.jpg",
    "red-pavilion-portrait.jpg",
    "ninghai-swing-seated.jpg",
    "ninghai-swing-front.jpg",
    "beach-walk.jpg",
    "garden-rabbit.jpg",
    "ntu-campus.jpg",
    "glasgow-graduation-friends.jpg",
    "glasgow-graduation-group.jpg",
    "glasgow-bute-hall-night.jpg",
    "glasgow-graduation-portrait.jpg",
    "glasgow-arches-portrait.jpg",
    "glasgow-graduation-contact-sheet.jpg",
    "glasgow-graduation-reception.jpg",
  ]) {
    assert.match(life, new RegExp(`src="images/life/${filename}"`));
    assert.equal(existsSync(new URL(`../images/life/${filename}`, import.meta.url)), true, `${filename} must exist`);
  }
});

test("life gallery opens with the three new photographs and preserves the previous order", () => {
  assertInOrder(life, [
    'src="images/life/life-road-red-shirt.jpg"',
    'src="images/life/life-camera-portrait.jpg"',
    'src="images/life/life-jellyfish-aquarium.jpg"',
    'src="images/life/glasgow-graduation-group.jpg"',
    'src="images/life/glasgow-bute-hall-night.jpg"',
    'src="images/life/glasgow-graduation-portrait.jpg"',
    'src="images/life/glasgow-arches-portrait.jpg"',
    'src="images/life/glasgow-graduation-contact-sheet.jpg"',
    'src="images/life/glasgow-graduation-reception.jpg"',
    'src="images/life/glasgow-graduation-friends.jpg"',
    'src="images/life/ntu-campus.jpg"',
    'src="images/life/seaside-cafe.jpg"',
    'src="images/life/red-pavilion-portrait.jpg"',
    'src="images/life/ninghai-swing-seated.jpg"',
    'src="images/life/ninghai-swing-front.jpg"',
    'src="images/life/beach-walk.jpg"',
    'src="images/life/garden-rabbit.jpg"',
    'src="images/life/coastal-temple.jpg"',
  ]);

  const figures = [...life.matchAll(/<figure class="([^"]*\blife-tile\b[^"]*)">([\s\S]*?)<\/figure>/g)];
  assert.equal(figures.length, 18);
  assert.match(figures[0][1], /\blife-tile--lead\b/);
  assert.match(figures[0][1], /\blife-tile--landscape\b/);
  assert.match(figures[0][2], /src="images\/life\/life-road-red-shirt\.jpg"/);
  assert.match(figures[0][2], /fetchpriority="high"/);
  assert.doesNotMatch(figures[0][2], /loading="lazy"/);
  assert.match(figures[1][1], /\blife-tile--portrait\b/);
  assert.match(figures[2][1], /\blife-tile--soft-portrait\b/);
  assert.match(figures[1][1], /\blife-tile--opening-portrait\b/);
  assert.match(figures[2][1], /\blife-tile--opening-portrait\b/);
  assert.equal(figures.filter(([, className]) => className.includes("life-tile--opening-portrait")).length, 2);
  assert.doesNotMatch(figures.at(-1)[1], /\blife-tile--lead\b/);
  assert.match(figures.at(-1)[2], /src="images\/life\/coastal-temple\.jpg"/);
  assert.match(figures.at(-1)[2], /loading="lazy"/);
  assert.doesNotMatch(figures.at(-1)[2], /fetchpriority="high"/);
});

test("life photographs use fixed row tracks and hole-free opening geometry at every breakpoint", () => {
  assert.equal((life.match(/\bloading="lazy"/g) || []).length, 17);
  assert.equal((life.match(/\blife-tile--lead\b/g) || []).length, 1);
  assert.ok((life.match(/\blife-tile--wide\b/g) || []).length >= 2);
  assert.ok((life.match(/\blife-tile--landscape\b/g) || []).length >= 6);
  assert.ok((life.match(/\blife-tile--portrait\b/g) || []).length >= 4);
  assert.ok((life.match(/\blife-tile--soft-portrait\b/g) || []).length >= 2);
  assert.match(css, /\.life-gallery\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\)[^}]*grid-auto-rows:\s*96px[^}]*grid-auto-flow:\s*dense/s);
  assert.match(css, /\.life-tile\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.life-tile--landscape\s*\{[^}]*grid-column:\s*span\s*4[^}]*grid-row:\s*span\s*3/s);
  assert.match(css, /\.life-tile--portrait\s*\{[^}]*grid-column:\s*span\s*3[^}]*grid-row:\s*span\s*4/s);
  assert.match(css, /\.life-tile--soft-portrait\s*\{[^}]*grid-column:\s*span\s*3[^}]*grid-row:\s*span\s*4/s);
  assert.match(css, /\.life-tile--wide\s*\{[^}]*grid-column:\s*span\s*6[^}]*grid-row:\s*span\s*3/s);
  assert.match(css, /\.life-tile--lead\s*\{[^}]*grid-column:\s*span\s*8[^}]*grid-row:\s*span\s*6/s);
  assert.match(css, /\.life-tile--opening-portrait\s*\{[^}]*grid-column:\s*span\s*4[^}]*grid-row:\s*span\s*3/s);
  assert.match(css, /\.life-photo\s*\{[^}]*width:\s*100%[^}]*height:\s*100%[^}]*object-fit:\s*cover/s);

  const tablet = maxWidthMedia(1199);
  assert.match(tablet, /\.life-gallery\s*\{[^}]*grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)[^}]*grid-auto-rows:\s*64px/s);
  assert.match(tablet, /\.life-tile--landscape\s*\{[^}]*grid-column:\s*span\s*2[^}]*grid-row:\s*span\s*2/s);
  assert.match(tablet, /\.life-tile--portrait[\s\S]*?\.life-tile--soft-portrait\s*\{[^}]*grid-column:\s*span\s*2[^}]*grid-row:\s*span\s*4/s);
  assert.match(tablet, /\.life-tile--wide\s*\{[^}]*grid-column:\s*span\s*3[^}]*grid-row:\s*span\s*2/s);
  assert.match(tablet, /\.life-tile--lead\s*\{[^}]*grid-column:\s*span\s*4[^}]*grid-row:\s*span\s*6/s);
  assert.match(tablet, /\.life-tile--opening-portrait\s*\{[^}]*grid-column:\s*span\s*2[^}]*grid-row:\s*span\s*3/s);

  const mobile = maxWidthMedia(600);
  assert.match(mobile, /\.life-gallery\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)[^}]*grid-auto-rows:\s*auto/s);
  assert.match(mobile, /\.life-tile\s*\{[^}]*grid-row:\s*auto/s);
  assert.match(mobile, /\.life-tile--lead\s*\{[^}]*grid-column:\s*1\s*\/\s*-1[^}]*aspect-ratio:\s*3\s*\/\s*2/s);
  assert.match(mobile, /\.life-tile--opening-portrait\s*\{[^}]*grid-column:\s*span\s*1[^}]*aspect-ratio:\s*3\s*\/\s*4/s);
});

test("both pages load the same styles and behavior module", () => {
  for (const page of [index, life]) {
    assertReleaseAssets(page);
  }
  assert.ok(css.length > 0);
});

test("the editorial skin selects white paper, dark ink, and restrained rule tokens", () => {
  for (const token of [
    "--editorial-rail: 200px", "--canvas: #fff", "--paper: #fff",
    "--ink: #111317", "--muted: #6b7280", "--line: #e3e6eb",
  ]) {
    assert.ok(editorialBase.toLowerCase().includes(token.toLowerCase()), `missing ${token}`);
  }
  assert.match(css, /\.life-gallery\s*\{[\s\S]*display:\s*grid/);
  assert.match(editorialCss, /prefers-reduced-motion/);
});

test("the editorial skin implements a fluid main column beside a fixed desktop rail", () => {
  assert.match(cssRule(editorialBase, ".academic-shell"), /display:\s*block/);
  assert.match(cssRule(editorialBase, ".academic-shell"), /width:\s*100%/);
  assert.match(cssRule(editorialBase, ".editorial-sidebar"), /position:\s*fixed/);
  const main = cssRule(editorialBase, ".workspace-main");
  assert.match(main, /width:\s*calc\(100% - var\(--editorial-rail\)\)/);
  assert.match(main, /margin:\s*0 0 0 var\(--editorial-rail\)/);
  assert.match(main, /min-width:\s*0/);
  assert.match(editorialCss, /@media\s*\(max-width:\s*840px\)/);
  assert.match(editorialCss, /@media\s*\(max-width:\s*600px\)/);
});

test("mobile hero and navigation preserve first-screen usability", () => {
  const tablet = editorialMedia(840);
  const mobile = editorialMedia(600);
  assert.match(cssRule(tablet, ".editorial-sidebar"), /width:\s*100%/);
  assert.match(cssRule(tablet, ".workspace-nav"), /flex-direction:\s*row/);
  assert.match(cssRule(tablet, ".workspace-main"), /margin-left:\s*0/);
  assert.match(cssRule(mobile, ".editorial-hero"), /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+104px/);
  assert.match(cssRule(mobile, ".hero-portrait"), /width:\s*104px/);
  assert.match(cssRule(editorialBase + tablet + mobile, ".workspace-nav a"), /min-height:\s*44px/);
});

test("navigation and mobile auxiliary labels preserve readable type floors", () => {
  assertFontSizeAtLeast(cssRule(editorialBase, ".workspace-nav a"), 13, "desktop navigation");

  const mobile = editorialBase + editorialMedia(840) + editorialMedia(600);
  for (const [selector, floor] of [
    [".hero-role", 13],
    [".hero-focus", 12],
    [".profile-links a", 12],
    [".profile-links button", 12],
    [".workspace-nav a", 12],
    [".site-footer", 12],
  ]) {
    assertFontSizeAtLeast(cssRule(mobile, selector), floor, `mobile ${selector}`);
  }
});

function cardsWithClass(className) {
  const cardPattern = new RegExp(
    `<article\\b(?=[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*")[^>]*>[\\s\\S]*?<\\/article>`,
    "g",
  );
  return [...index.matchAll(cardPattern)].map(([card]) => card);
}

function cardWithText(className, text) {
  return cardsWithClass(className).find((card) => card.includes(text)) ?? "";
}

function careerScopeWithText(text) {
  const teams = index.match(/<section\b(?=[^>]*\bclass="[^"]*\bexperience-team\b[^"]*")[^>]*>[\s\S]*?<\/section>/g) ?? [];
  return teams.find((team) => team.includes(text)) ?? cardWithText("experience-item", text);
}

function careerRoleVisibleText(card) {
  const role = card.match(/<p\b[^>]*\bclass="[^"]*\bexperience-(?:team-)?role\b[^"]*"[^>]*>([\s\S]*?)<\/p>/);
  assert.ok(role, "career scope must contain its own role element");
  return role[1].replace(/<[^>]+>/g, "").trim();
}

function contentSection(id) {
  const opening = new RegExp(`<section\\b(?=[^>]*\\bid="${id}")[^>]*>`).exec(index);
  assert.ok(opening, `missing #${id} section`);
  const fragment = index.slice(opening.index);
  let depth = 0;
  for (const tag of fragment.matchAll(/<\/?section\b[^>]*>/g)) {
    depth += tag[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return fragment.slice(0, tag.index + tag[0].length);
  }
  assert.fail(`#${id} section must close`);
}

function agentDialog() {
  const dialog = index.match(/<dialog\b(?=[^>]*\bid="xinyu-agent-dialog")[^>]*>[\s\S]*?<\/dialog>/)?.[0];
  assert.ok(dialog, "the homepage must expose the native Xinyu Agent dialog");
  return dialog;
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

function cssRule(source, selector) {
  const rules = [...source.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((match) =>
    match[1].split(",").some((part) => part.trim() === selector || part.trim().replace(/\s+/g, " ").endsWith(` ${selector}`)),
  );
  assert.ok(rules.length > 0, `missing ${selector} rule`);
  return rules.map((match) => match[2]).join("\n");
}

function assertFontSizeAtLeast(rule, floor, label) {
  const match = [...rule.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].at(-1);
  assert.ok(match, `${label} must declare a pixel font size`);
  assert.ok(Number(match[1]) >= floor, `${label} font size must be at least ${floor}px`);
}

function maxWidthMedia(maxWidth) {
  const match = new RegExp(`@media\\s*\\(max-width:\\s*${maxWidth}px\\)\\s*\\{`).exec(css);
  assert.ok(match, `missing max-width: ${maxWidth}px media query`);
  return cssBlock(css, css.indexOf("{", match.index));
}

function editorialMedia(maxWidth) {
  const match = new RegExp(`@media\\s*\\(max-width:\\s*${maxWidth}px\\)\\s*\\{`).exec(editorialCss);
  assert.ok(match, `editorial skin needs max-width: ${maxWidth}px`);
  return cssBlock(editorialCss, editorialCss.indexOf("{", match.index));
}

function gridTrackCount(declaration) {
  const tracks = [];
  let depth = 0;
  let start = 0;

  for (let cursor = 0; cursor <= declaration.length; cursor += 1) {
    const char = declaration[cursor] ?? " ";
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth === 0 && /\s/.test(char)) {
      const track = declaration.slice(start, cursor).trim();
      if (track) tracks.push(track);
      start = cursor + 1;
    }
  }

  return tracks.reduce((count, track) => {
    const repeat = /^repeat\(\s*(\d+)\s*,/.exec(track);
    return count + (repeat ? Number(repeat[1]) : 1);
  }, 0);
}

function gridColumnsFor(source, selector) {
  const rule = cssRule(source, selector);
  assert.match(rule, /display:\s*grid/);
  const columns = rule.match(/grid-template-columns:\s*([^;}]+)(?:;|$)/);
  assert.ok(columns, `${selector} must declare grid-template-columns`);
  return gridTrackCount(columns[1]);
}

function assertGridColumns(source, selector, expectedCount) {
  assert.equal(gridColumnsFor(source, selector), expectedCount, `${selector} must have ${expectedCount} grid column(s)`);
}

function assertMultiColumnGrid(source, selector) {
  assert.ok(gridColumnsFor(source, selector) >= 2, `${selector} must have at least two grid columns`);
}

test("homepage locks the current research program, career, and eleven independent publication rows", () => {
  const researchTitles = ["AutoResearch", "Post-Training", "Agentic RL", "PIVOT · CVPR", "Agent Research Survey"];
  const research = contentSection("research");
  const researchCards = cardsWithClass("research-core-item");
  assert.equal(researchCards.length, 3);
  assert.match(research, /class="research-progress"/);
  for (const title of researchTitles) {
    assert.equal(
      (research.match(new RegExp(title, "g")) ?? []).length,
      1,
      `${title} must appear exactly once in Current research`,
    );
  }

  assert.equal(cardsWithClass("experience-item").length, 5);
  assert.equal(cardsWithClass("publication-card").length, 11);
});

test("verified career levels stay attached to their corresponding appointments", () => {
  const contracts = [
    ["TaoTian Group @ Alibaba", "AI Agent Researcher · P6"],
    ["Baidu / ERNIE Foundation Model Core Team", "Senior Research Scientist · T4+"],
    ["Tencent / Hunyuan Text-to-Text Pipeline Team", "Research Scientist · T5"],
    ["Tencent / Hunyuan Strategy Group 4", "Research Scientist · T5"],
    ["Institute of Information Engineering, Chinese Academy of Sciences", "Research Assistant Intern"],
    ["Mico World / Yoho Department", "Software Engineer"],
  ];

  for (const [heading, expectedRole] of contracts) {
    const card = careerScopeWithText(heading);
    assert.ok(card, `missing career card: ${heading}`);
    assert.equal(
      careerRoleVisibleText(card),
      expectedRole,
      `${heading} must display its exact role in .experience-role`,
    );
  }
});

test("compact work history preserves all six original scopes including both Tencent teams", () => {
  const cards = cardsWithClass("experience-item");
  assert.equal(cards.length, 5, "four primary employer rows plus the expandable earlier Mico row");
  assert.equal((index.match(/<section class="experience-team">/g) ?? []).length, 2);
  assert.match(contentSection("experience"), /<details class="earlier-career">[\s\S]*?Mico World \/ Yoho Department[\s\S]*?<\/details>/);
  for (const title of [
    "TaoTian Group @ Alibaba",
    "Baidu / ERNIE Foundation Model Core Team",
    "Tencent / Hunyuan Text-to-Text Pipeline Team",
    "Tencent / Hunyuan Strategy Group 4",
    "Institute of Information Engineering, Chinese Academy of Sciences",
    "Mico World / Yoho Department",
  ]) {
    assert.equal(cards.filter((card) => card.includes(title)).length, 1);
  }
  assert.match(cardWithText("experience-item", "Institute of Information Engineering"), /Nov 2023 — Feb 2024/);
  assert.doesNotMatch(index, /Alibaba Group \/ TaoTian Group|Alibaba TaoTian/);
});

test("each work appointment exposes the required visible content structure", () => {
  for (const card of cardsWithClass("experience-item")) {
    assert.match(card, /<h3\b[^>]*>[^<]+<\/h3>/);
    for (const className of ["experience-date", "experience-copy", "experience-role", "experience-intro", "career-projects"]) {
      assert.match(card, new RegExp(`class="[^\"]*\\b${className}\\b[^\"]*"`));
    }
  }
});

test("detailed work metrics remain attached to their source appointments", () => {
  const contracts = [
    ["Baidu / ERNIE", ["260 H800", "80+ languages", "86.4%", "92%", "+25.5%"]],
    ["Tencent / Hunyuan Text-to-Text", ["50B HTML", "98.33%", "57.14%", "900B"]],
    ["Tencent / Hunyuan Strategy Group 4", ["20,000 video-hours", "116 file types", "10 QPS", "20,000+ transcripts"]],
    ["Institute of Information Engineering", ["CERT 4.2", "0.99", "0.3%", "20,000+ RDF triples"]],
    ["Mico World / Yoho", ["about 20% of company revenue", "3.7×", "80% of core APIs", "73%"]],
  ];
  for (const [title, values] of contracts) {
    const card = careerScopeWithText(title);
    assert.ok(card);
    const visibleText = card.replace(/<[^>]+>/g, "");
    for (const value of values) assert.ok(visibleText.includes(value), `${title} must retain ${value}`);
  }
});

test("Alibaba appointment presents the approved two-workstream scope and claim boundaries", () => {
  const alibaba = cardWithText("experience-item", "TaoTian Group @ Alibaba");
  assert.ok(alibaba, "Alibaba appointment must remain a distinct career card");

  const summary = alibaba.match(/<p class="experience-intro">([^<]*)<\/p>/)?.[1] ?? "";
  assert.equal(
    summary,
    "AI Agent research spanning General AutoResearch and multimodal quality inspection for Xianyu.",
  );
  assert.doesNotMatch(summary, /photo-compliance|physical-defect|post-training|agentic RL/i);

  const projects = alibaba.match(/<ul class="career-projects">[\s\S]*?<\/ul>/)?.[0] ?? "";
  assert.equal((projects.match(/<li\b/g) ?? []).length, 2, "Alibaba must retain exactly two workstream bullets");

  const visibleText = alibaba.replace(/<[^>]+>/g, "");
  for (const value of [
    "General AutoResearch",
    "Xianyu Multimodal Quality Inspection",
    "bounded loop control",
    "stalled-branch rerouting",
    "evidence-driven hypothesis generation",
    "hierarchical memory",
    "resumable execution traces",
    "bad-case",
    "candidate",
    "prompt or policy",
    "19 business-task optimization runs",
    "4 Agent runtimes",
    "4 model configurations",
    "279 migration tests",
    "viewpoint compliance detection",
    "base photo-quality checks",
    "visible physical-defect detection",
    "80 inspection checks",
    "97.54% mean Macro-F1",
  ]) {
    assert.ok(visibleText.includes(value), `Alibaba appointment must retain ${value}`);
  }
  assert.match(visibleText, /autonomously[^.!?]*bad-case[^.!?]*candidate[^.!?]*prompt or policy/i);
  const optimizationRunSentence = visibleText.match(
    /Across 19 business-task optimization runs[^.!?]*[.!?]/i,
  )?.[0] ?? "";
  assert.match(
    optimizationRunSentence,
    /Across 19 business-task optimization runs[^.!?]*prompt (?:iteration|optimization)[^.!?]*migration validation[^.!?]*without human intervention within the optimization loop/i,
  );
  assert.doesNotMatch(
    optimizationRunSentence,
    /\b(?:production|deploy(?:ed|ment)?|rollout|launch(?:ed)?)\b/i,
    "19 business-task runs must not be presented as unattended production deployment",
  );
  assert.match(visibleText, /4 Agent runtimes[^.!?]*4 model configurations[^.!?]*8 of 9 controlled image-QC tasks/i);
  assert.match(visibleText, /279 migration tests passed/i);
  assert.match(
    visibleText,
    /offline acceptance snapshot limited to nine categories and 80 inspection checks[^.!?]*97\.54% mean Macro-F1/i,
  );
  assert.match(
    visibleText,
    /\. Separately, (?:the )?current capability supports 30\+ product categories[^.!?]*approximately 30K orders per day/i,
  );
  assert.doesNotMatch(visibleText, /97\.54%[^.!?]*30\+ product categories|30\+ product categories[^.!?]*97\.54%/i);
  assert.doesNotMatch(
    visibleText,
    /\b(?:AutoResearch|Xianyu)\s+(?:runtime|model|category)(?:\s+(?:ID|name))?\s*(?::|=|is\b)\s*[A-Za-z0-9][\w.-]*/i,
    "Alibaba card must present aggregate scope, not internal runtime, model, or category identifiers",
  );
});

test("research and education are independent visible entries", () => {
  assert.equal(cardsWithClass("research-project").length, 6);
  assert.equal(cardsWithClass("education-item").length, 2);
  for (const sectionId of ["research-experience", "education"]) {
    assert.doesNotMatch(contentSection(sectionId), /<details\b|aria-expanded=/);
  }
  for (const title of [
    "LLM4ITD: Insider Threat Detection with Fine-Tuned LLMs",
    "Efficient Text Search Algorithm Evaluation",
    "EEG Feature Analysis for SCI Patients",
    "ML Analysis of WSI Colorectal Cancer Datasets",
    "Yellow Crane Tower Tourism Dialogue System",
    "Lung Cancer Literature Classification with BioBERT",
  ]) assert.ok(cardWithText("research-project", title));

  assertInOrder(contentSection("research-experience"), [
    "LLM4ITD: Insider Threat Detection with Fine-Tuned LLMs",
    "Yellow Crane Tower Tourism Dialogue System",
    "Efficient Text Search Algorithm Evaluation",
    "Lung Cancer Literature Classification with BioBERT",
    "EEG Feature Analysis for SCI Patients",
    "ML Analysis of WSI Colorectal Cancer Datasets",
  ]);

  const yellowCrane = cardWithText("research-project", "Yellow Crane Tower Tourism Dialogue System");
  assert.match(yellowCrane, /15,000<\/strong> GPT-4-distilled tourism dialogues/);
  assert.doesNotMatch(yellowCrane, /GPT-4o/);
});

test("unpublished papers retain distinct venues and conservative public states", () => {
  const silicaTitle = "SILICA: Certified Counterfactual Evaluation of Identifiability in Unseen-Language Induction";
  const klTitle = "When KL Regularization Fails in Online Reasoning RL: A Token-Level Gradient Contract";
  const advantageTitle =
    "Advantage Scale Calibration Imbalance in Group-Relative Optimization under Low-Variance Rewards: Diagnosis and Bounded Recovery";
  const timbreTitle = "TIMBRE: Teaching Time Series Forecasters to Read, Remember, and Reconcile";

  const contracts = [
    [silicaTitle, /Submitted/, /ACL ARR · Aug 2026 cycle · Preferred venue: EACL/],
    [advantageTitle, /Submitted/, /Submitted to AAAI 2027 · Jul 2026/],
  ];
  for (const [title, status, venue] of contracts) {
    const card = cardWithText("publication-card", title);
    assert.ok(card, `publication card must include ${title}`);
    assert.match(card, status);
    assert.match(card, venue);
    assert.match(card, /Not yet public/);
    assert.doesNotMatch(card, /<a\b[^>]*href=/);
  }
  assert.equal(cardWithText("publication-card", klTitle), "",
    "the unresolved KL manuscript must remain off the public homepage");
  assert.doesNotMatch(contentSection("papers"), /paper-zcpo|ZCPO|1RCulySJU5/);
  assert.doesNotMatch(cardWithText("publication-card", silicaTitle), /\bACL Submission\b/);

  const timbre = cardWithText("publication-card", timbreTitle);
  assert.match(timbre, /Submitted to ICASSP 2027 · arXiv:2610\.04795/);
  assert.match(timbre, /<h3><a\b[^>]*href="https:\/\/arxiv\.org\/abs\/2610\.04795"/);
  assert.match(timbre, /class="publication-inline-link" href="https:\/\/arxiv\.org\/abs\/2610\.04795"[^>]*>arXiv<\/a>/);
  assert.doesNotMatch(timbre, /class="status-label">(?:Accepted|Published)</);
  const timbreNews = cardWithText("news-item", "TIMBRE");
  assert.match(timbreNews, /submitted to ICASSP 2027/);
  assert.match(timbreNews, /preprint is publicly available on/);
  assert.match(timbreNews, /href="https:\/\/arxiv\.org\/abs\/2610\.04795"[^>]*>arXiv<\/a>/);
  assert.doesNotMatch(timbre, /Paper not yet public/);
  assert.match(timbre, /class="publication-inline-link" href="https:\/\/github\.com\/stephen-guan-researcher\/TIMBRE"[^>]*>Code<\/a>/);
  assert.doesNotMatch(contentSection("papers"), /ChronoMem: Interpretable Event Memory/);
});

test("PIVOT is preparing for CVPR, not an active ICLR submission or a public paper", () => {
  const title = "PIVOT: Choosing When to Refine Prompts or Acquire Evidence for Multimodal Agent Self-Improvement";
  const card = cardWithText("publication-card", title);
  assert.ok(card, "PIVOT must have an independent manuscript card");
  assert.match(card, /class="status-label">In Preparation/);
  assert.match(card, /Preparing for CVPR · Not yet public/);
  assert.match(card, /<strong>Xinyu Guan<\/strong>, Kunjin Chen, Qianyang Zhao, Yu Sun, Pengcheng Xu, Yuming Deng/);
  assert.doesNotMatch(card, /<a\b|publication-card-linked|>Submitted<|>Accepted<|>Published<|ICLR|CVPR 20\d\d/);
  assert.match(contentSection("research"), /PIVOT · CVPR/);
  assert.doesNotMatch(contentSection("research"), /CVPR Manuscript/);
});

test("new public ICLR submissions preserve title, author order, and direct links", () => {
  const contracts = [
    [
      "How Deep Should a VLA Think When Thinking Costs Time? Budget-Constrained RL for Early Exit",
      "x6BEwIFvUc",
      "Pengcheng Xu, Qinting Li, Weizhi Du, Yu Sun, <strong>Xinyu Guan</strong>",
    ],
    [
      "Static Gradient Attribution Underperforms a Density-Matched Random Mask Within LoRA’s B-Matrix",
      "g54eVrFPPI",
      "Yu Sun, Junwei Zhou, Zuodong Xiang, Yike Zhang, Pengcheng Xu, <strong>Xinyu Guan</strong>, Ruoyun Ma, Hailu Xu",
    ],
    [
      "QESChunker: A Single Objective Unifies Overlapping and Non-Overlapping Chunking for RAG",
      "pvrvPinZif",
      "Yifan Zhao, Qianyang Zhao, <strong>Xinyu Guan</strong>, kai wei, Yuming Deng",
    ],
  ];
  for (const [title, id, authors] of contracts) {
    const card = cardWithText("publication-card", title);
    assert.ok(card, `${title} must have an independent card`);
    assert.match(card, /class="[^\"]*\bpublication-card-linked\b[^\"]*"/);
    assert.ok(card.includes(`href="https://openreview.net/forum?id=${id}"`));
    assert.ok(card.includes(`<p class="publication-authors">${authors}</p>`));
    assert.match(card, /Submitted to ICLR 2027 · Sep 2026 · OpenReview/);
    assert.doesNotMatch(card, />Accepted<|>Published</);
  }
});

test("reference shell and publication rows respond at the selected breakpoints", () => {
  assert.match(cssRule(editorialBase, ".academic-shell"), /display:\s*block/);
  assertGridColumns(editorialBase, ".publication-card", 2);
  const compact = editorialMedia(840);
  assert.match(cssRule(compact, ".workspace-main"), /width:\s*100%/);
  assert.match(cssRule(compact, ".workspace-nav"), /flex-direction:\s*row/);
  const mobile = editorialMedia(600);
  assert.equal(gridTrackCount(cssRule(mobile, ".publication-card").match(/grid-template-columns:\s*([^;}]+)/)?.[1] ?? ""), 1);
  assert.match(cssRule(mobile, ".publication-card-figure"), /width:\s*100%/);
});
