import assert from "node:assert/strict";
import test from "node:test";

import { handleRequest } from "../src/index.mjs";

const approvedOrigin = "https://guanxinyu.github.io";

function request(path = "/api/chat", options = {}) {
  const { headers = {}, ...init } = options;
  return new Request(`https://worker.example${path}`, {
    ...init,
    headers: { origin: approvedOrigin, ...headers },
  });
}

function createEnv({
  rateLimit = { success: true },
  modelResult = { response: "Xinyu studies reliable AI agents." },
  modelError,
  onLimit,
  onRun,
} = {}) {
  return {
    AGENT_RATE_LIMITER: {
      async limit(options) {
        onLimit?.(options);
        return rateLimit;
      },
    },
    AI: {
      async run(model, options) {
        onRun?.(model, options);
        if (modelError) throw modelError;
        return modelResult;
      },
    },
  };
}

test("allows an approved-origin preflight request", async () => {
  const response = await handleRequest(request("/api/chat", {
    method: "OPTIONS",
    headers: { "access-control-request-method": "POST" },
  }), createEnv());

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), approvedOrigin);
  assert.equal(response.headers.get("access-control-allow-methods"), "POST, OPTIONS");
});

test("rejects a request from an unapproved origin", async () => {
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { origin: "https://untrusted.example", "content-type": "application/json" },
    body: JSON.stringify({ question: "What does Xinyu research?" }),
  }), createEnv());

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "Origin not allowed" });
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("rejects unsupported routes before handling a chat request", async () => {
  const response = await handleRequest(request("/not-chat", { method: "POST" }), createEnv());

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Not found" });
});

test("rejects methods other than POST and OPTIONS", async () => {
  const response = await handleRequest(request("/api/chat", { method: "GET" }), createEnv());

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: "Method not allowed" });
});

test("rejects requests without a JSON content type", async () => {
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    body: JSON.stringify({ question: "What does Xinyu research?" }),
  }), createEnv());

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Expected JSON request body" });
});

test("rejects JSON lookalike media types", async () => {
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/jsonp" },
    body: JSON.stringify({ question: "What does Xinyu research?" }),
  }), createEnv());

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Expected JSON request body" });
});

test("rejects malformed JSON", async () => {
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  }), createEnv());

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Invalid JSON request body" });
});

test("rejects an empty trimmed question", async () => {
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "   " }),
  }), createEnv());

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Question must be 1 to 300 characters" });
});

test("rejects questions longer than 300 trimmed characters", async () => {
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "a".repeat(301) }),
  }), createEnv());

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Question must be 1 to 300 characters" });
});

test("returns 429 when the visitor exceeds the rate limit", async () => {
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.5" },
    body: JSON.stringify({ question: "What does Xinyu research?" }),
  }), createEnv({ rateLimit: { success: false } }));

  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "Rate limit exceeded" });
});

test("checks the rate limit before reading a request body", async () => {
  const unreadableBody = new ReadableStream({
    start(controller) {
      controller.error(new Error("request body should not be read"));
    },
  });
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: unreadableBody,
    duplex: "half",
  }), createEnv({ rateLimit: { success: false } }));

  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "Rate limit exceeded" });
});

test("rejects request bodies larger than 16 KiB", async () => {
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: new Uint8Array(16 * 1024 + 1),
  }), createEnv());

  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: "Request body too large" });
});

test("returns a Workers AI answer for a valid question", async () => {
  let invocation;
  const env = createEnv({
    onRun(model, options) {
      invocation = { model, options };
    },
  });
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "What does Xinyu research?" }),
  }), env);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    answer: "Xinyu studies reliable AI agents.",
    provider: "workers-ai",
    model: "@cf/meta/llama-4-scout-17b-16e-instruct",
  });
  assert.equal(invocation.model, "@cf/meta/llama-4-scout-17b-16e-instruct");
  assert.equal(invocation.options.max_tokens, 400);
  assert.equal(invocation.options.temperature, 0);
  assert.equal(invocation.options.messages[1].content, "What does Xinyu research?");
  const systemMessage = invocation.options.messages[0].content;
  assert.match(systemMessage, /University of Glasgow professor and University of Oxford graduate/i);
  assert.match(systemMessage, /Xinyu Guan is the first author of ChronoMem/i);
  assert.match(systemMessage, /Optimizing Text Search:[\s\S]*Xinyu Guan and Shaohua Zhang/i);
  assert.match(systemMessage, /Basket-Enhanced Heterogenous Hypergraph[\s\S]*Yuening Zhou[\s\S]*Francisco Cisternas/i);
  assert.match(systemMessage, /arXiv:2512\.16927[\s\S]*Nov(?:ember)? 2025/i);
  assert.match(systemMessage, /10\.1109\/ICASSP49660\.2025\.10887705/);
  assert.match(systemMessage, /arxiv\.org\/abs\/2409\.11695/);
  assert.match(systemMessage, /applied in Xianyu AI systems/i);
  assert.match(systemMessage, /across AutoResearch, post-training, and agentic reinforcement learning, applied in Xianyu AI systems/i);
  assert.doesNotMatch(systemMessage, /spanning AutoResearch, post-training, agentic reinforcement learning, and applied Xianyu AI systems/i);
  assert.match(systemMessage, /TaoTian Group @ Alibaba/);
  assert.match(systemMessage, /CVPR manuscript/i);
  assert.match(systemMessage, /Agent Research Survey/i);
  assert.match(
    systemMessage,
    /When KL Regularization Fails[\s\S]*Dingding, Runhao Liu, Yongkang Zhang, Zijian Zeng, Yuhao Liao, Xinyu Guan, and Huiming Yang/i,
  );
  assert.match(
    systemMessage,
    /Advantage Scale Calibration[\s\S]*Dingding, Runhao Liu, Yongkang Zhang, Zijian Zeng, Yuhao Liao, Xinyu Guan, and Huiming Yang/i,
  );
  assert.match(systemMessage, /November 2023 to February 2024/);
  assert.doesNotMatch(systemMessage, /University of Oxford\) on efficient text search algorithms/);
  assert.match(invocation.options.messages[0].content, /seven publication and manuscript records/i);
  assert.match(invocation.options.messages[0].content, /SILICA[\s\S]*submitted to EACL/i);
  assert.match(invocation.options.messages[0].content, /authors of SILICA are Pengcheng Xu and Xinyu Guan, in that order/i);
  assert.match(invocation.options.messages[0].content, /When KL Regularization Fails[\s\S]*being prepared for ICLR as of August 2026/i);
  assert.match(invocation.options.messages[0].content, /Advantage Scale Calibration[\s\S]*submitted to AAAI 2027 in July 2026/i);
  for (const organization of ["Alibaba", "Baidu", "Tencent", "Chinese Academy of Sciences"]) {
    assert.match(invocation.options.messages[0].content, new RegExp(organization, "i"));
  }
  assert.match(invocation.options.messages[0].content, /University of Glasgow/i);
  for (const fact of [
    "AI agent research",
    "Hunyuan Foundation Model",
    "Yuanbao AI Search",
    "ERNIE Bot 5 (EB5) Foundation Model",
    "knowledge graphs",
    "LLM-based security",
  ]) {
    assert.match(invocation.options.messages[0].content, new RegExp(fact.replace(/[()]/g, "\\$&"), "i"));
  }
  assert.match(invocation.options.messages[0].content, /xinyuguanphd@outlook\.com/i);
  assert.match(invocation.options.messages[0].content, /do not invent/i);
  assert.match(invocation.options.messages[0].content, /same language/i);
  assert.match(invocation.options.messages[0].content, /answer only the question asked/i);
  assert.match(invocation.options.messages[0].content, /do not add unrelated publications/i);
});

test("keeps broad multi-employer work questions unmodified", async () => {
  let invocation;
  const env = createEnv({
    onRun(model, options) {
      invocation = { model, options };
    },
  });
  const question = "What did Xinyu work on at Alibaba, Tencent, Baidu, and the Chinese Academy of Sciences?";

  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
  }), env);

  assert.equal(response.status, 200);
  assert.equal(invocation.options.messages[1].content, question);
});

test("grounds first-person biographical questions in the homepage owner profile", async () => {
  let invocation;
  const env = createEnv({
    onRun(model, options) {
      invocation = { model, options };
    },
  });

  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "我是谁" }),
  }), env);

  assert.equal(response.status, 200);
  const userMessage = invocation.options.messages[1].content;
  assert.notEqual(userMessage, "我是谁");
  assert.match(userMessage, /about Xinyu Guan \/ 关鑫宇/i);
  assert.match(userMessage, /not a request to identify the visitor/i);
  assert.match(userMessage, /same language/i);
  assert.match(userMessage, /name, current role, and current research/i);
  assert.match(userMessage, /exact terms AutoResearch, Post-Training, and Agentic RL/i);
  assert.match(userMessage, /Original question: 我是谁/);
  const systemMessage = invocation.options.messages[0].content;
  assert.match(systemMessage, /Xinyu Guan \/ 关鑫宇/);
  assert.match(systemMessage, /first-person biographical questions/i);
  assert.match(systemMessage, /我是谁/);
  assert.match(systemMessage, /homepage owner/i);
  assert.match(systemMessage, /must not claim.*visitor/i);
});

test("preserves AI Agent as an untranslated role term in Chinese answers", async () => {
  let invocation;
  const env = createEnv({
    onRun(model, options) {
      invocation = { model, options };
    },
  });

  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "我是谁" }),
  }), env);

  assert.equal(response.status, 200);
  const systemMessage = invocation.options.messages[0].content;
  const userMessage = invocation.options.messages[1].content;
  assert.match(systemMessage, /exact Chinese role title "AI Agent 研究员"/i);
  assert.match(systemMessage, /never translate "AI Agent" as "AI代理"/i);
  assert.match(userMessage, /use the exact Chinese role title "AI Agent 研究员"/i);
});

test("resolves first-person graduate-school questions with canonical institution names", async () => {
  let invocation;
  const env = createEnv({
    onRun(model, options) {
      invocation = { model, options };
    },
  });

  const question = "我研究生是哪个大学毕业的";
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
  }), env);

  assert.equal(response.status, 200);
  const systemMessage = invocation.options.messages[0].content;
  const userMessage = invocation.options.messages[1].content;
  assert.match(systemMessage, /格拉斯哥大学（University of Glasgow）/);
  assert.match(systemMessage, /湖北大学（Hubei University）/);
  assert.notEqual(userMessage, question);
  assert.match(userMessage, /exact canonical school name "格拉斯哥大学（University of Glasgow）"/i);
  assert.match(userMessage, /answer in second person.*not "我是"/i);
  assert.match(userMessage, /Original question: 我研究生是哪个大学毕业的/);
});

test("provides the three verified patent records to Workers AI", async () => {
  let invocation;
  const env = createEnv({
    onRun(model, options) {
      invocation = { model, options };
    },
  });

  const question = "我的专利有哪些";
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
  }), env);

  assert.equal(response.status, 200);
  const systemMessage = invocation.options.messages[0].content;
  const userMessage = invocation.options.messages[1].content;
  assert.match(systemMessage, /First Inventor of "A Multi-Agent and LLM Collaborative Multi-Dimensional Text Quality Scoring System"[^.]*under review[^.]*November 2025/i);
  assert.match(systemMessage, /First Inventor of the granted patent "A Generative Large Model Watermarking Tool Based on Probability Perturbation Encryption"[^.]*July 2024/i);
  assert.match(systemMessage, /Co-Inventor of the granted patent "A Database Drag Behavior Detection Method Based on Time Series"[^.]*June 2024/i);
  assert.notEqual(userMessage, question);
  assert.match(userMessage, /include all three verified patent records/i);
  assert.match(userMessage, /under-review record as well as the two granted records/i);
  assert.match(userMessage, /for each record, state the inventor role and legal status/i);
  assert.match(userMessage, /第一发明人/);
  assert.match(userMessage, /共同发明人/);
  for (const title of [
    "A Multi-Agent and LLM Collaborative Multi-Dimensional Text Quality Scoring System",
    "A Generative Large Model Watermarking Tool Based on Probability Perturbation Encryption",
    "A Database Drag Behavior Detection Method Based on Time Series",
  ]) {
    assert.match(userMessage, new RegExp(title));
  }
  assert.match(userMessage, /Original question: 我的专利有哪些/);
});

test("routes natural first-person career-date questions with complete dates", async () => {
  let invocation;
  const env = createEnv({
    onRun(model, options) {
      invocation = { model, options };
    },
  });

  const question = "我什么时候在腾讯工作";
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
  }), env);

  assert.equal(response.status, 200);
  const systemMessage = invocation.options.messages[0].content;
  const userMessage = invocation.options.messages[1].content;
  for (const datedRole of [
    "February 2026 to present",
    "October 2025 to December 2025",
    "March 2025 to September 2025",
    "February 2024 to March 2025",
    "November 2023 to February 2024",
    "May 2021 to May 2022",
  ]) {
    assert.match(systemMessage, new RegExp(datedRole, "i"));
  }
  assert.notEqual(userMessage, question);
  assert.match(userMessage, /two consecutive Tencent Hunyuan roles/i);
  assert.match(userMessage, /overall Tencent span is February 2024 to September 2025/i);
  assert.match(userMessage, /February 2024 to March 2025[\s\S]*March 2025 to September 2025/i);
  assert.match(userMessage, /answer in second person.*not "我是"/i);
  assert.match(userMessage, /Original question: 我什么时候在腾讯工作/);
});

test("provides verified graduate-school details to Workers AI", async () => {
  let invocation;
  const env = createEnv({
    onRun(model, options) {
      invocation = { model, options };
    },
  });

  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "我的研究生 GPA 是多少" }),
  }), env);

  assert.equal(response.status, 200);
  const systemMessage = invocation.options.messages[0].content;
  assert.match(systemMessage, /GPA 3\.67 \/ 4\.0/);
  assert.match(systemMessage, /Prof\. David Manlove[\s\S]*University of Oxford/i);
});

test("returns 502 when Workers AI provides no usable response", async () => {
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "What does Xinyu research?" }),
  }), createEnv({ modelResult: { response: "   " } }));

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "No model response available" });
});

test("returns 502 when Workers AI fails without a quota signal", async () => {
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "What does Xinyu research?" }),
  }), createEnv({ modelError: new Error("upstream unavailable") }));

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "No model response available" });
});

test("returns 429 for a Workers AI quota error code", async () => {
  const quotaError = Object.assign(new Error("quota exhausted"), { code: 3036 });
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "What does Xinyu research?" }),
  }), createEnv({ modelError: quotaError }));

  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "Rate limit exceeded" });
});

test("returns 429 for a Workers AI HTTP 429 error", async () => {
  const quotaError = Object.assign(new Error("too many requests"), { status: 429 });
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "What does Xinyu research?" }),
  }), createEnv({ modelError: quotaError }));

  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "Rate limit exceeded" });
});
