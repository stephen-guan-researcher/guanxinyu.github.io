# ICONIP 2026 Acceptance Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing CICL record from a preprint-only state to a verified ICONIP 2026 acceptance across the homepage, Now timeline, browser fallback, and deployed Xinyu Agent.

**Architecture:** Keep the existing seven-card static site and update only the CICL status-bearing surfaces. Lock the public wording with HTML contract tests, browser-fallback tests, Worker-context tests, and a shared cache-token contract; then release the static site and Worker as two separately verified deployments.

**Tech Stack:** Static HTML, browser-side ES modules, Node.js `node:test`, Python `unittest`, Cloudflare Workers AI, Wrangler, GitHub Pages.

## Global Constraints

- Use the existing CICL card; do not add an eighth publication card or change publication order.
- Use `Accepted`, never `Published`, until a public Springer proceedings page or proceedings DOI is verified.
- Visible metadata must be exactly `ICONIP 2026 · Springer CCIS · Accepted Aug 2026`.
- Keep the exact title, `Xinyu Guan, Qianyang Zhao, Yuming Deng`, thumbnail, summary, and `https://arxiv.org/abs/2606.08151` link.
- Do not add reviewer scores, quotations, or benchmark metrics.
- Preserve the existing responsive `<picture>` assets, layout, typography, Life Photos, and seven-card count.
- Use shared release token `20260817-iconip-accepted-1` in both pages and both release-token tests.
- Static GitHub Pages and the Cloudflare Worker are separate deployments and must both be verified.

---

### Task 1: Lock and implement the visible ICONIP acceptance

**Files:**
- Modify: `tests/site-contract.test.mjs:92-107`
- Modify: `tests/site-contract.test.mjs:214-231`
- Modify: `index.html:90-115`
- Modify: `index.html:259-271`

**Interfaces:**
- Consumes: the existing `cardWithText("publication-card", title)` test helper and reverse-chronological `news-card` markup.
- Produces: one first-position Now milestone and one updated CICL card whose public URL remains the arXiv link.

- [ ] **Step 1: Write the failing Now and publication-card contracts**

Replace the Now assertions with the following expectations and replace the CICL test with the accepted-state contract:

```js
test("Now presents the verified 2026 milestones as a reverse-chronological timeline", () => {
  const news = index.match(/<aside class="news-card"[\s\S]*?<\/aside>/)?.[0] ?? "";
  const items = news.match(/<article class="news-item">[\s\S]*?<\/article>/g) ?? [];
  const dates = [...news.matchAll(/<time datetime="([^"]+)">/g)].map((match) => match[1]);

  assert.equal(items.length, 7, "Now must expose seven concise milestone cards");
  assert.deepEqual(dates, ["2026-08", "2026-08", "2026-08", "2026-08", "2026-07", "2026-06", "2026-02"]);
  for (const status of ["Accepted", "Preparing", "Submitted", "Preprint", "Career"]) {
    assert.match(news, new RegExp(`<span>${status}<\\/span>`));
  }
  assert.match(
    items[0],
    /Decision-Aware Memory Cards was accepted for publication in the Springer CCIS proceedings of ICONIP 2026\./,
  );
  assert.match(items[0], /href="https:\/\/arxiv\.org\/abs\/2606\.08151"[^>]*target="_blank"[^>]*rel="noopener"/);
  assert.ok(news.indexOf("Decision-Aware Memory Cards was accepted") < news.indexOf("Submitted SILICA"));
  assert.match(news, /Preparing the KL regularization manuscript for ICLR/);
  assert.match(news, /Submitted Advantage Scale Calibration to AAAI 2027/);
  assert.match(news, /href="#experience"/);
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
```

- [ ] **Step 2: Run the focused contract tests and verify RED**

Run:

```bash
node --test --test-name-pattern="Now presents|CICL is" tests/site-contract.test.mjs
```

Expected: FAIL because Now still has six items and the CICL card still says `Preprint` with arXiv-only metadata.

- [ ] **Step 3: Insert the accepted milestone and update the existing card**

Insert this article before the SILICA item:

```html
<article class="news-item">
  <div><time datetime="2026-08">Aug 2026</time><span>Accepted</span></div>
  <p><a href="https://arxiv.org/abs/2606.08151" target="_blank" rel="noopener">Decision-Aware Memory Cards was accepted for publication in the Springer CCIS proceedings of ICONIP 2026.</a></p>
</article>
```

Change only these two CICL card lines:

```html
<p class="status-label">Accepted</p>
<p class="publication-meta">ICONIP 2026 · Springer CCIS · Accepted Aug 2026</p>
```

- [ ] **Step 4: Run the focused contract tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern="Now presents|CICL is" tests/site-contract.test.mjs
```

Expected: both selected tests PASS.

- [ ] **Step 5: Commit the visible acceptance update**

```bash
git add tests/site-contract.test.mjs index.html
git commit -m "feat: mark CICL accepted at ICONIP 2026"
```

---

### Task 2: Synchronize the browser fallback and Worker profile context

**Files:**
- Modify: `tests/site-behavior.test.mjs:407-419`
- Modify: `worker/tests/worker.test.mjs:193-200`
- Modify: `worker/tests/worker.test.mjs:287-292`
- Modify: `phd-main.js:74-82`
- Modify: `worker/src/index.mjs:22`

**Interfaces:**
- Consumes: `buildAgentReply(question) -> { topic, answer, sources }` and the `PROFILE_CONTEXT` system message passed to Workers AI.
- Produces: identical accepted/not-yet-published facts in the static fallback and live model context.

- [ ] **Step 1: Write failing browser-fallback assertions**

Extend the corrected-venue test with CICL routing and accepted-state assertions:

```js
for (const question of [
  "What is SILICA?",
  "Is the KL paper going to ICLR?",
  "Tell me about the EACL submission",
  "What happened with CICL?",
]) {
  const reply = site.buildAgentReply(question);
  assert.equal(reply.topic, "papers");
  assert.deepEqual(reply.sources, ["papers", "research"]);
}

const reply = site.buildAgentReply("Summarize your latest papers");
assert.match(
  reply.answer,
  /Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents/,
);
assert.match(reply.answer, /Xinyu Guan, Qianyang Zhao, and Yuming Deng/);
assert.match(reply.answer, /was accepted at ICONIP 2026/);
assert.match(reply.answer, /Springer CCIS proceedings/);
assert.match(reply.answer, /publicly available on arXiv/);
assert.doesNotMatch(reply.answer, /CICL (?:is|was) published/i);
```

- [ ] **Step 2: Write failing Worker-context assertions**

Add these assertions immediately after the existing public-paper assertions:

```js
assert.match(
  systemMessage,
  /Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents[\s\S]*accepted at ICONIP 2026[\s\S]*Springer CCIS proceedings/i,
);
assert.match(
  systemMessage,
  /Decision-Aware Memory Cards[\s\S]*Xinyu Guan, Qianyang Zhao, and Yuming Deng/i,
);
assert.match(systemMessage, /https:\/\/arxiv\.org\/abs\/2606\.08151/);
assert.match(systemMessage, /not yet published/i);
assert.doesNotMatch(systemMessage, /Decision-Aware Memory Cards[^.]*was published/i);
```

- [ ] **Step 3: Run both focused suites and verify RED**

Run:

```bash
node --test --test-name-pattern="corrected manuscript venues" tests/site-behavior.test.mjs
node --test --test-name-pattern="Workers AI answer" worker/tests/worker.test.mjs
```

Expected: the first suite FAILS because the fallback says only that CICL is on arXiv; the second FAILS because `PROFILE_CONTEXT` still calls it a preprint.

- [ ] **Step 4: Update the browser fallback with concise acceptance copy**

Replace the CICL clause inside the publications answer with:

```js
"“Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents” by Xinyu Guan, Qianyang Zhao, and Yuming Deng was accepted at ICONIP 2026 for publication in the Springer CCIS proceedings and remains publicly available on arXiv."
```

Keep all other paper statuses unchanged.

- [ ] **Step 5: Update the authoritative Worker publication fact**

Replace the current CICL preprint sentence in `PROFILE_CONTEXT` with exactly:

```text
"Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents" was accepted at ICONIP 2026 for publication in the Springer Communications in Computer and Information Science (CCIS) proceedings in August 2026; it is not yet published. Its displayed authors are Xinyu Guan, Qianyang Zhao, and Yuming Deng, and its public paper URL is https://arxiv.org/abs/2606.08151.
```

- [ ] **Step 6: Run both focused suites and verify GREEN**

Run:

```bash
node --test --test-name-pattern="corrected manuscript venues" tests/site-behavior.test.mjs
node --test --test-name-pattern="Workers AI answer" worker/tests/worker.test.mjs
```

Expected: both selected tests PASS.

- [ ] **Step 7: Commit the synchronized Agent facts**

```bash
git add tests/site-behavior.test.mjs worker/tests/worker.test.mjs phd-main.js worker/src/index.mjs
git commit -m "feat: ground Xinyu Agent in ICONIP acceptance"
```

---

### Task 3: Rotate the release token and run the complete local verification

**Files:**
- Modify: `tests/site-contract.test.mjs:11`
- Modify: `tests/image-performance.test.mjs:68`
- Modify: `index.html:13,481`
- Modify: `life.html:12,131`

**Interfaces:**
- Consumes: both pages' real stylesheet and module-script elements.
- Produces: one shared token, `20260817-iconip-accepted-1`, that invalidates the changed browser fallback without altering assets.

- [ ] **Step 1: Change the expected release token in both tests**

```js
const releaseToken = "20260817-iconip-accepted-1";
```

- [ ] **Step 2: Run the release-token tests and verify RED**

Run:

```bash
node --test --test-name-pattern="homepage preserves the approved blue-gray research-archive markers|both pages load the same styles and behavior module|changed CSS and JavaScript" tests/site-contract.test.mjs tests/image-performance.test.mjs
```

Expected: FAIL because both HTML pages still reference `20260812-autoresearch-xianyu-1`.

- [ ] **Step 3: Update the actual page asset URLs**

Use these exact URLs in both `index.html` and `life.html`:

```html
<link rel="stylesheet" href="phd-styles.css?v=20260817-iconip-accepted-1" />
<script type="module" src="phd-main.js?v=20260817-iconip-accepted-1"></script>
```

- [ ] **Step 4: Run the release-token tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern="homepage preserves the approved blue-gray research-archive markers|both pages load the same styles and behavior module|changed CSS and JavaScript" tests/site-contract.test.mjs tests/image-performance.test.mjs
```

Expected: selected tests PASS and no old token remains in either page.

- [ ] **Step 5: Run the complete automated verification**

Run:

```bash
node --test tests/*.test.mjs worker/tests/*.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py'
git diff --check origin/main...HEAD
```

Expected: all Node and Python tests PASS with zero failures; `git diff --check` prints no output.

- [ ] **Step 6: Run local responsive QA**

Start the static server from the worktree:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/index.html?v=20260817-iconip-accepted-1#papers` in the in-app browser and verify at `1440 × 900` and `390 × 844`:

- `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
- The first Now item is the ICONIP acceptance.
- The CICL card has one `Accepted` label and the approved metadata.
- The CICL image has non-zero natural dimensions.
- Browser warning/error logs are empty.

- [ ] **Step 7: Commit the release-token update**

```bash
git add tests/site-contract.test.mjs tests/image-performance.test.mjs index.html life.html
git commit -m "chore: rotate ICONIP acceptance release token"
```

---

### Task 4: Publish and verify both production surfaces

**Files:**
- Deploy: repository static files to `origin/main`
- Deploy: `worker/src/index.mjs` through `worker/wrangler.jsonc`
- Verify: `https://guanxinyu.blog/`
- Verify: `https://xinyu-agent-api.798750933strikerg.workers.dev/api/chat`

**Interfaces:**
- Consumes: the clean, tested feature branch and existing GitHub Pages/Workers configuration.
- Produces: the canonical homepage and live Xinyu Agent with the same ICONIP acceptance facts.

- [ ] **Step 1: Confirm a clean fast-forward release**

Run:

```bash
git fetch origin main
git status --short
git rev-list --left-right --count origin/main...HEAD
```

Expected: status is clean and the left-side count is `0`. If the left-side count is not `0`, stop and reconcile remote changes before publishing.

- [ ] **Step 2: Publish the static site**

```bash
git push origin HEAD:main
```

Expected: `origin/main` advances to the tested feature commit.

- [ ] **Step 3: Deploy the Worker context**

```bash
cd worker
npx --yes wrangler@4.119.0 deploy --config wrangler.jsonc
```

Expected: Wrangler reports a successful upload, deployment trigger, and a new Worker version ID.

- [ ] **Step 4: Wait for and verify the canonical static deployment**

Request the cache-busted page until it contains all three strings:

```text
20260817-iconip-accepted-1
ICONIP 2026 · Springer CCIS · Accepted Aug 2026
Decision-Aware Memory Cards was accepted for publication
```

Then repeat the desktop/mobile overflow, image, and console checks against:

```text
https://guanxinyu.blog/?v=20260817-iconip-accepted-1#papers
```

- [ ] **Step 5: Verify the production Agent's semantic boundary**

POST this JSON question from approved origin `https://guanxinyu.blog`:

```json
{"question":"CICL 现在是什么状态？请说明会议、proceedings 和是否已经正式出版。"}
```

Expected semantic content:

```text
Accepted at ICONIP 2026
Springer CCIS proceedings
Not yet published
```

Reject the deployment if the answer calls CICL `Published`, changes the venue, or changes the author list.

- [ ] **Step 6: Record final evidence**

Report the static commit SHA, Worker version ID, automated test counts, desktop/mobile overflow result, image failures, browser console errors, and the production Agent answer. Do not call the release complete until all evidence is current.
