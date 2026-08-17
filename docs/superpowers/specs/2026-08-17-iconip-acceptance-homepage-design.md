# ICONIP 2026 Acceptance Homepage Update

## Objective

Update the existing CICL publication record to reflect its verified acceptance at ICONIP 2026 while preserving the homepage's compact visual hierarchy and conservative publication-status wording.

## Verified facts

- Paper title: `Decision-Aware Memory Cards: Counterfactual-Inspired Context Selection and Compression for Tool-Using LLM Agents`.
- Authors: Xinyu Guan, Qianyang Zhao, and Yuming Deng.
- Public paper URL: `https://arxiv.org/abs/2606.08151`.
- Acceptance notification date: August 14, 2026.
- Venue: ICONIP 2026.
- Proceedings series: Springer Communications in Computer and Information Science (CCIS).
- Status boundary: the paper is accepted for publication, but it is not yet published. Registration and camera-ready submission remain required before final proceedings publication.

## User-approved scope

Use the concise status-only approach. Do not add a new publication card, reviewer scores, review quotations, or benchmark metrics.

### Now timeline

Insert a new first item in August 2026:

- Status: `Accepted`
- Copy: `Decision-Aware Memory Cards was accepted for publication in the Springer CCIS proceedings of ICONIP 2026.`
- Link: the paper title or complete sentence continues to use the verified arXiv URL.

The existing reverse-chronological timeline remains intact after this new item.

### Publication card

Update the existing CICL card only:

- Status label: `Accepted`
- Metadata: `ICONIP 2026 · Springer CCIS · Accepted Aug 2026`
- Keep the existing title, author order, thumbnail, summary, and arXiv destination unchanged.
- Do not use `Published`, because no Springer proceedings page or proceedings DOI is public yet.

### Xinyu Agent

Synchronize both answer surfaces:

1. The browser-side publication fallback in `phd-main.js`.
2. The verified public profile context in `worker/src/index.mjs`.

Both surfaces must state that the paper was accepted at ICONIP 2026 for publication in Springer CCIS proceedings, preserve the exact title and author order, and keep the arXiv link as the only public paper destination. They must not describe the paper as already published.

## Implementation boundaries

- Start from the latest `origin/main` in an isolated branch; do not modify or merge the dirty `codex/cinematic-life-redesign` checkout.
- Preserve the responsive `<picture>` markup and generated WebP publication assets already present on `main`.
- Do not change layout, colors, typography, card count, publication order, or Life Photos.
- Bump the shared static asset cache token on both `index.html` and `life.html` so the updated browser-side Agent copy is fetched consistently.
- Static GitHub Pages deployment and Cloudflare Worker deployment are separate release steps.

## Test design

Follow red-green TDD:

1. Change the existing homepage contract test so it fails until the CICL card is `Accepted`, contains the ICONIP 2026 and Springer CCIS metadata, retains the authors and arXiv link, and does not say `Published`.
2. Change the Now timeline contract so it fails until the new accepted item is first, the reverse chronology is preserved, and the updated item count is correct.
3. Add or update browser-behavior coverage so the publication fallback reports the ICONIP acceptance without claiming publication.
4. Add Worker-context coverage for the exact title, authors, accepted status, ICONIP 2026, Springer CCIS, and the not-yet-published boundary.
5. Update the release-token contract before changing production files.

## Verification and release

- Run all root Node tests, Worker tests, Python image tests, and `git diff --check`.
- Preview from a local HTTP server at desktop and 390-pixel mobile widths; confirm no horizontal overflow, no failed images, and a readable Now timeline/publication card.
- Push the static site to `main`, deploy the Worker separately, and wait for the canonical site to expose the new cache token and acceptance copy.
- Query the production Agent with a CICL status question and verify that it answers `Accepted at ICONIP 2026`, mentions Springer CCIS when relevant, and does not answer `Published`.

## Non-goals

- No reviewer feedback or acceptance-score display.
- No new metrics in the publication summary.
- No Springer/DOI link until one is publicly verified.
- No redesign or unrelated resume edits.
