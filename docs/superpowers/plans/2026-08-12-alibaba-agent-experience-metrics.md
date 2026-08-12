# Alibaba Agent Experience Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present Alibaba work as two professional, quantified Agent workstreams on the homepage and in Xinyu Agent's verified context.

**Architecture:** Keep the existing static HTML card and Cloudflare Worker architecture. Add content contracts first, then update the homepage and Worker context to the exact approved language, and finally release the static site and Worker with production verification.

**Tech Stack:** Static HTML, Node.js built-in test runner, Cloudflare Workers AI, Python static-contract tests, GitHub Pages.

## Global Constraints

- Keep the existing homepage layout unchanged.
- Present exactly two Alibaba workstreams: `General AutoResearch` and `Xianyu Multimodal Quality Inspection`.
- State that end-to-end prompt optimization and migration validation completed across 19 business tasks without manual intervention; do not call this unattended production deployment.
- The 8-of-9 result must be explicitly scoped to controlled image-QC tasks in a 4-Agent-runtime by 4-model-configuration evaluation.
- State only that 279 migration tests passed; never state that all tests passed.
- Bind 97.54% mean Macro-F1 only to the nine-category, 80-inspection-check acceptance snapshot.
- Name viewpoint compliance detection, base photo-quality checks, and visible physical-defect detection.
- State business scale as support for 30+ product categories at approximately 30K orders per day.
- Do not expose internal runtime, model, or category names.

---

### Task 1: Add Alibaba experience contracts

**Files:**
- Modify: `tests/site-contract.test.mjs`
- Modify: `worker/tests/worker.test.mjs`

**Interfaces:**
- Consumes: The Alibaba experience card and `PROFILE_CONTEXT` plain-text facts.
- Produces: Regression contracts for the two workstreams, controlled benchmark scope, migration tests, modeled cost, category count, and daily scale.

- [ ] **Step 1: Write failing static-site assertions**

Add assertions requiring `General AutoResearch`, its runtime capabilities, `19 business tasks`, `without manual intervention`, `4 Agent runtimes`, `4 model configurations`, `8 of 9 controlled image-QC tasks`, and `279 migration tests`. Require `Xianyu Multimodal Quality Inspection`, all three inspection categories, a nine-category snapshot with 80 inspection checks at 97.54% mean Macro-F1, and current support for 30+ product categories at approximately 30K orders per day.

- [ ] **Step 2: Run the static-site test and verify RED**

Run: `node --test tests/site-contract.test.mjs`

Expected: FAIL because the approved Alibaba copy is not yet present.

- [ ] **Step 3: Write failing Worker-context assertions**

Update the Alibaba appointment contract and add the same claim-boundary assertions against the Worker system context.

- [ ] **Step 4: Run the Worker test and verify RED**

Run: `node --test worker/tests/worker.test.mjs`

Expected: FAIL because the Worker context still contains the previous single-track description.

### Task 2: Implement synchronized public copy

**Files:**
- Modify: `index.html`
- Modify: `worker/src/index.mjs`
- Modify: `life.html`

**Interfaces:**
- Consumes: Contracts from Task 1.
- Produces: The public Alibaba experience card, grounded Xinyu Agent context, and release token `20260812-autoresearch-xianyu-1`.

- [ ] **Step 1: Update the Alibaba homepage card**

Use exactly two bullet points. The first describes General AutoResearch, the 19-task autonomous result, and the scoped 4-by-4, 8-of-9, 279-test evaluation. The second describes Xianyu Multimodal Quality Inspection, all three inspection categories, the separate nine-category 80-check snapshot, and current 30+ category / approximately 30K-order-per-day scale.

- [ ] **Step 2: Synchronize the Worker context**

Replace the single Alibaba appointment sentence with the same two-track facts and claim boundaries. Preserve the exact role title `AI Agent Researcher (P6)` and affiliation `TaoTian Group @ Alibaba`.

- [ ] **Step 3: Bump the release token**

Replace `20260806-profile-release-2` with `20260812-autoresearch-xianyu-1` in `index.html` and `life.html`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/site-contract.test.mjs worker/tests/worker.test.mjs`

Expected: PASS with zero failures.

### Task 3: Verify and release

**Files:**
- Verify: `index.html`
- Verify: `life.html`
- Verify: `worker/src/index.mjs`

**Interfaces:**
- Consumes: The synchronized static and Worker copy from Task 2.
- Produces: A versioned GitHub Pages release and deployed Cloudflare Worker.

- [ ] **Step 1: Run the complete local test suite**

Run: `node --test tests/*.test.mjs worker/tests/*.test.mjs && python3 -m unittest discover -s tests -p 'test_*.py'`

Expected: All tests pass with zero failures.

- [ ] **Step 2: Inspect the rendered experience card**

Open the local homepage at desktop and mobile widths; verify the two bullets are readable and introduce no horizontal overflow.

- [ ] **Step 3: Review the final diff and commit**

Run: `git diff --check && git diff --stat && git status --short`

Expected: Only the approved documents, tests, homepage, life-page cache token, and Worker context are changed.

- [ ] **Step 4: Publish static site and Worker**

Fetch `origin`, confirm `origin/main` has not diverged, push the verified HEAD to `main`, and deploy `worker/wrangler.jsonc` with Wrangler.

- [ ] **Step 5: Verify production**

Open `https://guanxinyu.blog/?v=20260812-autoresearch-xianyu-1#experience` on desktop and mobile. Verify the two workstreams, all approved metrics, no horizontal overflow, clean image loading, and a grounded Xinyu Agent response about the Alibaba role.
