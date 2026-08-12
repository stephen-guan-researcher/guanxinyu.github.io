# Career Levels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the verified Alibaba, Baidu, and Tencent career levels in Work Experience and expose the same facts to Xinyu Agent.

**Architecture:** Keep the existing static experience-card structure and append each level to its existing `.career-role` text with a middle dot. Update the Worker’s verified profile prompt and Tencent-specific career context so model answers use the same facts; no new UI component or runtime behavior is introduced.

**Tech Stack:** Static HTML, Node.js built-in test runner, Cloudflare Worker JavaScript.

## Global Constraints

- Alibaba visible role: `AI Agent Researcher · P6`.
- Baidu visible role: `Senior Research Scientist · T4+`.
- Both Tencent visible roles: `Research Scientist · T5`.
- Do not add levels to the Chinese Academy of Sciences or Mico World appointments.
- Do not change headings, dates, summaries, metrics, profile card, news, colors, or layout components.
- Publishing remains a separate action after preview verification.

---

### Task 1: Work Experience Role Lines

**Files:**
- Modify: `tests/site-contract.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: existing `.career-item`, `.career-header`, and `.career-role` markup.
- Produces: four exact visible role-level strings inside their corresponding career cards.

- [ ] **Step 1: Write the failing site-contract test**

Add a test that parses the real homepage and binds each company heading to its required role text:

```js
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
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test --test-name-pattern="verified career levels" tests/site-contract.test.mjs`

Expected: FAIL because the existing role lines do not contain `P6`, `T4+`, or `T5`.

- [ ] **Step 3: Apply the minimal homepage copy change**

Change only these four role lines in `index.html`:

```html
<p class="career-role">AI Agent Researcher · P6</p>
<p class="career-role">Senior Research Scientist · T4+</p>
<p class="career-role">Research Scientist · T5</p>
<p class="career-role">Research Scientist · T5</p>
```

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --test --test-name-pattern="verified career levels" tests/site-contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the homepage role-level change**

```bash
git add index.html tests/site-contract.test.mjs
git commit -m "feat: display verified career levels"
```

Expected: only the homepage and its contract test are committed.

---

### Task 2: Xinyu Agent Career-Level Context

**Files:**
- Modify: `worker/tests/worker.test.mjs`
- Modify: `worker/src/index.mjs`

**Interfaces:**
- Consumes: `PROFILE_CONTEXT` and the Tencent career-date branch returned by `modelQuestion(question)`.
- Produces: verified level facts in the Workers AI system message and T5 in both Tencent subperiods.

- [ ] **Step 1: Write the failing Worker test**

Extend `returns a Workers AI answer for a valid question` to require these facts in `systemMessage`:

```js
assert.match(systemMessage, /AI Agent Researcher \(P6\) with TaoTian Group @ Alibaba/i);
assert.match(systemMessage, /Senior Research Scientist \(T4\+\).*Baidu/i);
assert.match(systemMessage, /Research Scientist \(T5\).*Tencent Hunyuan's Text-to-Text Pipeline Team/i);
assert.match(systemMessage, /Research Scientist \(T5\).*Tencent Hunyuan Strategy Group 4/i);
```

Extend `routes natural first-person career-date questions with complete dates` to require both Tencent subperiods in `userMessage`:

```js
assert.match(userMessage, /Research Scientist \(T5\), Tencent Hunyuan Strategy Group 4/i);
assert.match(userMessage, /Research Scientist \(T5\), Tencent Hunyuan Text-to-Text Pipeline Team/i);
```

- [ ] **Step 2: Run the focused Worker tests and confirm RED**

Run: `node --test --test-name-pattern="Workers AI answer|career-date" worker/tests/worker.test.mjs`

Expected: FAIL because the current model context contains titles but no career levels.

- [ ] **Step 3: Apply the minimal Worker context change**

Update only the verified identity/experience facts and Tencent subperiod lines:

```text
AI Agent Researcher (P6) with TaoTian Group @ Alibaba
Senior Research Scientist (T4+) in Baidu's ERNIE Foundation Model Core Team
Research Scientist (T5) in Tencent Hunyuan's Text-to-Text Pipeline Team
Research Scientist (T5) in Tencent Hunyuan Strategy Group 4
```

Do not assign a level to any other appointment.

- [ ] **Step 4: Run the focused Worker tests and confirm GREEN**

Run: `node --test --test-name-pattern="Workers AI answer|career-date" worker/tests/worker.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the Agent context change**

```bash
git add worker/src/index.mjs worker/tests/worker.test.mjs
git commit -m "feat: ground Agent in verified career levels"
```

Expected: only the Worker source and Worker test are committed.

---

### Task 3: Regression and Responsive Verification

**Files:**
- Verify: `index.html`
- Verify: `worker/src/index.mjs`
- Verify: `tests/*.test.mjs`
- Verify: `worker/tests/*.test.mjs`

**Interfaces:**
- Consumes: completed homepage and Agent changes from Tasks 1 and 2.
- Produces: a tested local candidate; no production deployment.

- [ ] **Step 1: Run complete automated verification**

Run:

```bash
node --test tests/*.test.mjs worker/tests/*.test.mjs
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_*.py'
node --check worker/src/index.mjs
git diff --check
```

Expected: all Node and Python tests pass, syntax check passes, and `git diff --check` produces no output.

- [ ] **Step 2: Verify the rendered homepage**

Serve the worktree using `python3 -m http.server 8000 --bind 127.0.0.1`, then inspect `index.html#experience` at 1440×900 and 390×844.

Expected: all four role-level strings are visible, no horizontal overflow occurs, and no console errors or failed page assets appear.

- [ ] **Step 3: Confirm the branch is ready for review**

Run: `git status --short --branch`

Expected: the branch contains the two reviewed implementation commits and has no uncommitted implementation files. Do not push or deploy in this task.
