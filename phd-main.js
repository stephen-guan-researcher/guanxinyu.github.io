export function setMenuState(toggle, nav, open) {
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

export function initMenu(doc) {
  const toggle = doc.getElementById("menuToggle");
  const nav = doc.getElementById("siteNav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    setMenuState(toggle, nav, toggle.getAttribute("aria-expanded") !== "true");
  });
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuState(toggle, nav, false));
  });
}

export function setActiveSection(links, sectionId) {
  links.forEach((link) => {
    const active = link.dataset.sectionLink === sectionId;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

export function initSectionNavigation(doc, win) {
  const links = [...doc.querySelectorAll("[data-section-link]")];
  if (!links.length) return;
  const sections = links
    .map((link) => doc.getElementById(link.dataset.sectionLink))
    .filter(Boolean);
  if (!sections.length) return;
  const sectionIds = new Set(sections.map((section) => section.id));
  const syncFromHash = () => {
    const hashSectionId = win.location?.hash?.replace(/^#/, "");
    if (sectionIds.has(hashSectionId)) setActiveSection(links, hashSectionId);
  };
  syncFromHash();
  win.addEventListener?.("hashchange", syncFromHash);
  links
    .filter((link) => sectionIds.has(link.dataset.sectionLink))
    .forEach((link) => {
      link.addEventListener("click", () => {
        setActiveSection(links, link.dataset.sectionLink);
      });
    });
  const syncFromScroll = () => {
    const positions = sections
      .filter((section) => typeof section.getBoundingClientRect === "function")
      .map((section) => ({ id: section.id, top: section.getBoundingClientRect().top }))
      .sort((a, b) => a.top - b.top);
    if (!positions.length) return;
    const marker = Math.min(180, Math.max(90, (win.innerHeight ?? 800) * 0.2));
    const current = positions.filter((section) => section.top <= marker).at(-1) ?? positions[0];
    setActiveSection(links, current.id);
  };
  let scrollScheduled = false;
  win.addEventListener?.("scroll", () => {
    if (typeof win.requestAnimationFrame !== "function") {
      syncFromScroll();
      return;
    }
    if (scrollScheduled) return;
    scrollScheduled = true;
    win.requestAnimationFrame(() => {
      scrollScheduled = false;
      syncFromScroll();
    });
  }, { passive: true });
  if (typeof win.IntersectionObserver !== "function") return;
  const observer = new win.IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActiveSection(links, visible.target.id);
    syncFromScroll();
  }, { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.2, 0.5] });
  sections.forEach((section) => observer.observe(section));
}

export function setAgentExpanded(toggle, panel, expanded) {
  panel.hidden = !expanded;
  toggle.setAttribute("aria-expanded", String(expanded));
  toggle.setAttribute("aria-label", expanded ? "Close Xinyu Agent" : "Open Xinyu Agent");
  const icon = toggle.querySelector?.("i");
  if (icon) icon.className = expanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line";
}

export function initAgentDialog(doc, win) {
  const dialog = doc.getElementById("xinyu-agent-dialog");
  if (!dialog) return;
  const openers = [...doc.querySelectorAll("[data-agent-open]")];
  const closeButton = dialog.querySelector("[data-agent-close]");
  const toggle = dialog.querySelector("[data-agent-toggle]");
  const panel = dialog.querySelector("#xinyu-agent-panel");
  const input = dialog.querySelector("input[name='question']");
  let lastOpener;

  const close = () => {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    openers.forEach((opener) => opener.setAttribute("aria-expanded", "false"));
    lastOpener?.focus();
  };
  const open = (opener) => {
    lastOpener = opener ?? lastOpener;
    if (!dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    if (toggle && panel) setAgentExpanded(toggle, panel, true);
    openers.forEach((button) => button.setAttribute("aria-expanded", "true"));
    if (!input?.disabled) input?.focus();
  };

  openers.forEach((opener) => {
    opener.setAttribute("aria-expanded", "false");
    opener.addEventListener("click", () => open(opener));
  });
  closeButton?.addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  dialog.querySelectorAll("[data-agent-source]").forEach((link) => {
    link.addEventListener("click", close);
  });
  const openFromHash = () => {
    if (win.location?.hash === "#ask-xinyu") open(openers[0]);
  };
  win.addEventListener?.("hashchange", openFromHash);
  openFromHash();
}

export function formatAgentModelName(model) {
  if (!model) return "Workers AI";
  if (model === "@cf/meta/llama-4-scout-17b-16e-instruct") return "Llama 4 Scout";
  const slug = model.split("/").at(-1) ?? "";
  return slug.replace(/-instruct$/i, "").replace(/[-_]+/g, " ").trim() || "Workers AI";
}

export function buildAgentReply(question) {
  const normalized = question.trim().toLowerCase();

  if (/paper|publication|aaai|iclr|eacl|acl arr|icassp|cvpr|cicl|silica|zcpo|pivot|timbre|qeschunker|vla|lora|static gradient attribution|advantage scale|frontiers|diagnostics and infrastructure|runtime stack|survey|论文|文章|综述/.test(normalized)) {
    return {
      topic: "papers",
      answer: "PIVOT: Choosing When to Refine Prompts or Acquire Evidence for Multimodal Agent Self-Improvement, by Xinyu Guan, Kunjin Chen, Qianyang Zhao, Yu Sun, Pengcheng Xu, and Yuming Deng, is in preparation for CVPR. It is not yet public and has no public paper URL; no CVPR conference year, submission, or acceptance is confirmed. TIMBRE: Teaching Time Series Forecasters to Read, Remember, and Reconcile, by Xinyu Guan, Zhirong Zhang, Hongyuan Liu, Pengcheng Xu, Yu Sun, Chen Song, and Qianyang Zhao, was submitted to ICASSP 2027 (submission confirmed by the homepage owner on October 3, 2026; exact submission date not listed). It replaces the former ChronoMem record; the paper is publicly available at https://arxiv.org/abs/2610.04795, and its code is available at https://github.com/stephen-guan-researcher/TIMBRE. Three ICLR 2027 submissions from September 2026 are publicly available on OpenReview: “How Deep Should a VLA Think When Thinking Costs Time? Budget-Constrained RL for Early Exit” (https://openreview.net/forum?id=x6BEwIFvUc), “Static Gradient Attribution Underperforms a Density-Matched Random Mask Within LoRA’s B-Matrix” (https://openreview.net/forum?id=g54eVrFPPI), and “QESChunker: A Single Objective Unifies Overlapping and Non-Overlapping Chunking for RAG” (https://openreview.net/forum?id=pvrvPinZif); none is confirmed accepted. SILICA was submitted to ACL ARR in the August 2026 cycle, with EACL as its preferred venue, and Advantage Scale Calibration was submitted to AAAI 2027 in July 2026. The KL regularization manuscript was withdrawn from AAAI; its last confirmed status in August 2026 was in preparation for ICLR, with no later submission verified. “Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents” by Xinyu Guan, Qianyang Zhao, and Yuming Deng was accepted at ICONIP 2026 for publication in the Springer CCIS proceedings and remains publicly available on arXiv at https://arxiv.org/abs/2606.08151; its camera-ready v4 was revised on September 21, 2026. It is not yet published. The survey “Diagnostics and Infrastructure for Foundation Model-Based Multi-Agent Systems: A Review of the Runtime Stack” was submitted to Frontiers in Computer Science. Its homepage label is Submitted, describing its submission history; no acceptance or active review is claimed, and its author list is not confirmed here. My public papers also include the Text Search preprint “Optimizing Text Search: A Novel Pattern Matching Algorithm Based on Ukkonen's Approach” and the ICASSP 2025 paper “Basket-Enhanced Heterogenous Hypergraph for Price-Sensitive Next Basket Recommendation.”",
      sources: ["papers", "research"],
    };
  }

  if (/work|experience|alibaba|taotian|baidu|tencent|academy|工作|经历|阿里|百度|腾讯/.test(normalized)) {
    return {
      topic: "experience",
      answer: "As an AI Agent Researcher · P6 at TaoTian Group @ Alibaba, I work across two areas: General AutoResearch, building Agent runtime support for autonomous prompt iteration and optimization; and Xianyu Multimodal Quality Inspection, covering viewpoint compliance detection, base photo-quality checks, and visible physical-defect detection. Previously, I contributed to the Hunyuan Foundation Model at Tencent through mathematical and biomedical capability enhancement, pre-training data, multilingual capability improvement, and Yuanbao AI Search; at Baidu, I worked on multilingual capability enhancement for the ERNIE Bot 5 (EB5) Foundation Model. Earlier, at the Chinese Academy of Sciences, I conducted research on knowledge graphs and LLM-based security.",
      sources: ["experience", "research"],
    };
  }

  if (/contact|email|wechat|collaborat|reach|联系|合作|邮箱|微信/.test(normalized)) {
    return {
      topic: "contact",
      answer: "You can reach me by email at xinyuguanphd@outlook.com or WeChat: super_lucky_magic. No public phone number is listed. I am open to conversations about AutoResearch, post-training, agentic RL, and practical AI Agent systems.",
      sources: ["research", "experience"],
    };
  }

  if (/research|autoresearch|post[- ]?training|agentic|reinforcement|研究|方向/.test(normalized)) {
    return {
      topic: "research",
      answer: "I am currently focused on three core directions—AutoResearch, Post-Training, and Agentic RL—with Xianyu AI as a practical application domain. The CVPR manuscript in progress is PIVOT: Choosing When to Refine Prompts or Acquire Evidence for Multimodal Agent Self-Improvement. The runtime-stack Agent Research Survey was submitted to Frontiers in Computer Science; its homepage label describes past submission, not acceptance or active review.",
      sources: ["research", "experience", "papers"],
    };
  }

  return {
    topic: "overview",
    answer: "I can help you explore Xinyu's research directions, publications, work experience, or collaboration interests. Try asking what he is researching now or which recent paper to read first.",
    sources: ["research", "papers", "experience"],
  };
}

export function getAgentApiUrl(doc) {
  const meta = doc.querySelector("meta[name='xinyu-agent-api']");
  return typeof meta?.content === "string" ? meta.content.trim() : "";
}

export async function requestAgentAnswer(
  apiUrl,
  question,
  { fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {},
) {
  const trimmedQuestion = question.trim();
  if (!apiUrl || typeof fetchImpl !== "function") {
    throw new Error("The live Agent service is not configured");
  }
  if (trimmedQuestion.length < 1 || trimmedQuestion.length > 300) {
    throw new RangeError("Question must be 1 to 300 characters");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
  try {
    const response = await fetchImpl(apiUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: trimmedQuestion }),
      signal: controller.signal,
    });
    if (!response?.ok) throw new Error(`Agent service returned ${response?.status ?? "an error"}`);

    const payload = await response.json();
    const answer = typeof payload?.answer === "string" ? payload.answer.trim() : "";
    const model = typeof payload?.model === "string" ? payload.model.trim() : "";
    if (!answer || payload?.provider !== "workers-ai" || !model.startsWith("@cf/")) {
      throw new Error("Agent service returned an invalid response");
    }
    return { answer, provider: "workers-ai", model };
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveAgentReply(
  question,
  { apiUrl = "", fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {},
) {
  const localReply = buildAgentReply(question);
  if (!apiUrl) {
    return {
      ...localReply,
      answer: "The live AI model is not connected yet.",
      provider: "unavailable",
      sources: [],
    };
  }

  try {
    const remoteReply = await requestAgentAnswer(apiUrl, question, { fetchImpl, timeoutMs });
    return { ...localReply, ...remoteReply };
  } catch {
    return {
      ...localReply,
      answer: "The live AI model is temporarily unavailable. Please try again in a moment.",
      provider: "unavailable",
      sources: [],
    };
  }
}

export function setAgentPending(card, pending) {
  card.setAttribute("aria-busy", String(pending));
  const input = card.querySelector("[data-agent-form] input");
  const submit = card.querySelector("[data-agent-form] button");
  if (input) input.disabled = pending;
  if (submit) submit.disabled = pending;
}

function renderAgentReply(card, question, reply) {
  const questionNode = card.querySelector("[data-agent-question]");
  const answerNode = card.querySelector("[data-agent-answer]");
  if (questionNode) questionNode.textContent = question;
  if (answerNode) answerNode.textContent = reply.answer;
  card.querySelectorAll("[data-agent-source]").forEach((link) => {
    link.hidden = !reply.sources.includes(link.dataset.agentSource);
  });
}

export function initAgent(doc, { fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) {
  const card = doc.querySelector("[data-xinyu-agent]");
  if (!card) return;

  const toggle = card.querySelector("[data-agent-toggle]");
  const panel = card.querySelector("#xinyu-agent-panel");
  const form = card.querySelector("[data-agent-form]");
  const input = form?.querySelector("input[name='question']");
  const status = card.querySelector("[data-agent-status]");
  const apiUrl = getAgentApiUrl(doc);
  if (!toggle || !panel || !form || !input) return;

  toggle.addEventListener("click", () => {
    setAgentExpanded(toggle, panel, toggle.getAttribute("aria-expanded") !== "true");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) {
      input.focus();
      return;
    }
    setAgentExpanded(toggle, panel, true);
    renderAgentReply(card, question, {
      answer: apiUrl
        ? "Thinking with the live language model…"
        : "The live AI model is not connected yet.",
      sources: [],
    });
    if (status) status.textContent = apiUrl
      ? "Thinking with Workers AI…"
      : "Finding the best answer on this page…";
    setAgentPending(card, true);
    input.value = "";

    try {
      const reply = await resolveAgentReply(question, { apiUrl, fetchImpl, timeoutMs });
      renderAgentReply(card, question, reply);
      if (status) {
        status.textContent = reply.provider === "workers-ai"
          ? `Answered by ${formatAgentModelName(reply.model)} through Workers AI · grounded in this public profile.`
          : apiUrl
            ? "Live AI is temporarily unavailable · no fallback answer was generated."
            : "Live AI is not connected yet · no fallback answer was generated.";
      }
    } finally {
      setAgentPending(card, false);
    }
  });
}

export function initIcons(win) {
  if (win.lucide) {
    win.lucide.createIcons({ attrs: { "stroke-width": 1.5 } });
  }
}

function showCopyToast(doc, message) {
  doc.getElementById("copy-toast")?.remove();
  const toast = doc.createElement("div");
  toast.id = "copy-toast";
  toast.textContent = message;
  toast.style.cssText = [
    "position:fixed", "bottom:28px", "left:50%", "transform:translateX(-50%)",
    "background:#334155", "color:#fff", "padding:8px 20px", "border-radius:8px",
    "font-size:0.85rem", "font-weight:600", "z-index:9999",
    "box-shadow:0 4px 16px rgba(0,0,0,0.18)", "letter-spacing:0.01em",
    "transition:opacity 0.3s",
  ].join(";");
  doc.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function legacyCopy(doc, text, message) {
  const textarea = doc.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.cssText = "position:fixed;top:0;left:0;width:2em;height:2em;opacity:0;pointer-events:none;";
  doc.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let copied = false;
  try {
    copied = doc.execCommand("copy");
  } catch {
    // The source value remains available in the toast when copying is unavailable.
  }
  textarea.remove();
  showCopyToast(doc, copied ? message : text);
}

function copyToClipboard(doc, win, text, message) {
  const clipboard = win.navigator?.clipboard;
  if (clipboard?.writeText) {
    clipboard.writeText(text).then(
      () => showCopyToast(doc, message),
      () => legacyCopy(doc, text, message),
    );
    return;
  }
  legacyCopy(doc, text, message);
}

export function initCopyActions(doc, win) {
  const actions = [
    ["wechatCopyBtn", "data-wechat", "WeChat ID copied!"],
    ["contactMeBtn", "data-email", "Email copied!"],
  ];
  actions.forEach(([id, attribute, message]) => {
    const action = doc.getElementById(id);
    if (action) {
      action.addEventListener("click", () => {
        copyToClipboard(doc, win, action.getAttribute(attribute), message);
      });
    }
  });
}

export function initSite(doc, win) {
  initMenu(doc);
  initCopyActions(doc, win);
  initSectionNavigation(doc, win);
  initAgent(doc);
  initAgentDialog(doc, win);
  initIcons(win);
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => initSite(document, window));
}
