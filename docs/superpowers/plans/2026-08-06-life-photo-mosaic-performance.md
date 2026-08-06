# Life Photo Mosaic and Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish three new lead photographs in a continuous responsive Life Photos mosaic while reducing mobile image transfer and render cost.

**Architecture:** Keep the static HTML/CSS architecture. Add deterministic span classes to the Life Photos markup, generate smaller WebP tiers from sanitized JPEG fallbacks, and use native responsive-image and lazy-loading behavior with fixed grid geometry.

**Tech Stack:** HTML5, CSS Grid, Pillow, Node.js contract tests, Python asset tests, Playwright browser QA, GitHub Pages.

## Global Constraints

- Preserve all homepage, Agent, publication, resume, navigation, and contact content.
- Put the three supplied photographs first in road, camera, aquarium order.
- Preserve the previous 15-photo relative order and keep `coastal-temple.jpg` last.
- Publish only metadata-free JPEG fallbacks and generated WebP assets.
- Only the first gallery image may be prioritized; the remaining 17 must lazy-load.
- Verify 390 px, 800 px, and 1440 px before publishing.

---

### Task 1: Lock the gallery and asset contract with failing tests

**Files:**
- Modify: `tests/site-contract.test.mjs`
- Modify: `tests/image-performance.test.mjs`
- Modify: `tests/test_image_assets.py`

**Interfaces:**
- Consumes: existing static `life.html`, `phd-styles.css`, and image directories.
- Produces: exact assertions for 18-image order, continuous-mosaic classes, WebP tiers, loading policy, metadata safety, and cache token.

- [ ] **Step 1: Write failing tests**

Update the Life Photos assertions from 15 to 18, require the new three filenames first, require one prioritized gallery image and 17 lazy gallery images, require 320 px WebP variants, and require `.life-gallery` to be a 12-column dense grid with a clipped outer surface and two-column compact behavior.

- [ ] **Step 2: Run the focused tests and confirm RED**

Run:

```bash
node --test tests/site-contract.test.mjs tests/image-performance.test.mjs
python3 -m unittest tests.test_image_assets
```

Expected: failures for missing new assets, old 15-photo counts, old grid rules, and missing 320 px variants.

- [ ] **Step 3: Commit the contract tests with the implementation they govern**

Do not commit a deliberately failing intermediate state; retain the RED output as execution evidence and include the tests in the implementation commit.

### Task 2: Import safe source photographs and generate compact variants

**Files:**
- Create: `images/life/life-road-red-shirt.jpg`
- Create: `images/life/life-camera-portrait.jpg`
- Create: `images/life/life-jellyfish-aquarium.jpg`
- Modify: `scripts/generate_responsive_images.py`
- Create: `images/life/generated/life-road-red-shirt-*.webp`
- Create: `images/life/generated/life-camera-portrait-*.webp`
- Create: `images/life/generated/life-jellyfish-aquarium-*.webp`
- Modify: existing `images/life/generated/*.webp`

**Interfaces:**
- Consumes: all JPEG files immediately inside `images/life/`.
- Produces: metadata-free JPEG fallbacks and deterministic WebP candidates at 320/640/960/1280/source widths when the source is wide enough.

- [ ] **Step 1: Sanitize the three JPEG fallbacks**

Open each supplied file with Pillow, apply EXIF orientation, convert to RGB, and save to its semantic destination with JPEG quality 88, optimization enabled, and no metadata arguments.

- [ ] **Step 2: Update the generator**

Change Life Photo widths to the unique set derived from `(320, 640, 960, 1280, source.width)`, save with WebP quality 76 and method 6, and leave avatar/publication generation unchanged.

- [ ] **Step 3: Generate assets and run asset tests**

Run:

```bash
python3 scripts/generate_responsive_images.py
node --test tests/image-performance.test.mjs
python3 -m unittest tests.test_image_assets
```

Expected: all WebP and metadata tests pass within the defined byte ceilings.

### Task 3: Implement the continuous mosaic

**Files:**
- Modify: `life.html`
- Modify: `phd-styles.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: generated WebP filenames and CSS span classes.
- Produces: stable desktop/tablet/mobile mosaic markup, accurate responsive `sizes`, and a shared cache token.

- [ ] **Step 1: Add the three opening pictures**

Insert road, camera, and aquarium figures before the previous graduation photographs. Give the road image the lead span and priority attributes. Give both portraits lazy-loading, precise dimensions, semantic alternative text, and focal-point classes.

- [ ] **Step 2: Assign deterministic spans to the existing pictures**

Apply explicit `life-tile--landscape`, `life-tile--portrait`, `life-tile--soft-portrait`, and selected `life-tile--wide` classes while preserving DOM order.

- [ ] **Step 3: Replace card styling with one clipped grid surface**

Use a 12-column dense grid on desktop, six columns on tablet where needed, and two columns at 600 px. Remove per-image borders and radii, use one outer radius, keep 3–4 px gaps, and apply focal points without distorting images.

- [ ] **Step 4: Update responsive sources and cache token**

Add 320 px candidates to every Life Photo `srcset`, set tile-aware `sizes`, and update both pages to `20260806-life-mosaic-1` for CSS and JS references.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run:

```bash
node --test tests/site-contract.test.mjs tests/image-performance.test.mjs tests/clean-home-layout.test.mjs
```

Expected: all focused tests pass.

### Task 4: Verify rendering, performance, and publish

**Files:**
- Create: `artifacts/life-mosaic-mobile-390.png`
- Create: `artifacts/life-mosaic-tablet-800.png`
- Create: `artifacts/life-mosaic-desktop-1440.png`

**Interfaces:**
- Consumes: the completed static site.
- Produces: reproducible responsive screenshots, transfer metrics, a release commit, and verified GitHub Pages output.

- [ ] **Step 1: Run the full automated suite**

```bash
node --test tests/*.test.mjs worker/tests/*.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py'
node --check phd-main.js
node --check worker/src/index.mjs
git diff --check
```

- [ ] **Step 2: Run local browser QA**

Serve the worktree, capture 390/800/1440 screenshots, assert `scrollWidth === clientWidth`, inspect opening-tile geometry, and measure image resource transfer. Target no more than 450 KiB of Life gallery images at 390 px after scrolling the complete gallery.

- [ ] **Step 3: Commit only the scoped release files**

Stage the two HTML pages, CSS, generator, tests, three sanitized JPEGs, generated WebPs, and QA artifacts. Exclude `.DS_Store`, unrelated artifacts/docs, and `worker/.wrangler/`.

- [ ] **Step 4: Publish and verify production**

Confirm `origin/main` has not advanced, push the release commit to `main`, then verify the cache-busted production Life Photos page contains all three new filenames and the new cache token. No Worker deployment is required because Worker code is unchanged.

