import test from "node:test";
import assert from "node:assert/strict";
import {
  initSectionNavigation,
  setActiveSection,
  setMenuState,
} from "../phd-main.js";
import * as site from "../phd-main.js";

function fixture() {
  const attrs = new Map();
  const nav = {
    classList: {
      state: false,
      toggle(name, force) {
        assert.equal(name, "is-open");
        this.state = force;
      },
    },
  };
  const toggle = {
    setAttribute(name, value) {
      attrs.set(name, value);
    },
  };
  return { attrs, nav, toggle };
}

test("setMenuState synchronizes visible and accessible menu state", () => {
  const { attrs, nav, toggle } = fixture();
  setMenuState(toggle, nav, true);
  assert.equal(nav.classList.state, true);
  assert.equal(attrs.get("aria-expanded"), "true");
  assert.equal(attrs.get("aria-label"), "Close navigation");
  setMenuState(toggle, nav, false);
  assert.equal(nav.classList.state, false);
  assert.equal(attrs.get("aria-expanded"), "false");
  assert.equal(attrs.get("aria-label"), "Open navigation");
});

test("setActiveSection exposes exactly one current homepage destination", () => {
  const links = ["home", "research", "papers", "experience"].map((id) => ({
    dataset: { sectionLink: id },
    classList: {
      active: false,
      toggle(_name, force) {
        this.active = force;
      },
    },
    attrs: new Map(),
    setAttribute(name, value) {
      this.attrs.set(name, value);
    },
    removeAttribute(name) {
      this.attrs.delete(name);
    },
  }));

  setActiveSection(links, "papers");

  assert.deepEqual(
    links.map((link) => link.classList.active),
    [false, false, true, false],
  );
  assert.equal(links[2].attrs.get("aria-current"), "location");
  assert.equal(links[0].attrs.has("aria-current"), false);
});

test("initSectionNavigation skips observers when links resolve to no local sections", () => {
  const links = ["home", "research", "papers", "experience"].map((id) => ({
    dataset: { sectionLink: id },
  }));
  let observerConstructions = 0;
  class IntersectionObserver {
    constructor() {
      observerConstructions += 1;
    }
  }
  const doc = {
    querySelectorAll(selector) {
      assert.equal(selector, "[data-section-link]");
      return links;
    },
    getElementById() {
      return null;
    },
  };

  initSectionNavigation(doc, { IntersectionObserver });

  assert.equal(observerConstructions, 0);
});

test("initSectionNavigation syncs clicked links without IntersectionObserver", () => {
  const links = ["home", "research", "papers", "experience"].map((id) => ({
    dataset: { sectionLink: id },
    classList: {
      active: id === "home",
      toggle(_name, force) {
        this.active = force;
      },
    },
    attrs: new Map(id === "home" ? [["aria-current", "page"]] : []),
    setAttribute(name, value) {
      this.attrs.set(name, value);
    },
    removeAttribute(name) {
      this.attrs.delete(name);
    },
    addEventListener(name, handler) {
      assert.equal(name, "click");
      this.clickHandler = handler;
    },
  }));
  const sections = new Map(
    links.map((link) => [
      link.dataset.sectionLink,
      { id: link.dataset.sectionLink },
    ]),
  );
  const doc = {
    querySelectorAll() {
      return links;
    },
    getElementById(id) {
      return sections.get(id);
    },
  };

  initSectionNavigation(doc, { location: { hash: "" }, addEventListener() {} });

  assert.equal(typeof links[3].clickHandler, "function");
  links[3].clickHandler();
  assert.deepEqual(
    links.map((link) => link.classList.active),
    [false, false, false, true],
  );
  assert.equal(links[3].attrs.get("aria-current"), "location");
  assert.equal(links[0].attrs.has("aria-current"), false);
});

test("initSectionNavigation initializes active state from a matching location hash", () => {
  const links = ["home", "experience"].map((id) => ({
    dataset: { sectionLink: id },
    classList: {
      active: id === "home",
      toggle(_name, force) {
        this.active = force;
      },
    },
    attrs: new Map(id === "home" ? [["aria-current", "page"]] : []),
    setAttribute(name, value) {
      this.attrs.set(name, value);
    },
    removeAttribute(name) {
      this.attrs.delete(name);
    },
    addEventListener() {},
  }));
  const sections = new Map(
    links.map((link) => [
      link.dataset.sectionLink,
      { id: link.dataset.sectionLink },
    ]),
  );
  const doc = {
    querySelectorAll() {
      return links;
    },
    getElementById(id) {
      return sections.get(id);
    },
  };

  initSectionNavigation(doc, {
    location: { hash: "#experience" },
    addEventListener() {},
  });

  assert.deepEqual(
    links.map((link) => link.classList.active),
    [false, true],
  );
  assert.equal(links[1].attrs.get("aria-current"), "location");
});

test("initSectionNavigation resyncs active state after hash changes", () => {
  const links = ["home", "experience"].map((id) => ({
    dataset: { sectionLink: id },
    classList: {
      active: id === "home",
      toggle(_name, force) {
        this.active = force;
      },
    },
    attrs: new Map(id === "home" ? [["aria-current", "page"]] : []),
    setAttribute(name, value) {
      this.attrs.set(name, value);
    },
    removeAttribute(name) {
      this.attrs.delete(name);
    },
    addEventListener() {},
  }));
  const sections = new Map(
    links.map((link) => [
      link.dataset.sectionLink,
      { id: link.dataset.sectionLink },
    ]),
  );
  const doc = {
    querySelectorAll() {
      return links;
    },
    getElementById(id) {
      return sections.get(id);
    },
  };
  let hashChangeHandler;
  const win = {
    location: { hash: "#home" },
    addEventListener(name, handler) {
      if (name === "hashchange") hashChangeHandler = handler;
      else assert.ok(["scroll", "resize"].includes(name), `unexpected navigation event: ${name}`);
    },
  };

  initSectionNavigation(doc, win);

  assert.equal(typeof hashChangeHandler, "function");
  win.location.hash = "#experience";
  hashChangeHandler();
  assert.deepEqual(
    links.map((link) => link.classList.active),
    [false, true],
  );
  assert.equal(links[1].attrs.get("aria-current"), "location");
});

test("section navigation follows long paper content and DOM position rather than intersection ratio or nav order", () => {
  // Research precedes Papers in navigation, but follows the long paper list in
  // the document. A small visible fraction of Papers must still own the marker.
  const links = ["home", "experience", "research", "papers"].map((id) => ({
    dataset: { sectionLink: id },
    classList: { active: false, toggle(_name, force) { this.active = force; } },
    attrs: new Map(),
    setAttribute(name, value) { this.attrs.set(name, value); },
    removeAttribute(name) { this.attrs.delete(name); },
    addEventListener() {},
  }));
  const geometry = new Map([
    ["home", { top: 0, height: 700 }],
    ["experience", { top: 700, height: 500 }],
    ["papers", { top: 1200, height: 9000 }],
    ["research", { top: 10200, height: 500 }],
  ]);
  let scrollY = 1100;
  const sections = new Map([...geometry].map(([id, bounds]) => [id, {
    id,
    getBoundingClientRect() {
      return { top: bounds.top - scrollY, bottom: bounds.top + bounds.height - scrollY, height: bounds.height };
    },
  }]));
  const listeners = new Map();
  const frames = [];
  let intersectionCallback;
  const win = {
    innerHeight: 800,
    location: { hash: "" },
    addEventListener(name, handler, options) { listeners.set(name, { handler, options }); },
    requestAnimationFrame(callback) { frames.push(callback); return frames.length; },
    IntersectionObserver: class {
      constructor(callback) { intersectionCallback = callback; }
      observe() {}
    },
  };
  const doc = {
    documentElement: { clientHeight: 800 },
    querySelectorAll(selector) {
      if (selector === "[data-section-link]") return links;
      if (selector === "section[id]") return [...sections.values()];
      assert.fail(`unexpected selector ${selector}`);
    },
    getElementById(id) { return sections.get(id); },
  };
  const active = () => links.filter((link) => link.classList.active).map((link) => link.dataset.sectionLink);
  const flushFrames = () => { while (frames.length) frames.shift()(0); };

  initSectionNavigation(doc, win);
  intersectionCallback([
    { target: sections.get("experience"), isIntersecting: true, intersectionRatio: 0.8 },
    { target: sections.get("papers"), isIntersecting: true, intersectionRatio: 0.02 },
  ]);
  assert.deepEqual(active(), ["papers"], "a long paper list must win over a higher-ratio previous section");
  flushFrames();
  const scroll = listeners.get("scroll");
  assert.ok(scroll, "scroll position must update navigation even when intersection thresholds do not change");
  assert.equal(scroll.options?.passive, true);
  scrollY = 6000;
  scroll.handler();
  scroll.handler();
  assert.equal(frames.length, 1, "multiple scroll events must coalesce into one animation frame");
  flushFrames();
  assert.deepEqual(active(), ["papers"], "the marker remains on Papers throughout its long content");
  assert.equal(links[3].attrs.get("aria-current"), "location");

  scrollY = 10100;
  scroll.handler();
  flushFrames();
  assert.deepEqual(active(), ["research"], "Research takes over only when its actual heading passes the marker");
  assert.equal(links[2].attrs.get("aria-current"), "location");
  assert.equal(links[3].attrs.has("aria-current"), false);
});

test("setAgentExpanded keeps the panel and accessible toggle state synchronized", () => {
  assert.equal(typeof site.setAgentExpanded, "function");
  const attrs = new Map();
  const toggle = {
    setAttribute(name, value) {
      attrs.set(name, value);
    },
  };
  const panel = { hidden: true };

  site.setAgentExpanded(toggle, panel, true);
  assert.equal(panel.hidden, false);
  assert.equal(attrs.get("aria-expanded"), "true");
  assert.equal(attrs.get("aria-label"), "Close Xinyu Agent");

  site.setAgentExpanded(toggle, panel, false);
  assert.equal(panel.hidden, true);
  assert.equal(attrs.get("aria-expanded"), "false");
  assert.equal(attrs.get("aria-label"), "Open Xinyu Agent");
});

test("getAgentApiUrl reads a trimmed optional endpoint from page metadata", () => {
  assert.equal(typeof site.getAgentApiUrl, "function");
  assert.equal(site.getAgentApiUrl({ querySelector: () => ({ content: "  https://agent.example/api/chat  " }) }), "https://agent.example/api/chat");
  assert.equal(site.getAgentApiUrl({ querySelector: () => ({ content: "" }) }), "");
  assert.equal(site.getAgentApiUrl({ querySelector: () => null }), "");
});

test("requestAgentAnswer posts a bounded JSON question and validates the provider", async () => {
  assert.equal(typeof site.requestAgentAnswer, "function");
  let request;
  const reply = await site.requestAgentAnswer(
    "https://agent.example/api/chat",
    "What does Xinyu research?",
    {
      fetchImpl: async (url, init) => {
        request = { url, init };
        return {
          ok: true,
          async json() {
            return {
              answer: "Closed-loop research agents.",
              provider: "workers-ai",
              model: "@cf/meta/llama-3.2-3b-instruct",
            };
          },
        };
      },
      timeoutMs: 100,
    },
  );

  assert.equal(request.url, "https://agent.example/api/chat");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers["content-type"], "application/json");
  assert.deepEqual(JSON.parse(request.init.body), { question: "What does Xinyu research?" });
  assert.ok(request.init.signal);
  assert.deepEqual(reply, {
    answer: "Closed-loop research agents.",
    provider: "workers-ai",
    model: "@cf/meta/llama-3.2-3b-instruct",
  });
});

test("resolveAgentReply returns model provenance and never disguises an API failure as an AI answer", async () => {
  assert.equal(typeof site.resolveAgentReply, "function");
  const online = await site.resolveAgentReply("What are you researching now?", {
    apiUrl: "https://agent.example/api/chat",
    fetchImpl: async () => ({
      ok: true,
      async json() {
        return {
          answer: "A remote answer.",
          provider: "workers-ai",
          model: "@cf/meta/llama-3.2-3b-instruct",
        };
      },
    }),
  });
  assert.equal(online.provider, "workers-ai");
  assert.equal(online.model, "@cf/meta/llama-3.2-3b-instruct");
  assert.equal(online.answer, "A remote answer.");
  assert.deepEqual(online.sources, ["research", "experience", "papers"]);

  const unavailable = await site.resolveAgentReply("What are you researching now?", {
    apiUrl: "https://agent.example/api/chat",
    fetchImpl: async () => {
      throw new Error("offline");
    },
  });
  assert.equal(unavailable.provider, "unavailable");
  assert.match(unavailable.answer, /temporarily unavailable/i);
  assert.doesNotMatch(unavailable.answer, /AutoResearch/);
  assert.deepEqual(unavailable.sources, []);
});

test("resolveAgentReply refuses to fabricate an AI answer when no endpoint is configured", async () => {
  const reply = await site.resolveAgentReply("What are you researching now?");

  assert.equal(reply.provider, "unavailable");
  assert.match(reply.answer, /not connected/i);
  assert.doesNotMatch(reply.answer, /AutoResearch/);
  assert.deepEqual(reply.sources, []);
});

test("setAgentPending synchronizes busy and disabled states", () => {
  assert.equal(typeof site.setAgentPending, "function");
  const attrs = new Map();
  const input = { disabled: false };
  const submit = { disabled: false };
  const card = {
    setAttribute(name, value) {
      attrs.set(name, value);
    },
    querySelector(selector) {
      return { "[data-agent-form] input": input, "[data-agent-form] button": submit }[selector] ?? null;
    },
  };

  site.setAgentPending(card, true);
  assert.equal(attrs.get("aria-busy"), "true");
  assert.equal(input.disabled, true);
  assert.equal(submit.disabled, true);

  site.setAgentPending(card, false);
  assert.equal(attrs.get("aria-busy"), "false");
  assert.equal(input.disabled, false);
  assert.equal(submit.disabled, false);
});

test("buildAgentReply grounds research questions in the resume sections", () => {
  assert.equal(typeof site.buildAgentReply, "function");

  const reply = site.buildAgentReply("What are you researching now?");

  assert.equal(reply.topic, "research");
  assert.deepEqual(reply.sources, ["research", "experience", "papers"]);
  assert.match(reply.answer, /AutoResearch/);
  assert.match(reply.answer, /Post-Training/);
  assert.match(reply.answer, /Agentic RL/);
  assert.match(reply.answer, /CVPR manuscript in progress is PIVOT: Choosing When to Refine Prompts or Acquire Evidence for Multimodal Agent Self-Improvement/);
  assert.match(reply.answer, /Agent Research Survey/);
  assert.doesNotMatch(reply.answer, /CVPR 20\d{2}|submitted to CVPR|accepted at CVPR/);
});

test("buildAgentReply returns the concise current Alibaba experience fallback", () => {
  const reply = site.buildAgentReply("Tell me about your work experience");

  assert.equal(reply.topic, "experience");
  assert.deepEqual(reply.sources, ["experience", "research"]);
  for (const fact of [
    "AI Agent Researcher · P6",
    "TaoTian Group @ Alibaba",
    "General AutoResearch",
    "Xianyu Multimodal Quality Inspection",
    "viewpoint compliance detection",
    "base photo-quality checks",
    "visible physical-defect detection",
    "Hunyuan Foundation Model",
    "Yuanbao AI Search",
    "ERNIE Bot 5 (EB5) Foundation Model",
    "knowledge graphs",
    "LLM-based security",
  ]) {
    assert.match(reply.answer, new RegExp(fact.replace(/[()]/g, "\\$&")));
  }
  assert.doesNotMatch(reply.answer, /Post-Training|Agentic RL/);
  assert.doesNotMatch(reply.answer, /19 business-task|8 of 9|279 migration|97\.54%|30K orders/i);
});

test("buildAgentReply exposes WeChat without a public phone number", () => {
  for (const question of ["What is your WeChat?", "你的微信是什么？"]) {
    const reply = site.buildAgentReply(question);
    assert.equal(reply.topic, "contact");
    assert.match(reply.answer, /WeChat: super_lucky_magic/);
    assert.match(reply.answer, /No public phone number is listed/);
    assert.doesNotMatch(reply.answer, /18018735289|\+86 180 1873 5289/);
  }
});

test("buildAgentReply classifies the corrected manuscript venues as publications", () => {
  for (const question of [
    "What is SILICA?",
    "Is the KL paper going to ICLR?",
    "Tell me about the EACL submission",
    "What happened with CICL?",
    "What is TIMBRE?",
    "Explain QESChunker",
    "How does the VLA early exit work?",
    "What is the LoRA paper?",
    "Static Gradient Attribution",
    "ACL ARR",
    "What is PIVOT?",
    "Tell me about CVPR",
    "What is the runtime stack survey?",
    "Diagnostics and Infrastructure for Foundation Model-Based Multi-Agent Systems",
  ]) {
    const reply = site.buildAgentReply(question);
    assert.equal(reply.topic, "papers");
    assert.deepEqual(reply.sources, ["papers", "research"]);
  }

  const reply = site.buildAgentReply("Summarize your latest papers");
  const pivotSummary = reply.answer.split(" TIMBRE:")[0];
  assert.match(pivotSummary, /PIVOT: Choosing When to Refine Prompts or Acquire Evidence for Multimodal Agent Self-Improvement/);
  assert.match(pivotSummary, /Xinyu Guan, Kunjin Chen, Qianyang Zhao, Yu Sun, Pengcheng Xu, and Yuming Deng/);
  assert.match(pivotSummary, /is in preparation for CVPR/);
  assert.match(pivotSummary, /not yet public and has no public paper URL/);
  assert.match(pivotSummary, /no CVPR conference year, submission, or acceptance is confirmed/);
  assert.doesNotMatch(pivotSummary, /https?:\/\/|CVPR 20\d{2}|submitted to CVPR|accepted at CVPR/);
  assert.match(reply.answer, /submitted to ACL ARR in the August 2026 cycle, with EACL as its preferred venue/);
  assert.match(reply.answer, /submitted to AAAI 2027 in July 2026/);
  assert.match(reply.answer, /last confirmed status in August 2026 was in preparation for ICLR, with no later submission verified/);
  assert.match(reply.answer, /TIMBRE: Teaching Time Series Forecasters to Read, Remember, and Reconcile/);
  assert.match(reply.answer, /Xinyu Guan, Zhirong Zhang, Hongyuan Liu, Pengcheng Xu, Yu Sun, Chen Song, and Qianyang Zhao/);
  assert.match(reply.answer, /submitted to ICASSP 2027 \(submission confirmed by the homepage owner on October 3, 2026; exact submission date not listed\)/);
  assert.doesNotMatch(reply.answer, /submitted to ICASSP 2027 in September 2026/);
  assert.match(reply.answer, /replaces the former ChronoMem record/);
  assert.match(reply.answer, /https:\/\/arxiv\.org\/abs\/2610\.04795/);
  assert.match(reply.answer, /https:\/\/github\.com\/stephen-guan-researcher\/TIMBRE/);
  const timbreSummary = reply.answer.split(" TIMBRE:")[1]?.split(" Three ICLR")[0] ?? "";
  assert.doesNotMatch(timbreSummary, /paper is not yet public|paper not yet public/i);
  assert.match(reply.answer, /Diagnostics and Infrastructure for Foundation Model-Based Multi-Agent Systems: A Review of the Runtime Stack/);
  assert.match(reply.answer, /submitted to Frontiers in Computer Science/i);
  assert.doesNotMatch(reply.answer, /ChronoMem is in preparation/);
  assert.match(reply.answer, /Three ICLR 2027 submissions from September 2026/);
  for (const [title, forumId] of [
    ["How Deep Should a VLA Think When Thinking Costs Time? Budget-Constrained RL for Early Exit", "x6BEwIFvUc"],
    ["Static Gradient Attribution Underperforms a Density-Matched Random Mask Within LoRA’s B-Matrix", "g54eVrFPPI"],
    ["QESChunker: A Single Objective Unifies Overlapping and Non-Overlapping Chunking for RAG", "pvrvPinZif"],
  ]) {
    assert.ok(reply.answer.includes(title), `missing current publication ${title}`);
    assert.ok(reply.answer.includes(`https://openreview.net/forum?id=${forumId}`));
  }
  assert.match(reply.answer, /none is confirmed accepted/);
  assert.match(
    reply.answer,
    /Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents/,
  );
  assert.match(reply.answer, /Xinyu Guan, Qianyang Zhao, and Yuming Deng/);
  assert.match(reply.answer, /was accepted at ICONIP 2026/);
  assert.match(reply.answer, /Springer CCIS proceedings/);
  assert.match(reply.answer, /publicly available on arXiv/);
  assert.match(reply.answer, /https:\/\/arxiv\.org\/abs\/2606\.08151/);
  assert.match(reply.answer, /camera-ready v4 was revised on September 21, 2026/);
  assert.match(reply.answer, /It is not yet published\./);
  assert.doesNotMatch(
    reply.answer,
    /Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents[^.]*\b(?:is|was) published\b/i,
  );
});

function createAgentFixture(apiUrl) {
  const attrs = new Map([["aria-expanded", "false"]]);
  const toggle = {
    getAttribute(name) {
      return attrs.get(name);
    },
    setAttribute(name, value) {
      attrs.set(name, value);
    },
    querySelector() {
      return null;
    },
    addEventListener(_name, handler) {
      this.clickHandler = handler;
    },
  };
  const panel = { hidden: true };
  const input = { value: "What are you researching now?", disabled: false, focus() {} };
  const submit = { disabled: false };
  const form = {
    querySelector(selector) {
      return { "input[name='question']": input, "button[type='submit']": submit }[selector] ?? null;
    },
    addEventListener(name, handler) {
      assert.equal(name, "submit");
      this.submitHandler = handler;
    },
  };
  const questionNode = { textContent: "" };
  const statusNode = { textContent: "" };
  let panelWasVisibleWhenAnswerChanged = false;
  const answerNode = {
    set textContent(value) {
      this.value = value;
      panelWasVisibleWhenAnswerChanged = panel.hidden === false;
    },
  };
  const sourceLinks = ["research", "experience", "papers"].map((source) => ({
    dataset: { agentSource: source },
    hidden: false,
  }));
  const card = {
    attrs: new Map(),
    setAttribute(name, value) {
      this.attrs.set(name, value);
    },
    querySelector(selector) {
      return {
        "[data-agent-toggle]": toggle,
        "#xinyu-agent-panel": panel,
        "[data-agent-form]": form,
        "[data-agent-question]": questionNode,
        "[data-agent-answer]": answerNode,
        "[data-agent-status]": statusNode,
        "[data-agent-form] input": input,
        "[data-agent-form] button": submit,
      }[selector] ?? null;
    },
    querySelectorAll(selector) {
      return {
        "[data-agent-source]": sourceLinks,
      }[selector] ?? [];
    },
  };
  const doc = {
    querySelector(selector) {
      return {
        "[data-xinyu-agent]": card,
        "meta[name='xinyu-agent-api']": { content: apiUrl },
      }[selector] ?? null;
    },
  };

  return {
    answerNode,
    attrs,
    card,
    doc,
    form,
    input,
    panel,
    statusNode,
    submit,
    get panelWasVisibleWhenAnswerChanged() {
      return panelWasVisibleWhenAnswerChanged;
    },
  };
}

test("formatAgentModelName maps the deployed model without stale hard-coded copy", () => {
  assert.equal(
    site.formatAgentModelName("@cf/meta/llama-4-scout-17b-16e-instruct"),
    "Llama 4 Scout",
  );
  assert.equal(site.formatAgentModelName("@cf/example/future-model"), "future model");
  assert.equal(site.formatAgentModelName(""), "Workers AI");
});

test("Agent topic routing keeps current research and Alibaba fallback aligned", () => {
  const research = site.buildAgentReply("What are you researching now?");
  const experience = site.buildAgentReply("What do you do at Alibaba?");
  assert.match(research.answer, /Xianyu AI/);
  assert.match(experience.answer, /AI Agent Researcher · P6/);
  assert.match(experience.answer, /TaoTian Group @ Alibaba/);
  assert.match(experience.answer, /General AutoResearch/);
  assert.match(experience.answer, /Xianyu Multimodal Quality Inspection/);
  assert.match(
    experience.answer,
    /viewpoint compliance detection, base photo-quality checks, and visible physical-defect detection/,
  );
});

test("initAgent reveals the live region before writing a submitted answer", async () => {
  const fixture = createAgentFixture("");
  const {
    answerNode,
    attrs,
    card,
    doc,
    form,
    input,
    statusNode,
    submit,
  } = fixture;

  site.initAgent(doc);
  await form.submitHandler({ preventDefault() {} });

  assert.equal(fixture.panelWasVisibleWhenAnswerChanged, true);
  assert.equal(attrs.get("aria-expanded"), "true");
  assert.equal(input.value, "");
  assert.match(answerNode.value, /not connected/i);
  assert.doesNotMatch(answerNode.value, /AutoResearch/);
  assert.equal(statusNode.textContent, "Live AI is not connected yet · no fallback answer was generated.");
  assert.equal(card.attrs.get("aria-busy"), "false");
  assert.equal(input.disabled, false);
  assert.equal(submit.disabled, false);
});

test("initAgent renders the model returned by the successful Worker response", async () => {
  const { doc, form, statusNode } = createAgentFixture("https://agent.example/api/chat");
  site.initAgent(doc, {
    fetchImpl: async () => ({
      ok: true,
      async json() {
        return {
          answer: "A grounded answer.",
          provider: "workers-ai",
          model: "@cf/meta/llama-4-scout-17b-16e-instruct",
        };
      },
    }),
  });
  await form.submitHandler({ preventDefault() {} });
  assert.equal(
    statusNode.textContent,
    "Answered by Llama 4 Scout through Workers AI · grounded in this public profile.",
  );
});
