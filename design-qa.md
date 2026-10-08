# Editorial homepage design QA

final result: passed

## Reference and scope

- Approved image: `artifacts/editorial-qa/reference.png` (1190 × 1322 pixels).
- Original image: `/Users/stephen/.codex/generated_images/019f8dc5-6b53-71d2-beb2-cbf5593d096a/exec-e054b21a-0a2b-4ebe-b606-ec7f41eda0f1.png`.
- Local implementation: `http://127.0.0.1:8000/index.html?v=20261008-editorial-1`.
- Base: current published release commit `5ec9048`, copied into an independent local checkout. The unrelated dirty original workspace was not overwritten.
- This is a local preview, not a production release. No Git push or Worker deployment was performed.

## Comparison evidence

- Full comparison input: `artifacts/editorial-qa/comparison-final.jpg`, placing the approved reference and browser-rendered implementation together.
- Focused comparison input: `artifacts/editorial-qa/paper-comparison.jpg`, comparing the TIMBRE figure, title, verified authors, metadata, introduction, and links.
- Final implementation: `artifacts/editorial-qa/desktop-final.jpg`.
- Browser full-document capture: `artifacts/editorial-qa/full-document.jpg` (1190 × 5231), cropped without scaling to the first 1190 × 1322 pixels for comparison.
- CSS viewport: 1190 × 1322; devicePixelRatio: 1. Source and comparison image density are 1:1. The in-app viewport-only capture omitted its bottom strip; the full-document capture and exact top crop were used to avoid that clipping. A clip-API experiment was not used as final evidence.
- State: homepage at top, career detail disclosures closed, Agent closed. Reference highlights Experience, while the final top-of-page state appropriately highlights About.

## Surface review

| Surface | Result |
| --- | --- |
| Typography | Large sans-serif bilingual name; black titles and restrained gray supporting text. Linked paper titles inherit the same weight as unlinked titles. |
| Layout | White canvas, slim fixed navigation rail, top-right portrait, career-first rows, thin separators. Four principal employers are visible; full role details remain expandable. |
| Color | No decorative gradients or colored dashboard cards; color comes from the real portrait and research figures. |
| Images | Original portrait and six authentic publication figures reused. Figures are contained, not cropped. Existing optimized WebP/srcset/lazy-loading assets remain. All 18 Life Photos and their order are preserved. |
| Copy | Full verified author lists, descriptions, venues, and status retained. TIMBRE has its public arXiv link; PIVOT is still in preparation for CVPR. Frontiers survey uses historical Submitted, not an acceptance or active-review claim. |

Intentional differences from the illustrative reference: all 12 manuscripts remain, in the existing newest-first order; papers without a real source figure have no fabricated placeholder image. The full original employment evidence is kept behind Details; earlier Mico experience remains expandable. WeChat and LinkedIn remain available. News is retained in a lower disclosure instead of a right-side card. The mockup's abbreviated author line is replaced by the complete verified author list.

## Comparison and fix history

1. P1 — inherited `grid-area: photo` created implicit hero columns and misplaced the portrait. Reset grid area. Evidence: `desktop-before.jpg` → `desktop-v2.jpg`.
2. P2 — six default career rows and long team names crowded the intended career-first composition. Grouped Tencent's two original team scopes under one employer, retained all eight team bullets, moved Mico into Earlier experience, and tightened alignment/spacing. All 16 original employment bullets and six original appointment scopes remain. Evidence: `desktop-v2.jpg` → `desktop-final.jpg`.
3. P1 — mobile supporting role overlapped the Chinese name. Removed the negative margin and placed supporting copy in a full-width grid row. Evidence: `mobile-before.jpg` → `mobile-final.jpg`; 320px bounds also verified.
4. P2 — inherited four publication grid rows generated empty space. Reset `grid-template-rows: auto`; made true figures fluid-width and aligned their responsive source sizes. Evidence: intermediate desktop capture → `full-document.jpg` and `paper-comparison.jpg`.
5. P2 — linked titles inherited a lighter link weight. Set title links to inherit heading weight and retained visible keyboard focus. Evidence: `paper-comparison.jpg`.
6. P2 — ratio-only scrollspy could leave Experience active during a very long paper section. Added frame-coalesced positional tracking and a regression test. Rechecked with TIMBRE at 88px from viewport top: Publications active.

No actionable P0/P1/P2 visual issues remain in the final compared state. Minor P3: reference and production text wrapping differ where complete verified content is longer than the illustrative mockup.

## Responsive and functional QA

- Desktop: 1190 × 1322; no horizontal overflow. `desktop-final.jpg`, `papers-desktop.jpg`, `experience-expanded.jpg`, `life-desktop.jpg`.
- Tablet: 768 × 1024; navigation reflows to a sticky horizontal header; no horizontal overflow. `tablet.jpg`.
- Phone: 390 × 844 and 320 × 740; no horizontal overflow; portrait, full-width supporting copy, stacked paper figures and photo mosaic checked. `mobile-final.jpg`, `mobile-320.jpg`, `papers-mobile.jpg`, `life-mobile.jpg`.
- Details opened and closed; original Alibaba evidence was visibly present and correctly scoped.
- TIMBRE title clicked; an actual new browser tab opened at `https://arxiv.org/abs/2610.04795` with the matching paper title.
- Life Photos navigation and first optimized images loaded successfully; 18-photo preservation covered by structural and image tests.
- Agent opens as a native dialog with focused input, closes/returns focus, supports Escape/source navigation, and does not use avatars or a scripted answer fallback.
- Live test from the API-approved local origin on port 8000 returned a Llama 4 Scout response describing AutoResearch, post-training, Agentic RL, and Xianyu inspection. An initial test on preview port 8767 was blocked by the existing origin allowlist; the preview was moved to allowed port 8000 rather than weakening the backend allowlist.
- Local Worker context was synchronized, but this newer context is not deployed. The live connectivity test is not a claim that those new Worker facts are already online.
- Page console error/warning inspection after the successful model request returned an empty list.
- Final automated verification: 136/136 Node tests and 3/3 Python image tests passed; `git diff --check` clean.

## Handoff

The local preview is ready for user review. The production site remains unchanged.
