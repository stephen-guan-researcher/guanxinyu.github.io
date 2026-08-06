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

### Task 1: Implement the tested continuous mosaic and compact assets

**Files:**
- Modify: `life.html`
- Modify: `phd-styles.css`
- Modify: `index.html`
- Modify: `scripts/generate_responsive_images.py`
- Modify: `tests/site-contract.test.mjs`
- Modify: `tests/image-performance.test.mjs`
- Modify: `tests/test_image_assets.py`
- Create: `images/life/life-road-red-shirt.jpg`
- Create: `images/life/life-camera-portrait.jpg`
- Create: `images/life/life-jellyfish-aquarium.jpg`
- Create: `images/life/generated/*-320.webp`
- Modify: existing `images/life/generated/*.webp`

**Interfaces:**
- Consumes: three supplied JPEGs plus the existing static gallery and image generator.
- Produces: safe JPEG fallbacks, compact WebP tiers, stable desktop/tablet/mobile mosaic markup, accurate responsive `sizes`, tests, and a shared cache token.

- [ ] **Step 1: Write failing gallery and asset tests**

Update assertions from 15 to 18 photographs, require the new three filenames first, preserve the previous order, require one prioritized gallery image and 17 lazy images, require 320 px WebP variants, and require the continuous 12-column / compact two-column CSS contract.

- [ ] **Step 2: Run focused tests and confirm RED**

```bash
node --test tests/site-contract.test.mjs tests/image-performance.test.mjs
python3 -m unittest tests.test_image_assets
```

Expected: failures for missing new assets, old counts, old grid rules, and missing 320 px variants.

- [ ] **Step 3: Sanitize sources and generate compact assets**

Open the supplied files with Pillow, apply EXIF orientation, convert to RGB, and save them under the three semantic filenames with JPEG quality 88, optimization enabled, and no metadata arguments. Change Life Photo generation to the unique set from `(320, 640, 960, 1280, source.width)` at WebP quality 76 / method 6, then regenerate all Life variants.

- [ ] **Step 4: Add the three opening pictures**

Insert road, camera, and aquarium figures before the previous graduation photographs. Give the road image the lead span and priority attributes. Give both portraits lazy-loading, precise dimensions, semantic alternative text, and focal-point classes.

- [ ] **Step 5: Assign deterministic spans to the existing pictures**

Apply explicit `life-tile--landscape`, `life-tile--portrait`, `life-tile--soft-portrait`, and selected `life-tile--wide` classes while preserving DOM order.

- [ ] **Step 6: Replace card styling with one clipped grid surface**

Use a 12-column dense grid on desktop, six columns on tablet where needed, and two columns at 600 px. Remove per-image borders and radii, use one outer radius, keep 3–4 px gaps, and apply focal points without distorting images.

- [ ] **Step 7: Update responsive sources and cache token**

Add 320 px candidates to every Life Photo `srcset`, set tile-aware `sizes`, and update both pages to `20260806-life-mosaic-1` for CSS and JS references.

- [ ] **Step 8: Run focused tests and confirm GREEN**

Run:

```bash
node --test tests/site-contract.test.mjs tests/image-performance.test.mjs tests/clean-home-layout.test.mjs
```

Expected: all focused tests pass.

### Task 2: Verify responsive rendering and performance

**Files:**
- Create: `artifacts/life-mosaic-mobile-390.png`
- Create: `artifacts/life-mosaic-tablet-800.png`
- Create: `artifacts/life-mosaic-desktop-1440.png`

**Interfaces:**
- Consumes: the completed static site.
- Produces: reproducible responsive screenshots, geometry assertions, transfer metrics, and a QA commit ready for final branch review and publication.

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

- [ ] **Step 3: Apply any QA-only layout or performance corrections**

If automated geometry or transfer targets fail, make only the smallest CSS, markup, responsive-source, or compression change needed and repeat Steps 1–2.

- [ ] **Step 4: Commit QA artifacts and any corrections**

Stage only the three named screenshots and QA-related corrections. Exclude `.DS_Store`, unrelated artifacts, and `worker/.wrangler/`. Publication to GitHub Pages is a controller action after final branch review; no Worker deployment is required because Worker code is unchanged.
