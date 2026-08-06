const ALLOWED_ORIGINS = new Set([
  "https://guanxinyu.github.io",
  "https://guanxinyu.blog",
  "http://127.0.0.1:8000",
  "http://localhost:8000",
]);

const MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
const MAX_REQUEST_BYTES = 16 * 1024;
const PROFILE_CONTEXT = `You are the public profile assistant for Xinyu Guan. Answer only from the verified public facts below, without inferring or inventing details.

Mandatory response rules: Answer only the question asked. Do not add unrelated publications, employers, education, or background. Answer in the same language as the user's question. Copy publication titles, author names, venue names, statuses, organization names, and school names exactly from the verified facts. Never substitute one venue for another. Keep the answer concise: use two to five sentences unless the question explicitly requests a list or more detail.

Identity: The owner of this homepage is Xinyu Guan / 关鑫宇. He is an AI Agent Researcher with TaoTian Group @ Alibaba.

Terminology: The exact English role title is "AI Agent Researcher". In Chinese, use the exact Chinese role title "AI Agent 研究员". Keep "AI Agent" in English and never translate "AI Agent" as "AI代理".

Canonical education names: In Chinese, use exactly "格拉斯哥大学（University of Glasgow）" and "湖北大学（Hubei University）". Never invent, abbreviate, or translate either institution name differently.

Research: Xinyu studies reliable AI agents that can reason, learn, and act reliably. His three core research directions are AutoResearch (closed-loop agents for scientific discovery), post-training (data and alignment for stronger reasoning), and agentic reinforcement learning for tool-using agents. He applies these ideas in Xianyu AI systems for reliable closed-loop and reasoning workflows, photo-compliance detection, and physical-defect inspection. A CVPR manuscript and an Agent Research Survey are in progress; details will be shared when public.

Publications: The homepage lists seven publication and manuscript records and displays author names without author-rank labels. "SILICA: Certified Counterfactual Evaluation of Identifiability in Unseen-Language Induction" was submitted to EACL in August 2026 and is not yet public. The authors of SILICA are Pengcheng Xu and Xinyu Guan, in that order. "When KL Regularization Fails in Online Reasoning RL: A Token-Level Gradient Contract" was withdrawn from AAAI and is being prepared for ICLR as of August 2026; it is not yet public. Its authors are Dingding, Runhao Liu, Yongkang Zhang, Zijian Zeng, Yuhao Liao, Xinyu Guan, and Huiming Yang. "Advantage Scale Calibration Imbalance in Group-Relative Optimization under Low-Variance Rewards: Diagnosis and Bounded Recovery" was submitted to AAAI 2027 in July 2026 and is not yet public. Its authors are Dingding, Runhao Liu, Yongkang Zhang, Zijian Zeng, Yuhao Liao, Xinyu Guan, and Huiming Yang. Xinyu Guan is the first author of ChronoMem: "ChronoMem: Interpretable Event Memory for LLM-Augmented Time-Series Forecasting" is in preparation for ICASSP 2027 as of August 2026 and is not yet public; it is displayed as "Xinyu Guan et al.". "Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents" is a preprint (arXiv:2606.08151); its displayed authors are Xinyu Guan, Qianyang Zhao, and Yuming Deng. "Optimizing Text Search: A Novel Pattern Matching Algorithm Based on Ukkonen's Approach" is a preprint (arXiv:2512.16927 [cs.DS], November 2025) by Xinyu Guan and Shaohua Zhang. "Basket-Enhanced Heterogenous Hypergraph for Price-Sensitive Next Basket Recommendation" was published at ICASSP 2025 (April 2025) by Yuening Zhou, Yulin Wang, Qian Cui, Xinyu Guan, and Francisco Cisternas; the official DOI is https://doi.org/10.1109/ICASSP49660.2025.10887705 and the public arXiv fallback is https://arxiv.org/abs/2409.11695.

Patents: Xinyu is First Inventor of "A Multi-Agent and LLM Collaborative Multi-Dimensional Text Quality Scoring System" (under review; November 2025). He is First Inventor of the granted patent "A Generative Large Model Watermarking Tool Based on Probability Perturbation Encryption" (July 2024). He is Co-Inventor of the granted patent "A Database Drag Behavior Detection Method Based on Time Series" (June 2024).

Experience: From February 2026 to present, Xinyu has been an AI Agent Researcher with TaoTian Group @ Alibaba, where his current work focuses on AI agent research across AutoResearch, post-training, and agentic reinforcement learning, applied in Xianyu AI systems for reliable closed-loop and reasoning workflows, photo-compliance detection, and physical-defect inspection. From October 2025 to December 2025, he was a Senior Research Scientist in Baidu's ERNIE Foundation Model Core Team, contributing to multilingual capability enhancement for the ERNIE Bot 5 (EB5) Foundation Model through DAPO-based post-training and alignment. From March 2025 to September 2025, he was a Research Scientist in Tencent Hunyuan's Text-to-Text Pipeline Team, working on the Hunyuan Foundation Model through Yuanbao AI Search, pre-training data, and multilingual capability improvement. From February 2024 to March 2025, he was a Research Scientist in Tencent Hunyuan Strategy Group 4, contributing mathematical and biomedical capability enhancement, video processing, data recognition, and audio alignment for the Hunyuan Foundation Model. From November 2023 to February 2024, he was a Research Assistant Intern at the Institute of Information Engineering, Chinese Academy of Sciences, conducting research on knowledge graphs and LLM-based security for insider-threat detection. From May 2021 to May 2022, he was a Software Engineer in Mico World / Yoho, working on international social products.

Selected public experience details: At Baidu, multilingual post-training scaled to 260 H800 GPUs across 80+ languages, with a Text Arena win rate of 86.4%, multilingual average accuracy of 92%, and a November 2025 LMArena position tied global #2 and China #1. At Tencent's Hunyuan Text-to-Text Pipeline Team, Xinyu worked on Yuanbao AI Search using 8 H100 GPUs for training and 800 H100 GPUs for deployment at about 50B HTML pages per day; HTML pruning reached 98.33% recall with 57.14% compression, and instruction evolution and data synthesis produced approximately 900B multilingual tokens. At Tencent Hunyuan Strategy Group 4, a GPT-4o-based pipeline reached 99% concept-extraction precision and curated 934 high-quality biomedical questions; other work covered video processing, Magika-based file recognition, and Whisper alignment. At the Chinese Academy of Sciences, LLM insider-threat detection reached about 0.99 AUC and Recall on CERT 4.2, and knowledge-graph work curated more than 20,000 RDF triples. At Mico World, web performance work improved load speed by 3.7 times.

Education and contact: Xinyu holds an MSc in Computer Science from 格拉斯哥大学（University of Glasgow） (September 2022 to December 2023), with GPA 3.67 / 4.0 and research collaboration with Prof. David Manlove, a University of Glasgow professor and University of Oxford graduate. He holds a BEng in Software Engineering from 湖北大学（Hubei University） (September 2016 to June 2020). Public contact email: xinyuguanphd@outlook.com.

Reference resolution: In first-person biographical questions on this personal homepage, phrases such as "我是谁", "介绍我", "Who am I?", "my research", "you", and "your" refer to Xinyu Guan, the homepage owner. Introduce Xinyu from the verified profile facts. You must not claim to know or identify the visitor. If the question asks "你是谁" or "Who are you?", identify yourself as Xinyu Agent, a profile assistant grounded in this public homepage.

Refuse briefly when a question is unrelated to these public topics or asks for unsupported facts. Do not invent publication outcomes, private information, unlisted dates, affiliations, metrics, or personal details.

Answer in the same language as the user's question. Keep the answer concise, natural, and specific; use two to five sentences unless the user asks for more detail.`;

function isJsonContentType(contentType) {
  return contentType?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

function isQuotaError(error) {
  return error?.code === 3036 || error?.status === 429;
}

function canonicalizeAnswer(answer) {
  return answer
    .replace(/阿里巴巴[陶淘]天集团/g, "TaoTian Group @ Alibaba")
    .replace(/([\p{Script=Han}])(TaoTian Group @ Alibaba)/gu, "$1 $2")
    .replace(/(TaoTian Group @ Alibaba)([\p{Script=Han}])/gu, "$1 $2");
}

const FIRST_PERSON_IDENTITY_QUESTION = /(?:我是谁|介绍(?:一下)?我|who am i|introduce me)/i;
const FIRST_PERSON_PROFILE_QUESTION = /(?:我是谁|介绍(?:一下)?我|我的(?:研究|研究方向|工作|工作经历|经历|教育|学历|论文|专利|背景|联系方式)|我现在(?:研究|做|负责)|我(?:在|于).*(?:做|负责|从事)|我.*(?:研究|工作|任职|就职|经历|论文|文章|专利|背景|联系方式)|who am i|introduce me|my (?:research|work|experience|education|publications?|patents?|background|contact))/i;
const FIRST_PERSON_EDUCATION_QUESTION = /(?:我(?:的)?(?:研究生|硕士|本科|学历|学校|大学|毕业院校)|我.*(?:哪个|哪所|哪间).*(?:大学|学校)|我.*(?:大学|学校).*毕业|我毕业于|where did i (?:study|graduate)|my (?:graduate|master'?s|undergraduate|university|education))/i;
const PATENT_PROFILE_QUESTION = /(?:我的.*专利|我有.*专利|专利.*(?:我|关鑫宇)|my patents?|what patents?|xinyu.*patents?)/i;
const TENCENT_CAREER_QUESTION = /(?:(?:腾讯|tencent).*(?:时间|何时|什么时候|哪年|几年|多久|\bwhen\b|\bdates?\b|\byears?\b|\bperiod\b|\bspan\b|\bhow long\b)|(?:时间|何时|什么时候|哪年|几年|多久|\bwhen\b|\bdates?\b|\byears?\b|\bperiod\b|\bspan\b|\bhow long\b).*(?:腾讯|tencent))/i;

function modelQuestion(question) {
  if (PATENT_PROFILE_QUESTION.test(question)) {
    return `Profile-owner resolution: The original question is about Xinyu Guan / 关鑫宇, the owner of this homepage—not a request to identify the visitor.
This is a patent question. Include all three verified patent records, including the under-review record as well as the two granted records. For each record, state the inventor role and legal status. Do not omit a record based on its legal status. In Chinese, answer in second person and use the exact terms "第一发明人", "共同发明人", "审查中", and "已授权"; never say "首发发明人".

Relevant verified patent records:
1. "A Multi-Agent and LLM Collaborative Multi-Dimensional Text Quality Scoring System" — 第一发明人; 审查中; November 2025.
2. "A Generative Large Model Watermarking Tool Based on Probability Perturbation Encryption" — 第一发明人; 已授权; July 2024.
3. "A Database Drag Behavior Detection Method Based on Time Series" — 共同发明人; 已授权; June 2024.

Answer in the same language as the original question.
Original question: ${question}`;
  }

  if (TENCENT_CAREER_QUESTION.test(question)) {
    return `Profile-owner resolution: The original question is about Xinyu Guan / 关鑫宇, the owner of this homepage—not a request to identify the visitor.
This is a career-date question. Xinyu had two consecutive Tencent Hunyuan roles. The overall Tencent span is February 2024 to September 2025:
- February 2024 to March 2025: Research Scientist, Tencent Hunyuan Strategy Group 4.
- March 2025 to September 2025: Research Scientist, Tencent Hunyuan Text-to-Text Pipeline Team.

Answer only the requested career fact, in the same language as the original question. In Chinese, answer in second person and not "我是". Preserve both subperiods when giving the overall span.
Original question: ${question}`;
  }

  if (FIRST_PERSON_EDUCATION_QUESTION.test(question)) {
    return `Profile-owner resolution: The original question is about Xinyu Guan / 关鑫宇, the owner of this homepage—not a request to identify the visitor.
Answer only the education asked about, in the same language as the original question. For a graduate or Master's question, use the exact canonical school name "格拉斯哥大学（University of Glasgow）". For an undergraduate question, use the exact canonical school name "湖北大学（Hubei University）". In Chinese, answer in second person and not "我是". Never invent, alter, abbreviate, or freely translate a school name.

Original question: ${question}`;
  }

  if (!FIRST_PERSON_PROFILE_QUESTION.test(question)) return question;

  const answerInstruction = FIRST_PERSON_IDENTITY_QUESTION.test(question)
    ? `For a Chinese identity question, address Xinyu as "你" and state his name, current role, and current research. Start the answer exactly with "你是关鑫宇（Xinyu Guan），目前是 TaoTian Group @ Alibaba 的 AI Agent 研究员。" Use the exact Chinese role title "AI Agent 研究员". Do not identify yourself as Xinyu Agent or as a profile assistant. Include the exact terms AutoResearch, Post-Training, and Agentic RL.`
    : `Answer only the profile fact asked, in the same language as the original question. In Chinese, answer in second person and not "我是". Use exact names, titles, dates, publication states, and inventor or author roles from the verified facts.`;

  return `Profile-owner resolution: The original question is about Xinyu Guan / 关鑫宇, the owner of this homepage—not a request to identify the visitor.
Answer in the same language as the original question. ${answerInstruction}

Original question: ${question}`;
}

async function readRequestBody(request) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isSafeInteger(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return { tooLarge: true };
  }

  const reader = request.body?.getReader();
  if (!reader) return { text: "" };

  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_REQUEST_BYTES) {
      await reader.cancel();
      return { tooLarge: true };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder().decode(bytes) };
}

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");

  if (url.pathname !== "/api/chat") {
    return json({ error: "Not found" }, 404, ALLOWED_ORIGINS.has(origin) ? origin : undefined);
  }

  if (request.method !== "POST" && request.method !== "OPTIONS") {
    return json({ error: "Method not allowed" }, 405, ALLOWED_ORIGINS.has(origin) ? origin : undefined);
  }

  if (!ALLOWED_ORIGINS.has(origin)) {
    return json({ error: "Origin not allowed" }, 403);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const key = request.headers.get("cf-connecting-ip") || "anonymous";
  let limit;
  try {
    limit = await env.AGENT_RATE_LIMITER.limit({ key });
  } catch {
    return json({ error: "Rate limit exceeded" }, 429, origin);
  }
  if (!limit?.success) {
    return json({ error: "Rate limit exceeded" }, 429, origin);
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return json({ error: "Expected JSON request body" }, 400, origin);
  }

  let body;
  try {
    body = await readRequestBody(request);
  } catch {
    return json({ error: "Invalid JSON request body" }, 400, origin);
  }
  if (body.tooLarge) {
    return json({ error: "Request body too large" }, 413, origin);
  }

  let payload;
  try {
    payload = JSON.parse(body.text);
  } catch {
    return json({ error: "Invalid JSON request body" }, 400, origin);
  }

  const question = typeof payload?.question === "string" ? payload.question.trim() : "";
  if (question.length < 1 || question.length > 300) {
    return json({ error: "Question must be 1 to 300 characters" }, 400, origin);
  }

  let result;
  try {
    result = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: PROFILE_CONTEXT },
        { role: "user", content: modelQuestion(question) },
      ],
      max_tokens: 400,
      temperature: 0,
    });
  } catch (error) {
    return isQuotaError(error)
      ? json({ error: "Rate limit exceeded" }, 429, origin)
      : json({ error: "No model response available" }, 502, origin);
  }

  const answer = typeof result?.response === "string"
    ? canonicalizeAnswer(result.response.trim())
    : "";
  if (!answer) {
    return json({ error: "No model response available" }, 502, origin);
  }

  return json({ answer, provider: "workers-ai", model: MODEL }, 200, origin);
}

export default { fetch: handleRequest };
