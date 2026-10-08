import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const asset = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFileSync(asset(path), "utf8");
const source = { home: read("index.html"), life: read("life.html") };
const voidTags = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr",
]);

function decode(value) {
  const entities = { amp: "&", apos: "'", quot: '"', lt: "<", gt: ">", nbsp: " ", rsquo: "’" };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name) => {
    if (name[0] !== "#") return entities[name.toLowerCase()] ?? entity;
    return String.fromCodePoint(name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1)));
  });
}

// A dependency-free tree for structural assertions; formatting and attribute order
// are deliberately irrelevant to the public page contract.
function parseHtml(html) {
  const root = { tag: "document", attrs: {}, children: [], start: 0 };
  const stack = [root];
  let cursor = 0;
  for (const match of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][^>]*>/gi)) {
    if (match.index > cursor) stack.at(-1).children.push(decode(html.slice(cursor, match.index)));
    cursor = match.index + match[0].length;
    const token = match[0];
    if (token.startsWith("<!")) continue;
    const tag = /^<\/?([\w-]+)/.exec(token)[1].toLowerCase();
    if (token.startsWith("</")) {
      const matching = stack.findLastIndex((node) => node.tag === tag);
      if (matching > 0) stack.length = matching;
      continue;
    }
    const attrs = {};
    const attributeSource = token.slice(tag.length + 1).replace(/\/?\s*>$/, "");
    for (const attribute of attributeSource.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs[attribute[1].toLowerCase()] = decode(attribute[2] ?? attribute[3] ?? attribute[4] ?? "");
    }
    const node = { tag, attrs, children: [], start: match.index };
    stack.at(-1).children.push(node);
    if (!voidTags.has(tag) && !/\/\s*>$/.test(token)) stack.push(node);
  }
  if (cursor < html.length) stack.at(-1).children.push(decode(html.slice(cursor)));
  return root;
}

function all(root, predicate) {
  const nodes = [];
  function visit(node) {
    if (typeof node === "string") return;
    if (predicate(node)) nodes.push(node);
    node.children.forEach(visit);
  }
  visit(root);
  return nodes;
}

const hasClass = (node, name) => (node.attrs.class ?? "").split(/\s+/).includes(name);
const withClass = (root, name) => all(root, (node) => hasClass(node, name));
const byId = (root, id) => all(root, (node) => node.attrs.id === id)[0];
const text = (node) => node == null ? "" : typeof node === "string" ? node : node.children.map(text).join("");
const normalizedText = (node) => text(node).replace(/\s+/g, " ").trim();
const pages = { home: parseHtml(source.home), life: parseHtml(source.life) };

function publication(title) {
  const card = withClass(pages.home, "publication-card").find((node) =>
    all(node, (child) => child.tag === "h3").some((heading) => normalizedText(heading) === title),
  );
  assert.ok(card, `missing publication: ${title}`);
  return card;
}

const surveyTitle = "Diagnostics and Infrastructure for Foundation Model-Based Multi-Agent Systems: A Review of the Runtime Stack";
const knownPapers = [
  [
    "PIVOT: Choosing When to Refine Prompts or Acquire Evidence for Multimodal Agent Self-Improvement",
    "Xinyu Guan, Kunjin Chen, Qianyang Zhao, Yu Sun, Pengcheng Xu, Yuming Deng",
  ],
  [
    "TIMBRE: Teaching Time Series Forecasters to Read, Remember, and Reconcile",
    "Xinyu Guan, Zhirong Zhang, Hongyuan Liu, Pengcheng Xu, Yu Sun, Chen Song, Qianyang Zhao",
  ],
  [
    "How Deep Should a VLA Think When Thinking Costs Time? Budget-Constrained RL for Early Exit",
    "Pengcheng Xu, Qinting Li, Weizhi Du, Yu Sun, Xinyu Guan",
  ],
  [
    "Static Gradient Attribution Underperforms a Density-Matched Random Mask Within LoRA’s B-Matrix",
    "Yu Sun, Junwei Zhou, Zuodong Xiang, Yike Zhang, Pengcheng Xu, Xinyu Guan, Ruoyun Ma, Hailu Xu",
  ],
  [
    "QESChunker: A Single Objective Unifies Overlapping and Non-Overlapping Chunking for RAG",
    "Yifan Zhao, Qianyang Zhao, Xinyu Guan, kai wei, Yuming Deng",
  ],
  [
    "SILICA: Certified Counterfactual Evaluation of Identifiability in Unseen-Language Induction",
    "Pengcheng Xu, Xinyu Guan",
  ],
  [
    "When KL Regularization Fails in Online Reasoning RL: A Token-Level Gradient Contract",
    "Dingding, Runhao Liu, Yongkang Zhang, Zijian Zeng, Yuhao Liao, Xinyu Guan, Huiming Yang",
  ],
  [
    "Advantage Scale Calibration Imbalance in Group-Relative Optimization under Low-Variance Rewards: Diagnosis and Bounded Recovery",
    "Dingding, Runhao Liu, Yongkang Zhang, Zijian Zeng, YUHAO LIAO, Xinyu Guan, Huiming Yang",
  ],
  [
    "Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents",
    "Xinyu Guan, Qianyang Zhao, Yuming Deng",
  ],
  [
    "Optimizing Text Search: A Novel Pattern Matching Algorithm Based on Ukkonen's Approach",
    "Xinyu Guan, Shaohua Zhang",
  ],
  [
    "Basket-Enhanced Heterogenous Hypergraph for Price-Sensitive Next Basket Recommendation",
    "Yuening Zhou, Yulin Wang, Qian Cui, Xinyu Guan, Francisco Cisternas",
  ],
];

test("both pages use the shared editorial skin and retain semantic landmarks", () => {
  for (const [name, page] of Object.entries(pages)) {
    const body = all(page, (node) => node.tag === "body")[0];
    assert.ok(body && hasClass(body, "editorial-page"), `${name} must opt into the editorial skin`);
    assert.equal(withClass(body, "editorial-sidebar").length, 1);
    assert.equal(all(body, (node) => node.tag === "main").length, 1);
    assert.ok(all(body, (node) => node.tag === "nav" && Boolean(node.attrs["aria-label"])).length > 0);
    assert.ok(all(page, (node) => node.tag === "link" && node.attrs.rel === "stylesheet"
      && /^editorial-styles\.css(?:\?|$)/.test(node.attrs.href ?? "")).length === 1,
    `${name} must load editorial-styles.css`);
    assert.ok(all(page, (node) => node.tag === "script" && node.attrs.type === "module"
      && /^phd-main\.js(?:\?|$)/.test(node.attrs.src ?? "")).length === 1);
    const ids = all(page, (node) => Boolean(node.attrs.id)).map((node) => node.attrs.id);
    assert.equal(new Set(ids).size, ids.length, `${name} must not duplicate element ids`);
  }
  assert.ok(existsSync(asset("editorial-styles.css")));
});

test("homepage opens with a real portrait and bilingual identity, then career before papers", () => {
  const hero = withClass(pages.home, "editorial-hero")[0];
  assert.ok(hero, "the homepage must have an editorial hero");
  const copy = withClass(hero, "hero-copy")[0];
  const portrait = withClass(hero, "hero-portrait")[0];
  assert.ok(copy && portrait, "hero must separate copy from portrait");
  assert.match(normalizedText(copy), /Xinyu Guan/);
  assert.match(normalizedText(copy), /关鑫宇/);
  const image = all(portrait, (node) => node.tag === "img")[0];
  assert.ok(image, "hero portrait must be an actual image");
  assert.equal(image.attrs.src, "images/generated/avatar-528.jpg");
  assert.ok(image.attrs.alt?.trim());
  assert.ok(existsSync(asset(image.attrs.src)));
  const experience = byId(pages.home, "experience");
  const papers = byId(pages.home, "papers");
  assert.ok(experience && papers, "career and publication sections must remain directly linkable");
  assert.ok(hero.start < experience.start && experience.start < papers.start,
    "the homepage reading order must be introduction, career, then papers");
  for (const employer of ["TaoTian Group @ Alibaba", "Baidu", "Tencent", "Chinese Academy of Sciences", "Mico World"]) {
    assert.ok(normalizedText(experience).includes(employer), `career must retain ${employer}`);
  }
});

test("four compact career rows preserve all six original scopes and complete expandable details", () => {
  const contracts = [
    ["TaoTian Group @ Alibaba", "AI Agent Researcher · P6", "Feb 2026 — Present", 2],
    ["Baidu · ERNIE Foundation Model", "Senior Research Scientist · T4+", "Oct — Dec 2025", 2],
    ["Tencent · Hunyuan Foundation Model", "Research Scientist · T5", "Feb 2024 — Sep 2025", 8],
    ["Chinese Academy of Sciences", "Research Assistant Intern", "Nov 2023 — Feb 2024", 2],
    ["Mico World / Yoho Department", "Software Engineer", "May 2021 — May 2022", 2],
  ];
  const experience = byId(pages.home, "experience");
  const list = withClass(experience, "experience-list")[0];
  const primaryRows = list.children.filter((node) => typeof node !== "string" && hasClass(node, "experience-item"));
  assert.equal(primaryRows.length, 4, "the default view must show four compact employer rows");
  const appointments = withClass(experience, "experience-item");
  assert.equal(appointments.length, contracts.length);
  contracts.forEach(([employer, role, date, bullets], position) => {
    const appointment = appointments[position];
    assert.equal(normalizedText(all(appointment, (node) => node.tag === "h3")[0]), employer);
    assert.equal(normalizedText(withClass(appointment, "experience-role")[0]), role);
    assert.equal(normalizedText(withClass(appointment, "experience-date")[0]), date);
    assert.ok(normalizedText(withClass(appointment, "experience-intro")[0]).length > 20);
    const details = all(appointment, (node) => node.tag === "details")[0];
    assert.ok(details, `${employer} must retain accessible expandable detail`);
    assert.ok(all(details, (node) => node.tag === "summary").length === 1);
    assert.equal(all(details, (node) => node.tag === "li").length, bullets,
      `${employer} must preserve all original workstream bullets`);
  });
  assert.equal(all(experience, (node) => node.tag === "li").length, 16);
  const earlier = withClass(experience, "earlier-career")[0];
  assert.ok(earlier && earlier.tag === "details" && !Object.hasOwn(earlier.attrs, "open"));
  assert.equal(withClass(earlier, "experience-item")[0], appointments[4], "Mico must remain available in earlier experience");
  assert.match(normalizedText(appointments[1]), /Baidu \/ ERNIE Foundation Model Core Team/);
  assert.match(normalizedText(appointments[3]), /Institute of Information Engineering, Chinese Academy of Sciences/);
  const teams = withClass(appointments[2], "experience-team");
  assert.equal(teams.length, 2, "the two Tencent appointments must retain separate scoped detail");
  const teamContracts = [
    ["Tencent / Hunyuan Text-to-Text Pipeline Team", "Mar 2025 — Sep 2025", ["50B HTML pages/day", "98.33%", "57.14%", "900B", "135"]],
    ["Tencent / Hunyuan Strategy Group 4", "Feb 2024 — Mar 2025", ["934", "+11.7", "+10.2", "20,000 video-hours", "116 file types", "10 QPS", "20,000+ transcripts"]],
  ];
  teamContracts.forEach(([title, date, metrics], position) => {
    const team = teams[position];
    assert.equal(normalizedText(all(team, (node) => node.tag === "h4")[0]), title);
    assert.equal(normalizedText(withClass(team, "experience-team-date")[0]), date);
    assert.equal(normalizedText(withClass(team, "experience-team-role")[0]), "Research Scientist · T5");
    assert.ok(normalizedText(withClass(team, "experience-team-intro")[0]).length > 20);
    assert.equal(all(team, (node) => node.tag === "li").length, 4);
    for (const metric of metrics) assert.ok(normalizedText(team).includes(metric), `${title} must retain ${metric} in its own scope`);
  });
  const alibaba = normalizedText(appointments[0]);
  assert.match(alibaba, /19 business-task optimization runs[^.!?]*without human intervention within the optimization loop/);
  assert.match(alibaba, /offline acceptance snapshot limited to nine categories and 80 inspection checks[^.!?]*97\.54% mean Macro-F1/);
  assert.match(alibaba, /Separately, the current capability supports 30\+ product categories[^.!?]*30K orders per day/);
  assert.equal(withClass(byId(pages.home, "research-experience"), "research-project").length, 6);
  assert.equal(withClass(byId(pages.home, "education"), "education-item").length, 2);
});

test("publication rows retain all eleven papers and the exact runtime-stack survey title", () => {
  const cards = withClass(byId(pages.home, "papers"), "publication-card");
  const titles = cards.map((card) => {
    const headings = all(card, (node) => node.tag === "h3");
    assert.equal(headings.length, 1, "each paper row must have one complete title");
    return normalizedText(headings[0]);
  });
  assert.deepEqual(titles.toSorted(), [...knownPapers.map(([title]) => title), surveyTitle].toSorted());
  for (const card of cards) {
    assert.equal(card.tag, "article", "each publication must remain a semantic article");
    const bodies = withClass(card, "publication-body");
    assert.equal(bodies.length, 1, "each row must group its full text in .publication-body");
    assert.equal(all(bodies[0], (node) => node.tag === "h3").length, 1);
    assert.ok(normalizedText(withClass(bodies[0], "publication-meta")[0]).length > 10,
      "each row must expose venue/status metadata");
    assert.ok(normalizedText(withClass(bodies[0], "publication-summary")[0]).length >= 50,
      "each row must retain a substantive description, not just a title");
  }
  for (const [title, authors] of knownPapers) {
    assert.equal(normalizedText(withClass(publication(title), "publication-authors")[0]), authors,
      `${title} must preserve its verified author order`);
  }
});

test("verified public paper destinations and conservative manuscript states stay attached to their rows", () => {
  const publicLinks = [
    [knownPapers[1][0], "https://arxiv.org/abs/2610.04795"],
    [knownPapers[2][0], "https://openreview.net/forum?id=x6BEwIFvUc"],
    [knownPapers[3][0], "https://openreview.net/forum?id=g54eVrFPPI"],
    [knownPapers[4][0], "https://openreview.net/forum?id=pvrvPinZif"],
    [knownPapers[8][0], "https://arxiv.org/abs/2606.08151"],
    [knownPapers[9][0], "https://arxiv.org/abs/2512.16927"],
    [knownPapers[10][0], "https://doi.org/10.1109/ICASSP49660.2025.10887705"],
  ];
  for (const [title, href] of publicLinks) {
    const card = publication(title);
    const heading = all(card, (node) => node.tag === "h3")[0];
    const link = all(heading, (node) => node.tag === "a" && node.attrs.href === href)[0];
    assert.ok(link, `${title} must keep its verified public destination on the full title`);
    assert.equal(link.attrs.target, "_blank");
    assert.ok((link.attrs.rel ?? "").split(/\s+/).includes("noopener"));
    assert.ok(hasClass(card, "publication-card-linked"));
  }
  const states = [
    [knownPapers[0][0], "In Preparation", /Preparing for CVPR/],
    [knownPapers[1][0], "Submitted", /Submitted to ICASSP 2027/],
    [knownPapers[2][0], "Submitted", /Submitted to ICLR 2027/],
    [knownPapers[3][0], "Submitted", /Submitted to ICLR 2027/],
    [knownPapers[4][0], "Submitted", /Submitted to ICLR 2027/],
    [knownPapers[5][0], "Submitted", /ACL ARR.*Preferred venue: EACL/],
    [knownPapers[6][0], "In Preparation", /Withdrawn from AAAI.*Preparing for ICLR/],
    [knownPapers[7][0], "Submitted", /Submitted to AAAI 2027/],
    [knownPapers[8][0], "Accepted", /ICONIP 2026.*Springer CCIS/],
    [knownPapers[9][0], "Preprint", /arXiv:2512\.16927/],
    [knownPapers[10][0], "Published", /ICASSP 2025/],
  ];
  for (const [title, status, venue] of states) {
    const card = publication(title);
    assert.equal(normalizedText(withClass(card, "status-label")[0]), status);
    assert.match(normalizedText(withClass(card, "publication-meta")[0]), venue);
  }
  for (const index of [0, 5, 6, 7]) {
    const card = publication(knownPapers[index][0]);
    assert.match(normalizedText(card), /Not yet public/i);
    assert.equal(all(card, (node) => node.tag === "a").length, 0,
      "unpublished work must not acquire fabricated public destinations");
  }
});

test("all publication rows have one real figure or an explicitly labeled concept illustration", () => {
  const figures = [
    [knownPapers[1][0], "images/paper-timbre-overview.png"],
    [knownPapers[2][0], "images/paper-vla-early-exit.png"],
    [knownPapers[3][0], "images/paper-lora-attribution.png"],
    [knownPapers[4][0], "images/paper-qeschunker-overview.png"],
    [knownPapers[5][0], "images/paper-silica-identifiability.png"],
    [knownPapers[7][0], "images/paper-advantage-maxnorm-ac.png"],
    [knownPapers[8][0], "images/paper3-cicl-pipeline.png"],
    [knownPapers[9][0], "images/paper2-suffix-tree.png"],
    [knownPapers[10][0], "images/paper1-hypergraph.png"],
  ];
  for (const [title, src] of figures) {
    const card = publication(title);
    assert.ok(all(card, (node) => node.tag === "img" && node.attrs.src === src).length === 1,
      `${title} must retain its corresponding actual figure`);
    assert.equal(withClass(card, "publication-card-figure-illustration").length, 0,
      `${title} must not replace its real figure with a concept illustration`);
    const figure = withClass(card, "publication-card-figure")[0];
    assert.equal(figure.attrs["data-figure-status"], undefined);
    assert.equal(all(figure, (node) => node.tag === "figcaption").length, 0,
      `${title} must retain its original caption-free figure`);
  }
  const illustrations = [
    [knownPapers[0][0], "paper-pivot-cover", /PIVOT/],
    [knownPapers[6][0], "paper-zcpo-cover", /KL/],
    [surveyTitle, "paper-runtime-cover", /Diagnostics and Infrastructure for Foundation Model-Based Multi-Agent Systems/],
  ];
  assert.equal(new Set(illustrations.map(([, stem]) => stem)).size, 3);
  for (const [title, stem, identifier] of illustrations) {
    const figure = withClass(publication(title), "publication-card-figure")[0];
    assert.ok(figure && hasClass(figure, "publication-card-figure-illustration"),
      `${title} must clearly distinguish its concept illustration from verified paper artwork`);
    assert.equal(figure.attrs["data-figure-status"], "illustration");
    const image = all(figure, (node) => node.tag === "img")[0];
    assert.equal(image?.attrs.src, `images/${stem}.png`);
    assert.match(image.attrs.alt, /^Concept illustration for .+; not an original paper figure$/);
    assert.match(image.attrs.alt, identifier, `${title} needs its own accurate concept-illustration description`);
    const source = all(figure, (node) => node.tag === "source")[0];
    assert.deepEqual((source?.attrs.srcset ?? "").split(",").map((candidate) => candidate.replace(/\s+/g, " ").trim()),
      [320, 640, 960].map((width) => `images/generated/${stem}-${width}.webp ${width}w`));
    const captions = all(figure, (node) => node.tag === "figcaption");
    assert.equal(captions.length, 1);
    assert.ok(hasClass(captions[0], "publication-figure-caption"));
    assert.equal(normalizedText(captions[0]), "Concept illustration");
    assert.ok(!Object.hasOwn(captions[0].attrs, "hidden"));
    assert.notEqual(captions[0].attrs["aria-hidden"], "true");
  }
  const cards = withClass(pages.home, "publication-card");
  assert.equal(cards.length, 12);
  const allFigures = withClass(pages.home, "publication-card-figure");
  assert.equal(allFigures.length, 12);
  assert.equal(withClass(pages.home, "publication-card-figure-illustration").length, 3);
  assert.equal(allFigures.filter((figure) => !hasClass(figure, "publication-card-figure-illustration")).length, 9);
  assert.doesNotMatch(source.home, /paper-(?:vla|lora|qeschunker)-cover/,
    "verified PDF figures must replace all three temporary covers");
  assert.doesNotMatch(source.home, /paper-figure-pending|publication-card-figure-pending|data-figure-status=["']pending|Figure pending for/i);
  assert.equal(withClass(pages.home, "publication-card-no-image").length, 0,
    "every article now has a real figure or explicitly labeled concept illustration");
  for (const card of cards) {
    const figures = withClass(card, "publication-card-figure");
    assert.equal(figures.length, 1, "each publication article must have exactly one figure");
    assert.equal(figures[0].tag, "figure");
    assert.equal(all(figures[0], (node) => node.tag === "picture").length, 1);
    const sources = all(figures[0], (node) => node.tag === "source");
    assert.equal(sources.length, 1);
    assert.equal(sources[0].attrs.type, "image/webp");
    assert.equal((sources[0].attrs.sizes ?? "").replace(/\s+/g, " ").trim(),
      "(max-width: 600px) calc(100vw - 40px), (max-width: 1150px) 220px, 40vw");
    const images = all(card, (node) => node.tag === "img");
    assert.equal(images.length, 1, "one publication figure must load one fallback image");
    for (const image of images) {
      assert.match(image.attrs.src ?? "", /^images\//, "publication images must use actual local assets");
      assert.ok(existsSync(asset(image.attrs.src)), `missing image ${image.attrs.src}`);
      assert.ok(image.attrs.alt?.trim(), "publication images need descriptive alt text");
      assert.ok(Number(image.attrs.width) > 0 && Number(image.attrs.height) > 0);
      assert.equal(image.attrs.loading, "lazy");
      assert.equal(image.attrs.decoding, "async");
    }
    assert.equal(withClass(card, "publication-thumb-text").length, 0,
      "text blocks must not masquerade as publication thumbnails");
    for (const thumbnail of all(card, (node) =>
      hasClass(node, "publication-thumb") || hasClass(node, "publication-thumbnail") || hasClass(node, "publication-card-figure"))) {
      assert.ok(all(thumbnail, (node) => node.tag === "img").length > 0,
        "a thumbnail container must contain an actual image");
      const isIllustration = hasClass(thumbnail, "publication-card-figure-illustration");
      assert.equal(normalizedText(thumbnail), isIllustration ? "Concept illustration" : "",
        "only concept illustration containers may have the disclosure caption");
      assert.equal(all(thumbnail, (node) => node.tag === "figcaption").length, isIllustration ? 1 : 0);
    }
  }
});

test("TIMBRE is publicly linked and the survey remains Submitted without invented authors", () => {
  const timbre = publication(knownPapers[1][0]);
  assert.ok(all(timbre, (node) => node.tag === "a" && node.attrs.href === "https://arxiv.org/abs/2610.04795").length > 0);
  assert.doesNotMatch(normalizedText(timbre), /(?:paper )?not yet public/i);
  const survey = publication(surveyTitle);
  assert.match(normalizedText(survey), /Frontiers of Computer Science/);
  assert.doesNotMatch(source.home, /Frontiers in Computer Science|Theoretical Computer Science/);
  assert.match(normalizedText(survey), /\bSubmitted\b/);
  assert.doesNotMatch(normalizedText(survey), /\b(?:Accepted|Published)\b/);
  const authors = withClass(survey, "publication-authors");
  for (const authorLine of authors) {
    assert.match(normalizedText(authorLine), /(?:author.*(?:pending|unconfirmed|not (?:provided|confirmed|available))|(?:pending|unconfirmed).*author)/i,
      "an unknown survey author list must be omitted or explicitly marked as unconfirmed");
    assert.doesNotMatch(normalizedText(authorLine), /Xinyu Guan|关鑫宇/);
  }
});

test("the live Agent is a closed accessible dialog with matching open and close controls", () => {
  const dialog = byId(pages.home, "xinyu-agent-dialog");
  assert.ok(dialog && dialog.tag === "dialog", "Agent must use a native dialog");
  assert.ok(!Object.hasOwn(dialog.attrs, "open"), "Agent dialog must start closed");
  assert.ok(dialog.attrs["aria-labelledby"] && byId(dialog, dialog.attrs["aria-labelledby"]),
    "Agent dialog must have an associated accessible heading");
  const openers = all(pages.home, (node) => Object.hasOwn(node.attrs, "data-agent-open"));
  assert.ok(openers.length > 0, "Agent must have a discoverable opening control");
  for (const opener of openers) {
    assert.equal(opener.tag, "button");
    assert.equal(opener.attrs.type, "button");
    assert.equal(opener.attrs["aria-controls"], "xinyu-agent-dialog");
    assert.ok(opener.attrs["aria-label"] || normalizedText(opener));
  }
  const closers = all(dialog, (node) => Object.hasOwn(node.attrs, "data-agent-close"));
  assert.ok(closers.length > 0);
  for (const closer of closers) {
    assert.equal(closer.tag, "button");
    assert.equal(closer.attrs.type, "button");
    assert.ok(closer.attrs["aria-label"] || normalizedText(closer));
  }
  assert.ok(all(dialog, (node) => node.tag === "form" && Object.hasOwn(node.attrs, "data-agent-form")).length > 0);
  const input = all(dialog, (node) => node.tag === "input")[0];
  assert.ok(input?.attrs["aria-label"]);
  assert.ok(Number(input.attrs.maxlength) > 0 && Number(input.attrs.maxlength) <= 300);
  assert.ok(all(dialog, (node) => node.attrs["aria-live"] === "polite").length > 0);
  assert.match(normalizedText(dialog), /No scripted answer fallback/i);
  assert.ok(all(pages.home, (node) => node.tag === "meta" && node.attrs.name === "xinyu-agent-api"
    && node.attrs.content === "https://xinyu-agent-api.798750933strikerg.workers.dev/api/chat").length === 1);
});

test("the editorial skin declares a white 200px-sidebar layout and small-screen reflow", () => {
  const css = read("editorial-styles.css").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.match(css, /(?:width|--[\w-]*(?:sidebar|rail)[\w-]*|grid-template-columns)\s*:\s*[^;{}]*\b200px\b/i);
  assert.match(css, /background(?:-color)?\s*:\s*(?:#fff(?:fff)?\b|white\b)/i);
  for (const className of ["editorial-sidebar", "editorial-hero", "publication-card", "publication-body"]) {
    assert.match(css, new RegExp(`\\.${className}\\b[^{}]*\\{`));
  }
  const mediaQueries = [...css.matchAll(/@media\s*[^{}]*\(\s*max-width\s*:\s*(\d+)px\s*\)[^{}]*\{/g)];
  assert.ok(mediaQueries.some((match) => Number(match[1]) <= 900), "editorial layout needs a mobile/tablet breakpoint");
  assert.match(css + read("phd-styles.css"), /prefers-reduced-motion/);
});

test("Life Photos retain all eighteen original images in their original sequence", () => {
  const filenames = [
    "life-road-red-shirt.jpg", "life-camera-portrait.jpg", "life-jellyfish-aquarium.jpg",
    "glasgow-graduation-group.jpg", "glasgow-bute-hall-night.jpg", "glasgow-graduation-portrait.jpg",
    "glasgow-arches-portrait.jpg", "glasgow-graduation-contact-sheet.jpg", "glasgow-graduation-reception.jpg",
    "glasgow-graduation-friends.jpg", "ntu-campus.jpg", "seaside-cafe.jpg", "red-pavilion-portrait.jpg",
    "ninghai-swing-seated.jpg", "ninghai-swing-front.jpg", "beach-walk.jpg", "garden-rabbit.jpg", "coastal-temple.jpg",
  ];
  const gallery = withClass(pages.life, "life-gallery")[0];
  assert.ok(gallery, "Life Photos must retain the gallery landmark");
  const images = all(gallery, (node) => node.tag === "img");
  assert.deepEqual(images.map((node) => node.attrs.src), filenames.map((filename) => `images/life/${filename}`));
  for (const image of images) {
    assert.ok(existsSync(asset(image.attrs.src)));
    assert.ok(image.attrs.alt?.trim());
    assert.ok(Number(image.attrs.width) > 0 && Number(image.attrs.height) > 0);
  }
  assert.equal(images.filter((node) => node.attrs.fetchpriority === "high").length, 1);
  assert.equal(images.filter((node) => node.attrs.loading === "lazy").length, 17);
});
