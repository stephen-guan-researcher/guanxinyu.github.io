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
  if (typeof win.IntersectionObserver !== "function") return;
  const observer = new win.IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActiveSection(links, visible.target.id);
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

export function formatAgentModelName(model) {
  if (!model) return "Workers AI";
  if (model === "@cf/meta/llama-4-scout-17b-16e-instruct") return "Llama 4 Scout";
  const slug = model.split("/").at(-1) ?? "";
  return slug.replace(/-instruct$/i, "").replace(/[-_]+/g, " ").trim() || "Workers AI";
}

export function buildAgentReply(question) {
  const normalized = question.trim().toLowerCase();

  if (/paper|publication|aaai|iclr|eacl|icassp|cicl|silica|zcpo|advantage scale|论文|文章/.test(normalized)) {
    return {
      topic: "papers",
      answer: "My recent work includes SILICA, submitted to EACL in August 2026, and Advantage Scale Calibration, submitted to AAAI 2027 in July 2026. The KL regularization manuscript was withdrawn from AAAI and is being prepared for ICLR as of August 2026. ChronoMem is in preparation for ICASSP 2027 as of August 2026. “Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents” by Xinyu Guan, Qianyang Zhao, and Yuming Deng was accepted at ICONIP 2026 for publication in the Springer CCIS proceedings and remains publicly available on arXiv at https://arxiv.org/abs/2606.08151. It is not yet published. My public papers also include the Text Search preprint “Optimizing Text Search: A Novel Pattern Matching Algorithm Based on Ukkonen's Approach” and the ICASSP 2025 paper “Basket-Enhanced Heterogenous Hypergraph for Price-Sensitive Next Basket Recommendation.”",
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
      answer: "I am currently focused on three core directions—AutoResearch, Post-Training, and Agentic RL—with Xianyu AI as a practical application domain. A CVPR manuscript and an Agent Research Survey are also in progress.",
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
  initIcons(win);
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => initSite(document, window));
}
