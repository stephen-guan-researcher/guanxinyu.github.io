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
  assert.match(systemMessage, /Public WeChat ID: super_lucky_magic/i);
  assert.match(systemMessage, /No public phone number is listed/i);
  assert.doesNotMatch(systemMessage, /18018735289|\+8618018735289/);
  assert.match(systemMessage, /Xinyu Guan is the first author of ChronoMem/i);
  assert.match(systemMessage, /Optimizing Text Search:[\s\S]*Xinyu Guan and Shaohua Zhang/i);
  assert.match(systemMessage, /Basket-Enhanced Heterogenous Hypergraph[\s\S]*Yuening Zhou[\s\S]*Francisco Cisternas/i);
  assert.match(systemMessage, /arXiv:2512\.16927[\s\S]*Nov(?:ember)? 2025/i);
  assert.match(systemMessage, /10\.1109\/ICASSP49660\.2025\.10887705/);
  assert.match(systemMessage, /arxiv\.org\/abs\/2409\.11695/);
  assert.match(
    systemMessage,
    /Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents[\s\S]*accepted at ICONIP 2026[\s\S]*Springer Communications in Computer and Information Science \(CCIS\) proceedings/i,
  );
  assert.match(
    systemMessage,
    /Decision-Aware Memory Cards[\s\S]*Xinyu Guan, Qianyang Zhao, and Yuming Deng/i,
  );
  assert.match(systemMessage, /https:\/\/arxiv\.org\/abs\/2606\.08151/);
  assert.match(systemMessage, /not yet published/i);
  assert.doesNotMatch(systemMessage, /Decision-Aware Memory Cards[^.]*was published/i);
  const researchParagraph = systemMessage.match(/Research:[\s\S]*?(?=\n\nPublications:)/)?.[0] ?? "";
  assert.match(
    researchParagraph,
    /viewpoint compliance detection, base photo-quality checks, and visible physical-defect detection/i,
  );
  assert.doesNotMatch(
    researchParagraph,
    /photo-compliance detection, and physical-defect inspection/i,
    "Worker Research must use the approved three-category taxonomy without a competing two-category version",
  );
  const alibabaAppointment = systemMessage.match(
    /From February 2026 to present,[\s\S]*?(?=From October 2025 to December 2025)/,
  )?.[0] ?? "";
  assert.ok(alibabaAppointment, "Worker profile context must retain the Alibaba appointment");
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
    assert.ok(alibabaAppointment.includes(value), `Alibaba appointment must retain ${value}`);
  }
  assert.match(alibabaAppointment, /autonomously[^.!?]*bad-case[^.!?]*candidate[^.!?]*prompt or policy/i);
  const optimizationRunSentence = alibabaAppointment.match(
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
  assert.match(alibabaAppointment, /4 Agent runtimes[^.!?]*4 model configurations[^.!?]*8 of 9 controlled image-QC tasks/i);
  assert.match(alibabaAppointment, /279 migration tests passed/i);
  assert.match(
    alibabaAppointment,
    /offline acceptance snapshot limited to nine categories and 80 inspection checks[^.!?]*97\.54% mean Macro-F1/i,
  );
  assert.match(
    alibabaAppointment,
    /\. Separately, (?:the )?current capability supports 30\+ product categories[^.!?]*approximately 30K orders per day/i,
  );
  assert.doesNotMatch(alibabaAppointment, /97\.54%[^.!?]*30\+ product categories|30\+ product categories[^.!?]*97\.54%/i);
  assert.doesNotMatch(
    alibabaAppointment,
    /\b(?:AutoResearch|Xianyu)\s+(?:runtime|model|category)(?:\s+(?:ID|name))?\s*(?::|=|is\b)\s*[A-Za-z0-9][\w.-]*/i,
    "Alibaba appointment must present aggregate scope, not internal runtime, model, or category identifiers",
  );
  const appointmentSentences = [
    "From October 2025 to December 2025, he was a Senior Research Scientist (T4+) in Baidu's ERNIE Foundation Model Core Team, contributing to multilingual capability enhancement for the ERNIE Bot 5 (EB5) Foundation Model through DAPO-based post-training and alignment.",
    "From March 2025 to September 2025, he was a Research Scientist (T5) in Tencent Hunyuan's Text-to-Text Pipeline Team, working on the Hunyuan Foundation Model through Yuanbao AI Search, pre-training data, and multilingual capability improvement.",
    "From February 2024 to March 2025, he was a Research Scientist (T5) in Tencent Hunyuan Strategy Group 4, contributing mathematical and biomedical capability enhancement, video processing, data recognition, and audio alignment for the Hunyuan Foundation Model.",
  ];
  for (const appointment of appointmentSentences) {
    assert.ok(systemMessage.includes(appointment), `missing complete appointment sentence: ${appointment}`);
  }
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

test("expands CICL shorthand into the verified ICONIP publication record", async () => {
  let invocation;
  const question = "CICL 现在是什么状态？请说明会议、proceedings 和是否已经正式出版。";
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
  }), createEnv({
    onRun(model, options) {
      invocation = { model, options };
    },
  }));

  assert.equal(response.status, 200);
  const userMessage = invocation.options.messages[1].content;
  assert.notEqual(userMessage, question);
  assert.match(
    userMessage,
    /CICL refers to "Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents"/i,
  );
  assert.match(userMessage, /accepted at ICONIP 2026/i);
  assert.match(userMessage, /Springer Communications in Computer and Information Science \(CCIS\) proceedings/i);
  assert.match(userMessage, /not yet published/i);
  assert.match(userMessage, /https:\/\/arxiv\.org\/abs\/2606\.08151/);
  assert.match(userMessage, /Answer in the same language as the original question/i);
  assert.match(userMessage, /中文问题请务必使用中文回答/);
  assert.match(userMessage, new RegExp(`Original question: ${question}`));
});

test("does not force non-Han CICL questions to English", async () => {
  let invocation;
  const question = "¿Cuál es el estado de CICL?";
  await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
  }), createEnv({
    onRun(model, options) {
      invocation = { model, options };
    },
  }));

  const userMessage = invocation.options.messages[1].content;
  assert.match(userMessage, /Answer in the same language as the original question/i);
  assert.doesNotMatch(userMessage, /Answer in English/i);
});

test("does not classify Japanese CICL questions as Chinese", async () => {
  let invocation;
  const question = "CICLの状態は？";
  await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
  }), createEnv({
    onRun(model, options) {
      invocation = { model, options };
    },
  }));

  const userMessage = invocation.options.messages[1].content;
  assert.match(userMessage, /Answer in the same language as the original question/i);
  assert.doesNotMatch(userMessage, /Answer in Chinese, matching the original question/i);
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
  assert.match(userMessage, /start the answer exactly with "你是关鑫宇（Xinyu Guan），目前是 TaoTian Group @ Alibaba 的 AI Agent 研究员。"/i);
  assert.match(userMessage, /do not identify yourself as Xinyu Agent or as a profile assistant/i);
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

test("canonicalizes Alibaba organization aliases in model-generated answers", async () => {
  const cases = [
    {
      modelAnswer: "你是关鑫宇，目前是阿里巴巴陶天集团的 AI Agent 研究员。",
      expectedAnswer: "你是关鑫宇，目前是 TaoTian Group @ Alibaba 的 AI Agent 研究员。",
    },
    {
      modelAnswer: "你是关鑫宇，目前是阿里巴巴淘天集团的 AI Agent 研究员。",
      expectedAnswer: "你是关鑫宇，目前是 TaoTian Group @ Alibaba 的 AI Agent 研究员。",
    },
    {
      modelAnswer: "你在阿里巴巴的TaoTian Group担任 AI Agent 研究员。",
      expectedAnswer: "你在 TaoTian Group @ Alibaba 担任 AI Agent 研究员。",
    },
    {
      modelAnswer: "你目前在淘天集团从事 AI Agent 研究。",
      expectedAnswer: "你目前在 TaoTian Group @ Alibaba 从事 AI Agent 研究。",
    },
    {
      modelAnswer: "Xinyu works with TaoTian Group on AI agents.",
      expectedAnswer: "Xinyu works with TaoTian Group @ Alibaba on AI agents.",
    },
  ];

  for (const { modelAnswer, expectedAnswer } of cases) {
    const response = await handleRequest(request("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "我是谁" }),
    }), createEnv({
      modelResult: { response: modelAnswer },
    }));

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      answer: expectedAnswer,
      provider: "workers-ai",
      model: "@cf/meta/llama-4-scout-17b-16e-instruct",
    });
  }
});

test("routes natural first-person Alibaba work questions through profile-owner resolution", async () => {
  let invocation;
  const question = "我在阿里巴巴做什么";
  const response = await handleRequest(request("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
  }), createEnv({
    onRun(model, options) {
      invocation = { model, options };
    },
  }));

  assert.equal(response.status, 200);
  assert.notEqual(invocation.options.messages[1].content, question);
  assert.match(invocation.options.messages[1].content, /about Xinyu Guan \/ 关鑫宇/i);
  assert.match(invocation.options.messages[1].content, /answer in second person.*not "我是"/i);
  assert.match(invocation.options.messages[1].content, /Original question: 我在阿里巴巴做什么/);
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
  assert.match(userMessage, /Research Scientist \(T5\), Tencent Hunyuan Strategy Group 4/i);
  assert.match(userMessage, /Research Scientist \(T5\), Tencent Hunyuan Text-to-Text Pipeline Team/i);
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
