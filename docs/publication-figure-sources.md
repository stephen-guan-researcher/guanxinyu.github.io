# Publication figure inventory — 2026-10-08

The 11 visible manuscript rows in editorial-11 use nine authentic paper figures and two venue-labeled decorative backgrounds (PIVOT and the Runtime Stack survey). The HTML overlays read “CVPR” and “Frontiers of Computer Science”; the background is explicitly decorative, not manuscript artwork. These labels do not imply acceptance: PIVOT remains In Preparation and the survey remains Submitted in the adjacent metadata. All earlier covers and theme illustrations remain recoverable but are not used on the current homepage. The unresolved KL/ZCPO record remains excluded; see [record exclusions](publication-record-exclusions.md).

## Current pending-artwork background — editorial-11

Both pending slots use `images/paper-figure-pending-background.png` with 320px/640px/960px WebP tiers, lazy loading, empty image alt text, and `aria-hidden="true"` on the decorative picture/image. Each figure has a paper-specific accessible venue label. [Prompt and provenance](pending-figure-background.md).

## Retired thematic illustrations — editorial-8 history

| Manuscript | Site asset | Theme |
| --- | --- | --- |
| PIVOT | `images/paper-pivot-concept-v2.png` | Prompt and visual-evidence tiles |
| Runtime Stack survey | `images/paper-runtime-concept-v2.png` | Layered runtime infrastructure |

Generated separately with the built-in ImageGen tool. Both have 1200 × 800 PNG fallbacks and 320px/640px/960px WebP variants. Full prompts and original output paths are recorded in [generation notes](publication-theme-illustrations-v2.md). Nine authentic paper figures and all publication metadata are unchanged.

## Existing source artwork retained

| Manuscript | Local image |
| --- | --- |
| TIMBRE | `images/paper-timbre-overview.png` |
| SILICA | `images/paper-silica-identifiability.png` |
| Advantage Scale Calibration | `images/paper-advantage-maxnorm-ac.png` |
| Decision-Aware Memory Cards | `images/paper3-cicl-pipeline.png` |
| Optimizing Text Search | `images/paper2-suffix-tree.png` |
| Basket-Enhanced Heterogenous Hypergraph | `images/paper1-hypergraph.png` |

These six assets were already part of the verified homepage; this update does not imply that their original PDFs were fetched again.

## Original figures supplied by the owner — editorial-5

| Manuscript | Supplied PDF | Selected source figure | Site asset | Extraction record |
| --- | --- | --- | --- | --- |
| VLA Early Exit | `/Users/stephen/Downloads/1.pdf` | Page 2, Figure 1: Method, all three panels | `images/paper-vla-early-exit.png` | [Provenance](vla-figure-extraction.md) |
| LoRA Attribution | `/Users/stephen/Downloads/2.pdf` | Page 2, Figure 1(a): Method and comparison | `images/paper-lora-attribution.png` | [Provenance](lora-figure-extraction.md) |
| QESChunker | `/Users/stephen/Downloads/3.pdf` | Page 2, Figure 1: method overview | `images/paper-qeschunker-overview.png` | [Provenance](qeschunker-figure-extraction.md) |

The first-page titles were checked before matching these PDFs to homepage rows. These images are faithful RGB raster extractions of source figures, preserving their natural aspect ratios and original labels/colors; no AI generation, redrawing, or reconstructed results are used. Captions, body text, running headers, review line numbers, and page numbers are excluded. Each has responsive 320px/640px/960px WebP tiers and lazy loading. The original PDFs are unchanged and are not copied into the public website.

Only these three figure sources and the related tests/cache token change in this revision. Existing authors, summaries, venues, statuses, links, and the other nine images remain unchanged. The supplied LoRA PDF has a longer title including “on Loss-Based Forgetting”; title synchronization is awaiting the owner's preference and does not block image replacement.

## Earlier OpenReview source checks — editorial-3 history

| Manuscript | Source check | Result |
| --- | --- | --- |
| PIVOT | Scoped local manuscript search | No matching manuscript figure available; local idea-scoping note is not a paper figure. |
| How Deep Should a VLA Think When Thinking Costs Time? | `https://openreview.net/pdf?id=x6BEwIFvUc` | OpenReview requires browser verification; no PDF retrieved. |
| Static Gradient Attribution Within LoRA's B-Matrix | `https://openreview.net/pdf?id=g54eVrFPPI` | OpenReview requires browser verification; no PDF retrieved. |
| QESChunker | `https://openreview.net/pdf?id=pvrvPinZif` | OpenReview requires browser verification; no PDF retrieved. |
| When KL Regularization Fails | Scoped local manuscript search | No matching source figure available. |
| Diagnostics and Infrastructure / Runtime Stack survey | Scoped local manuscript search | No matching manuscript PDF available. |

The first OpenReview forum was also opened in the in-app browser and displayed its verification screen. The check was not bypassed or completed. These describe the earlier online access attempts; the owner subsequently downloaded and supplied three PDFs, which now resolve the VLA, LoRA, and QESChunker source-artwork gaps. The other three source gaps remain unresolved.

## Retired concept covers — editorial-6 history

| Manuscript | Fallback asset | Visual metaphor |
| --- | --- | --- |
| PIVOT | `images/paper-pivot-cover.png` | Prompt notebook, lens, and iterative choice |
| Runtime Stack survey | `images/paper-runtime-cover.png` | Runtime layers, memory, and tools |

- Method: built-in Image Gen, one separate call per asset in editorial-4. Each original is preserved, and site PNG fallbacks are resized to 1200 × 800.
- Each cover has `data-figure-status="illustration"`, descriptive alternative text ending with “not an original paper figure”, and a visible “Concept illustration” caption. No formulas, results, or author metadata are invented.
- Each remaining cover has 320px, 640px, and 960px WebP variants. The largest is 28374 bytes. Browser clients use these variants rather than downloading the full PNG by default.
- Exact prompts and original generated-image paths: [PIVOT and VLA](publication-cover-prompts-a.md), [LoRA and QESChunker](publication-cover-prompts-b.md), [ZCPO and Runtime](publication-cover-prompts-c.md).
- When authentic source figures become available, replace the corresponding cover while retaining the verified paper metadata. Existing six real figures were not replaced.
- All first-version concept-cover files (PIVOT, VLA, LoRA, QESChunker, KL/ZCPO, and Runtime Stack) and their prompts remain as recoverable history, but are not referenced by the current homepage or the active paper-image generation list. The two editorial-8 illustrations use distinct `concept-v2` filenames.

## Retired placeholder asset — editorial-3 history

- Method: built-in Image Gen; generated once, reused for six missing figures.
- Generated source: `/Users/stephen/.codex/generated_images/019f8dc5-6b53-71d2-beb2-cbf5593d096a/exec-cdbba4f7-c309-48a7-86e6-34ba2c3c66f7.png`.
- Site fallback: `images/paper-figure-pending.png` (1200 × 800).
- Responsive WebP variants: `images/generated/paper-figure-pending-{320,640,960}.webp` (760, 2220, and 5282 bytes respectively).
- This older generic asset remains in the repository for recoverability, but is no longer referenced by the homepage or the active paper-image generation list.
- Final prompt: “Use case: productivity-visual. Asset type: reusable publication thumbnail for a minimalist white academic homepage. Create one flat landscape 3:2 bitmap asset, clean white/off-white #fafafa background. Center a very small, thin light-gray outline of a plain empty document (no fake text, no graph, no data). Under it, exact text 'Figure pending' in medium-small dark gray modern sans-serif, with generous empty space. This is explicitly an honest pending-image placeholder, NOT a scientific illustration. Monochrome only, no gradient, no shadow, no rounded card, no border frame, no logo, no watermark. Calm editorial style, readable at 300px wide.”

## Survey venue correction

The owner corrected the venue to **Frontiers of Computer Science** on October 8, 2026. Official journal title reference: <https://link.springer.com/journal/11704>. Do not conflate this with **Frontiers in Computer Science**, a different journal. Preserve the owner-reported Submitted label; no acceptance, exact submission date, author list, or public paper URL is inferred. Browser routing summaries and the local Worker knowledge context use the same corrected venue. The Worker has not been deployed in this local-preview update.
