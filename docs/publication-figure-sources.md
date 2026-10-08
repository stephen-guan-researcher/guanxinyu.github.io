# Publication figure inventory — 2026-10-08

All 12 manuscript rows contain one image. Six existing figures are preserved. On the owner's request to fill the remaining slots with other pictures, six distinct conceptual cover illustrations replace the generic pending artwork. These are not original paper figures or scientific evidence.

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

## Original artwork source checks

| Manuscript | Source check | Result |
| --- | --- | --- |
| PIVOT | Scoped local manuscript search | No matching manuscript figure available; local idea-scoping note is not a paper figure. |
| How Deep Should a VLA Think When Thinking Costs Time? | `https://openreview.net/pdf?id=x6BEwIFvUc` | OpenReview requires browser verification; no PDF retrieved. |
| Static Gradient Attribution Within LoRA's B-Matrix | `https://openreview.net/pdf?id=g54eVrFPPI` | OpenReview requires browser verification; no PDF retrieved. |
| QESChunker | `https://openreview.net/pdf?id=pvrvPinZif` | OpenReview requires browser verification; no PDF retrieved. |
| When KL Regularization Fails | Scoped local manuscript search | No matching source figure available. |
| Diagnostics and Infrastructure / Runtime Stack survey | Scoped local manuscript search | No matching manuscript PDF available. |

The first OpenReview forum was also opened in the in-app browser and displayed its verification screen. The check was not bypassed or completed. These source-check outcomes remain unchanged; concept covers do not imply that PDFs were retrieved. The paper titles, authors, summaries, statuses, and verified URLs are unchanged in this cover-only revision.

## Current concept covers — editorial-4

| Manuscript | Fallback asset | Visual metaphor |
| --- | --- | --- |
| PIVOT | `images/paper-pivot-cover.png` | Prompt notebook, lens, and iterative choice |
| How Deep Should a VLA Think When Thinking Costs Time? | `images/paper-vla-cover.png` | Robot gripper, reasoning layers, and time |
| Static Gradient Attribution Within LoRA's B-Matrix | `images/paper-lora-cover.png` | Sparse matrix selection |
| QESChunker | `images/paper-qeschunker-cover.png` | Evidence chunks assembled into a document |
| When KL Regularization Fails | `images/paper-zcpo-cover.png` | Balanced reasoning paths |
| Runtime Stack survey | `images/paper-runtime-cover.png` | Runtime layers, memory, and tools |

- Method: built-in Image Gen, one separate call per asset. Each original is preserved, and site PNG fallbacks are resized to 1200 × 800.
- Each cover has `data-figure-status="illustration"`, descriptive alternative text ending with “not an original paper figure”, and a visible “Concept illustration” caption. No formulas, results, or author metadata are invented.
- Each cover has 320px, 640px, and 960px WebP variants. The largest is 28374 bytes; all six 640px variants together are 63030 bytes. Browser clients use these variants rather than downloading the full PNG by default.
- Exact prompts and original generated-image paths: [PIVOT and VLA](publication-cover-prompts-a.md), [LoRA and QESChunker](publication-cover-prompts-b.md), [ZCPO and Runtime](publication-cover-prompts-c.md).
- When authentic source figures become available, replace the corresponding cover while retaining the verified paper metadata. Existing six real figures were not replaced.

## Retired placeholder asset — editorial-3 history

- Method: built-in Image Gen; generated once, reused for six missing figures.
- Generated source: `/Users/stephen/.codex/generated_images/019f8dc5-6b53-71d2-beb2-cbf5593d096a/exec-cdbba4f7-c309-48a7-86e6-34ba2c3c66f7.png`.
- Site fallback: `images/paper-figure-pending.png` (1200 × 800).
- Responsive WebP variants: `images/generated/paper-figure-pending-{320,640,960}.webp` (760, 2220, and 5282 bytes respectively).
- This older generic asset remains in the repository for recoverability, but is no longer referenced by the homepage or the active paper-image generation list.
- Final prompt: “Use case: productivity-visual. Asset type: reusable publication thumbnail for a minimalist white academic homepage. Create one flat landscape 3:2 bitmap asset, clean white/off-white #fafafa background. Center a very small, thin light-gray outline of a plain empty document (no fake text, no graph, no data). Under it, exact text 'Figure pending' in medium-small dark gray modern sans-serif, with generous empty space. This is explicitly an honest pending-image placeholder, NOT a scientific illustration. Monochrome only, no gradient, no shadow, no rounded card, no border frame, no logo, no watermark. Calm editorial style, readable at 300px wide.”

## Survey venue correction

The owner corrected the venue to **Frontiers of Computer Science** on October 8, 2026. Official journal title reference: <https://link.springer.com/journal/11704>. Do not conflate this with **Frontiers in Computer Science**, a different journal. Preserve the owner-reported Submitted label; no acceptance, exact submission date, author list, or public paper URL is inferred. Browser routing summaries and the local Worker knowledge context use the same corrected venue. The Worker has not been deployed in this local-preview update.
