import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const index = read("index.html");
const css = read("phd-styles.css");
const behavior = read("phd-main.js");
const lifeExists = existsSync(new URL("../life.html", import.meta.url));
const life = lifeExists ? read("life.html") : "";

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
    ["Home", "#home"],
    ["Research", "#research"],
    ["Publications", "#papers"],
    ["Experience", "#experience"],
    ["Life Photos", "life.html"],
  ];
  const lifeNavigation = [
    ["Home", "index.html#home"],
    ["Research", "index.html#research"],
    ["Publications", "index.html#papers"],
    ["Experience", "index.html#experience"],
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

test("homepage exposes six numbered semantic sections in order", () => {
  const sections = [...index.matchAll(
    /<section\b[^>]*class="content-card ([^"]+)"[^>]*id="([^"]+)"[\s\S]*?<span class="section-index" aria-hidden="true">(0[1-6])<\/span>[\s\S]*?<h2[^>]*>([^<]+)<\/h2>/g,
  )].map((match) => [match[2], match[3], match[4].trim()]);

  assert.deepEqual(sections, [
    ["home", "01", "About me"],
    ["research", "02", "Current research"],
    ["papers", "03", "Publications &amp; Manuscripts"],
    ["experience", "04", "Work experience"],
    ["research-experience", "05", "Research experience"],
    ["education", "06", "Education"],
  ]);
});

test("homepage preserves the approved blue-gray research-archive markers", () => {
  assert.match(index, /<span class="profile-focus-kicker">Current Focus<\/span>/);
  assert.match(life, /<span class="profile-focus-kicker">Current Focus<\/span>/);
  assert.match(index, /<h2 id="news-title">Now<\/h2>/);
  assert.doesNotMatch(index, /<h2 id="news-title">News<\/h2>/);

  for (const page of [index, life]) {
    assert.match(page, /href="phd-styles\.css\?v=20260806-profile-release-2"/);
  }
});

test("Now presents the verified 2026 milestones as a reverse-chronological timeline", () => {
  const news = index.match(/<aside class="news-card"[\s\S]*?<\/aside>/)?.[0] ?? "";
  const items = news.match(/<article class="news-item">[\s\S]*?<\/article>/g) ?? [];
  const dates = [...news.matchAll(/<time datetime="([^"]+)">/g)].map((match) => match[1]);

  assert.equal(items.length, 6, "Now must expose six concise milestone cards");
  assert.deepEqual(dates, ["2026-08", "2026-08", "2026-08", "2026-07", "2026-06", "2026-02"]);
  for (const status of ["Preparing", "Submitted", "Preprint", "Career"]) {
    assert.match(news, new RegExp(`<span>${status}<\\/span>`));
  }
  assert.match(news, /Submitted SILICA to EACL/);
  assert.match(news, /Preparing the KL regularization manuscript for ICLR/);
  assert.match(news, /Submitted Advantage Scale Calibration to AAAI 2027/);
  assert.match(news, /href="https:\/\/arxiv\.org\/abs\/2606\.08151"[^>]*target="_blank"[^>]*rel="noopener"/);
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
    "Xianyu Quality Inspection",
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
  const about = contentSection("home");

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
  assert.match(index, /AI Agent research across AutoResearch, post-training, and agentic RL, applied in Xianyu AI systems/);
  assert.doesNotMatch(index, /spanning AutoResearch, post-training, agentic RL, and applied Xianyu AI systems/);
  assert.match(index, /Xianyu AI agents for photo-compliance detection and physical-defect inspection/);
  assert.match(contentSection("home"), /apply these ideas in <strong>Xianyu AI systems<\/strong>/);
  assert.match(contentSection("research"), /Xianyu AI as a practical application domain/);
  assert.match(contentSection("experience"), /applied in Xianyu AI systems/);
  assert.match(contentSection("experience"), /Mathematical and biomedical capability enhancement/);
  assert.match(contentSection("experience"), /training time <strong>30%<\/strong> lower/);
  assert.match(index, /<strong>Xinyu Guan<\/strong> et al\./);

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

test("Xinyu Agent stays inside About me and starts in a compact accessible state", () => {
  const home = contentSection("home");
  const agent = home.match(/<aside\b[^>]*class="xinyu-agent"[\s\S]*?<\/aside>/)?.[0] ?? "";

  assert.ok(agent, "About me must contain the Xinyu Agent card");
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
  assert.ok(index.indexOf(agent) < index.indexOf('id="research"'));
  assert.doesNotMatch(index, /<a[^>]*>\s*Ask Xinyu\s*<\/a>/);
});

test("Xinyu Agent does not present a scripted profile summary as a model answer", () => {
  const home = contentSection("home");
  const agent = home.match(/<aside\b[^>]*class="xinyu-agent"[\s\S]*?<\/aside>/)?.[0] ?? "";

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
  const home = contentSection("home");
  const agent = home.match(/<aside\b[^>]*class="xinyu-agent"[\s\S]*?<\/aside>/)?.[0] ?? "";

  assert.match(agent, /href="#research"[^>]*>Current Research<\/a>/);
  assert.match(agent, /href="#experience"[^>]*>Work Experience<\/a>/);
  assert.match(agent, /href="#papers"[^>]*>Publications<\/a>/);
  assert.match(agent, /aria-live="polite"/);
});

test("CICL remains a linked preprint with its verified metadata and image asset", () => {
  const title =
    "Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents";
  const card = cardWithText("publication-card", title);

  assert.ok(card, "CICL must retain its own publication card");
  assert.match(card, /class="publication-card publication-card-linked"/);
  assert.match(card, /href="https:\/\/arxiv\.org\/abs\/2606\.08151"/);
  assert.match(card, /rel="noopener"/);
  assert.match(card, /<strong>Xinyu Guan<\/strong>, Qianyang Zhao, Yuming Deng/);
  assert.ok(card.includes("arXiv:2606.08151 [cs.AI]"));
  assert.doesNotMatch(card, /(?:First|Second) Author/);
  assert.ok(card.includes("Jun 2026"));
  assert.ok(card.includes("Preprint"));
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

test("every verified paper link makes its whole card keyboard-accessible and clickable", () => {
  const cards = cardsWithClass("publication-card");
  const linkedCards = cards.filter((card) => /<a\b[^>]*href=/.test(card));

  assert.equal(linkedCards.length, 3, "the three publications with verified public destinations should be linked");
  for (const card of linkedCards) {
    assert.match(card, /class="publication-card publication-card-linked"/);
    assert.match(card, /target="_blank"/);
    assert.match(card, /rel="noopener"/);
  }
  assert.match(index, /href="https:\/\/arxiv\.org\/abs\/2606\.08151"/);
  assert.match(index, /href="https:\/\/arxiv\.org\/abs\/2512\.16927"/);
  assert.match(index, /href="https:\/\/doi\.org\/10\.1109\/ICASSP49660\.2025\.10887705"/);
  assert.match(
    cssRule(css, ".publication-card-linked h3 a::after"),
    /position:\s*absolute[\s\S]*inset:\s*0[\s\S]*content:\s*""/,
  );
  assert.match(cssRule(css, ".publication-card-linked"), /cursor:\s*pointer/);
  assert.match(cssRule(css, ".publication-card-linked:focus-within"), /outline:\s*3px/);

  for (const card of cards.filter((candidate) => !/<a\b[^>]*href=/.test(candidate))) {
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
      title: "ChronoMem: Interpretable Event Memory for LLM-Augmented Time-Series Forecasting",
      src: "images/paper-chronomem-overview.png",
      alt: "ChronoMem event-memory and residual-forecasting pipeline",
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
});

test("workspace navigation uses an opaque white toolbar and underlined active state", () => {
  const navigation = cssRule(css, ".workspace-nav");
  const active = cssRule(css, ".workspace-nav a.active");

  assert.match(navigation, /background:\s*var\(--paper\)/);
  assert.match(navigation, /border-radius:\s*12px/);
  assert.doesNotMatch(navigation, /backdrop-filter\s*:/);
  assert.match(active, /background:\s*transparent/);
  assert.match(active, /color:\s*var\(--accent-strong\)/);
  assert.match(active, /box-shadow:\s*none/);
  assert.match(css, /\.workspace-nav a\.active::after\s*\{[^}]*height:\s*2px/);
});

test("copy contact actions use buttons instead of javascript URLs", () => {
  for (const page of [index, life]) {
    assert.doesNotMatch(page, /href="javascript:void\(0\)"/);
    assert.match(
      page,
      /<button\b(?=[^>]*\btype="button")(?=[^>]*\bid="wechatCopyBtn")(?=[^>]*\bdata-wechat="18018735289")[^>]*>WeChat: 18018735289<\/button>/,
    );
    assert.match(
      page,
      /<button\b(?=[^>]*\btype="button")(?=[^>]*\bid="phoneCopyBtn")(?=[^>]*\bdata-phone="\+8618018735289")[^>]*>Phone: \+86 180 1873 5289<\/button>/,
    );
  }
});

test("life page publishes eighteen accessible photographs with the new opening sequence", () => {
  assert.equal(lifeExists, true, "life.html must exist");
  assert.equal((life.match(/class="life-tile\b/g) || []).length, 18);
  assert.equal((life.match(/<img\b(?=[^>]*\bclass="[^"]*\blife-photo\b[^"]*")(?=[^>]*\balt="[^"]+")[^>]*>/g) || []).length, 18);
  assert.match(life, /images\/generated\/avatar-528\.jpg/);
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
    assert.match(page, /href="phd-styles\.css\?v=20260806-profile-release-2"/);
    assert.match(
      page,
      /src="phd-main\.js\?v=20260806-profile-release-2"[^>]*type="module"|type="module"[^>]*src="phd-main\.js\?v=20260806-profile-release-2"/,
    );
  }
  assert.ok(css.length > 0);
});

test("shared CSS locks the selected card-shell tokens", () => {
  for (const token of [
    "--canvas: #f3f5f7",
    "--paper: #ffffff",
    "--ink: #1f2937",
    "--muted: #687386",
    "--line: #dce4eb",
    "--accent: #315f8a",
    "--accent-strong: #234a70",
    "--accent-soft: #eaf1f7",
  ]) {
    assert.ok(css.toLowerCase().includes(token.toLowerCase()), `missing ${token}`);
  }
  assert.match(css, /\.life-gallery\s*\{[\s\S]*display:\s*grid/);
  assert.match(css, /prefers-reduced-motion/);
});

test("shared CSS implements the approved fluid layout contract", () => {
  assert.match(css, /font-size:\s*clamp\(16px,\s*calc\(0\.2vw \+ 15\.5px\),\s*18px\)/);
  assert.match(css, /width:\s*min\(1480px,\s*calc\(100% - 32px\)\)/);
  assert.match(css, /clamp\(200px,\s*17vw,\s*260px\)\s+minmax\(0,\s*1fr\)\s+clamp\(170px,\s*14vw,\s*230px\)/);
  assert.match(css, /@media\s*\(max-width:\s*1199px\)/);
  assert.match(css, /@media\s*\(max-width:\s*840px\)/);
  assert.doesNotMatch(css, /@media\s*\(max-width:\s*1503px\)/);
  assert.match(css, /@media\s*\(max-width:\s*600px\)/);
  assert.doesNotMatch(css, /width:\s*min\((?:1000|980|760)px/);
});

test("mobile profile and navigation preserve first-screen usability", () => {
  const mobile = maxWidthMedia(600);
  assert.match(mobile, /\.profile-card\s*\{[^}]*grid-template-columns:\s*clamp\(\s*88px,[^,]+,\s*104px\s*\)\s+minmax\(0,\s*1fr\)/s);
  assert.match(mobile, /\.profile-links\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(mobile, /\.profile-links a:first-child\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
  assert.match(mobile, /\.profile-links span\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(mobile, /\.workspace-nav a\s*\{[^}]*min-height:\s*44px/s);
  assert.match(mobile, /\.profile-copy-actions\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
});

test("navigation and mobile auxiliary labels preserve readable type floors", () => {
  assertFontSizeAtLeast(cssRule(css, ".workspace-nav a"), 13, "desktop navigation");

  const mobile = maxWidthMedia(600);
  for (const [selector, floor] of [
    [".profile-role", 13],
    [".profile-affiliation", 12],
    [".profile-focus-label", 12],
    [".profile-focus-kicker", 12],
    [".profile-links a", 12],
    [".profile-primary-link", 12],
    [".profile-copy-actions button", 12],
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

function contentSection(id) {
  const sectionStart = index.indexOf(`id="${id}"`);
  assert.notEqual(sectionStart, -1, `missing #${id} section`);
  const nextSection = index.indexOf('<section class="content-card', sectionStart + 1);
  return index.slice(sectionStart, nextSection === -1 ? index.length : nextSection);
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
  const match = new RegExp(`\\${selector}\\s*\\{`).exec(source);
  assert.ok(match, `missing ${selector} rule`);
  return cssBlock(source, source.indexOf("{", match.index));
}

function assertFontSizeAtLeast(rule, floor, label) {
  const match = /font-size:\s*(\d+(?:\.\d+)?)px/.exec(rule);
  assert.ok(match, `${label} must declare a pixel font size`);
  assert.ok(Number(match[1]) >= floor, `${label} font size must be at least ${floor}px`);
}

function maxWidthMedia(maxWidth) {
  const match = new RegExp(`@media\\s*\\(max-width:\\s*${maxWidth}px\\)\\s*\\{`).exec(css);
  assert.ok(match, `missing max-width: ${maxWidth}px media query`);
  return cssBlock(css, css.indexOf("{", match.index));
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

test("homepage locks the current research program, career, and seven independent publication cards", () => {
  const researchTitles = ["AutoResearch", "Post-Training", "Agentic RL", "CVPR Manuscript", "Agent Research Survey"];
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

  assert.equal(cardsWithClass("career-item").length, 6);
  assert.equal(cardsWithClass("publication-card").length, 7);
});

test("verified career levels stay attached to their corresponding appointments", () => {
  const contracts = [
    ["TaoTian Group @ Alibaba", "AI Agent Researcher · P6"],
    ["Baidu / ERNIE Foundation Model Core Team", "Senior Research Scientist · T4+"],
    ["Tencent / Hunyuan Text-to-Text Pipeline Team", "Research Scientist · T5"],
    ["Tencent / Hunyuan Strategy Group 4", "Research Scientist · T5"],
  ];

  for (const [heading, role] of contracts) {
    const card = cardWithText("career-item", heading);
    assert.ok(card, `missing career card: ${heading}`);
    assert.ok(card.includes(role), `${heading} must display ${role}`);
  }
});

test("work history contains six independent appointments with separate Tencent teams", () => {
  const cards = cardsWithClass("career-item");
  assert.equal(cards.length, 6);
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
  assert.match(cardWithText("career-item", "Institute of Information Engineering"), /Nov 2023 — Feb 2024/);
  assert.doesNotMatch(index, /Alibaba Group \/ TaoTian Group|Alibaba TaoTian/);
});

test("each work appointment exposes the required visible content structure", () => {
  for (const card of cardsWithClass("career-item")) {
    for (const className of ["career-date", "career-header", "career-role", "career-summary", "career-projects"]) {
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
    const card = cardWithText("career-item", title);
    assert.ok(card);
    const visibleText = card.replace(/<[^>]+>/g, "");
    for (const value of values) assert.ok(visibleText.includes(value), `${title} must retain ${value}`);
  }
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
  const chronoMemTitle = "ChronoMem: Interpretable Event Memory for LLM-Augmented Time-Series Forecasting";

  const contracts = [
    [silicaTitle, /Submitted/, /Submitted to EACL · Aug 2026/],
    [klTitle, /In Preparation/, /Withdrawn from AAAI · In preparation for ICLR · Aug 2026/],
    [advantageTitle, /Submitted/, /Submitted to AAAI 2027 · Jul 2026/],
    [chronoMemTitle, /In Preparation/, /In preparation for ICASSP 2027 · Aug 2026/],
  ];
  for (const [title, status, venue] of contracts) {
    const card = cardWithText("publication-card", title);
    assert.ok(card, `publication card must include ${title}`);
    assert.match(card, status);
    assert.match(card, venue);
    assert.match(card, /Not yet public/);
    assert.doesNotMatch(card, /<a\b[^>]*href=/);
  }
  assert.match(cardWithText("publication-card", klTitle), /Withdrawn from AAAI/);
  assert.doesNotMatch(cardWithText("publication-card", silicaTitle), /\bACL Submission\b/);
});

test("reference shell and publication rows respond at the selected breakpoints", () => {
  assertGridColumns(css, ".academic-shell", 3);
  assertGridColumns(css, ".publication-card", 2);

  const tablet = maxWidthMedia(1199);
  assertGridColumns(tablet, ".academic-shell", 2);

  const compact = maxWidthMedia(840);
  assertGridColumns(compact, ".academic-shell", 1);

  const mobile = maxWidthMedia(600);
  assertGridColumns(mobile, ".academic-shell", 1);
  assertGridColumns(mobile, ".publication-card", 1);
});
