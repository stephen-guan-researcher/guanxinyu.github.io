# Editorial homepage design QA

final result: passed

## Latest revision — editorial-11 venue labels on decorative backgrounds

- At the owner's request, the PIVOT background now reads “CVPR” and the Runtime Stack survey background reads “Frontiers of Computer Science”, replacing “Figure coming soon”. Paper-specific accessible venue labels and centered, wrapping text preserve readability in the 220px figure column.
- The decorative asset, all nine authentic figures, publication titles, authors, summaries, links, and adjacent manuscript statuses are unchanged. PIVOT remains In Preparation; the survey remains Submitted. No acceptance or new submission is implied.
- Browser verified both exact labels, loaded backgrounds, 11 rows, no horizontal overflow, and long-label containment. Preview: `http://127.0.0.1:8000/index.html?v=20261008-editorial-11#papers`. Proof: `/Users/stephen/Desktop/research_project/guanxinyu.github.io/artifacts/editorial-20261008/papers-v11-venue-background.png`.
- Validation: all 138 Node tests and three Python image tests passed. No website push or Worker deployment was performed.
- The sections below retain earlier revision evidence.

## Latest revision — editorial-10 decorative background for pending figures

- The owner requested an attractive background while preserving English pending wording. A new pale blue-gray and sage paper-wave background was generated with built-in ImageGen. Root inspected the output: quiet central whitespace, restrained texture, no baked-in text, scientific diagram, or invented result.
- PIVOT and Runtime Stack retain exact “Figure coming soon” HTML text and paper-specific accessible labels. Their shared responsive background is decorative, with empty alt text and hidden picture/image accessibility. All nine authentic figures and publication metadata are unchanged.
- The 1200 × 800 PNG fallback has 320px/640px/960px WebP tiers of 3068/10742/26446 bytes. Both slots use the same URL at a given tier, enabling normal browser reuse. Source and full prompt: `docs/pending-figure-background.md`.
- Browser verified both backgrounds loaded from the 640px tier, exact labels, 220 × 146.67 display slots, 11 rows, no horizontal overflow, and no console warnings/errors. Local preview: `http://127.0.0.1:8000/index.html?v=20261008-editorial-10#papers`. Proof: `/Users/stephen/Desktop/research_project/guanxinyu.github.io/artifacts/editorial-20261008/papers-v10-pending-background.png`.
- Validation: 138 Node tests and three Python image tests passed. A test-only stale-release regex was corrected to distinguish editorial-1 from editorial-10. No website push or Worker deployment was performed.
- The sections below retain earlier revision evidence.

## Latest revision — editorial-9 English pending labels

- At the owner's request, PIVOT and Runtime Stack use text-only “Figure coming soon” image placeholders. Each has a paper-specific English accessible label. All nine authentic figures and all publication metadata are unchanged; prior generated images are retained but not fetched by the current homepage.
- Local preview: `http://127.0.0.1:8000/index.html?v=20261008-editorial-9#papers`. Browser verified both exact English labels, 11 rows, and no horizontal overflow. Screenshot: `/Users/stephen/Desktop/research_project/guanxinyu.github.io/artifacts/editorial-20261008/papers-v9-english-pending.png`.
- All 138 Node tests and three Python image tests passed; no website push or Worker deployment was performed.
- The sections below retain earlier revision evidence.

## Latest revision — editorial-8 new theme illustrations

- The owner requested pictures instead of the editorial-7 pending labels. Two fresh illustrations were generated in separate built-in ImageGen calls: a tactile prompt/evidence composition for PIVOT and a layered infrastructure composition for the Runtime Stack survey. Root inspected both full-size outputs for clean composition, restrained palette, and absence of text, equations, invented results, or logos.
- Each illustration is visibly captioned “示意配图”, marked `data-figure-status="illustration"`, and has alt text stating it is not an original paper figure. Exact prompts, original paths, and final project paths are in `docs/publication-theme-illustrations-v2.md`.
- Both outputs are saved as 1200 × 800 PNG fallbacks with 320px/640px/960px WebP tiers. The two 640px variants total 20672 bytes; the largest tier is 20496 bytes. Original generated images, earlier covers, and manuscript artwork are preserved.
- Current inventory: 11 rows, nine unchanged original figures, two new illustrations. No paper title, author, status, venue, description, URL, or Worker fact changed.
- Local preview: `http://127.0.0.1:8000/index.html?v=20261008-editorial-8#papers`. Browser verified both new 640px WebP images loaded, exact Chinese captions, 11 rows, no horizontal overflow, and no console warnings/errors. Proof: `/Users/stephen/Desktop/research_project/guanxinyu.github.io/artifacts/editorial-20261008/papers-v8-theme-illustrations.png`.
- Validation: all 138 Node tests and three Python image tests passed; `git diff --check` is clean. No website push or Worker deployment was performed.
- The sections below retain earlier revision evidence.

## Latest revision — editorial-7 missing figures labeled 待补充

- At the owner's request, PIVOT and Runtime Stack concept covers are replaced by light-gray text-only “待补充” placeholders in the existing figure column. The figure labels identify the associated paper for assistive technology. No image or picture element is used in either slot, so these placeholders incur no image requests.
- Inventory remains 11 distinct papers/manuscripts: nine unchanged authentic figures and two pending slots. Titles, authors, summaries, statuses, venues, and links are unchanged. All previous cover assets and prompt notes remain recoverable but are removed from the active image-generation list.
- Local preview: `http://127.0.0.1:8000/index.html?v=20261008-editorial-7#papers`. Browser checks confirm exactly two accessible placeholders, each reading “待补充”, nine image elements, 11 rows, and no horizontal overflow.
- Verification: all 138 Node tests and three Python image tests passed; the release token is synchronized across both pages and tests. No website push or Worker deployment was performed.
- Screenshot: `/Users/stephen/Desktop/research_project/guanxinyu.github.io/artifacts/editorial-20261008/papers-v7-pending.png`.
- The sections below retain earlier revision evidence.

## Latest revision — editorial-6 KL record temporarily excluded

- At the owner's request, the unresolved KL/ZCPO manuscript is removed from the homepage, browser publication facts, and local Worker context. No anonymous OpenReview paper is attributed to the owner. This exclusion is not a finding that the historical manuscript belongs to someone else.
- Current inventory: 11 distinct papers/manuscripts, nine authentic figures, two explicitly labeled concept covers. All other publication metadata and figures are unchanged. The old KL cover, variants, prompt notes, and previous committed entry remain recoverable; see `docs/publication-record-exclusions.md`.
- Local preview: `http://127.0.0.1:8000/index.html?v=20261008-editorial-6#papers`. The in-app browser verified 11 cards, no KL card, all 11 paper images loaded through optimized WebP sources, no horizontal overflow, and no console warnings/errors.
- Screenshot: `/Users/stephen/Desktop/research_project/guanxinyu.github.io/artifacts/editorial-20261008/papers-v6-kl-hidden.png` shows SILICA immediately followed by Advantage Scale Calibration, with no intervening KL row.
- Verification: all 138 Node tests and three Python image tests passed. The cache token is synchronized across both pages and release tests. No website push or Worker deployment was performed; production is unchanged.
- The sections below retain earlier revision evidence and are not the current publication inventory.

## Latest revision — editorial-5 authentic PDF figures

- Request: replace the three OpenReview concept covers using the owner's downloaded PDFs. Verified first-page titles match VLA Early Exit (`1.pdf`), LoRA Attribution (`2.pdf`), and QESChunker (`3.pdf`). PDFs remain unchanged and are not added to the public site.
- Authentic selections: VLA page 2 Figure 1 (all method panels), LoRA page 2 Figure 1(a) (complete method/comparison panel), QESChunker page 2 Figure 1 (complete overview). Root inspected all three PNGs for source fidelity, natural aspect ratio, intact figure boundaries and labels, and absence of surrounding captions/body text/line numbers. No generative image editing was used.
- LoRA's initial full Figure 1 included both method and results and was too dense for the small homepage slot. Selecting the complete method subfigure improved its ratio from near-square to 1344 × 728 and reduced the largest WebP below the unchanged 90000-byte ceiling. No result curve was selectively cropped or reconstructed.
- Current inventory: nine authentic figures and three explicitly labeled concept covers (PIVOT, KL/ZCPO, Runtime Stack survey). The other nine complete figure blocks and all publication prose, authors, statuses, venues, and links are unchanged relative to `fae3c18`.
- Final fallback dimensions: VLA 1584 × 792, LoRA 1344 × 728, QESChunker 1938 × 828, all RGB PNG. Responsive 320px/640px/960px WebP tiers are lazy-loaded; largest of the nine new variants is 72588 bytes. All three 640px tiers total 121252 bytes.
- Local preview: `http://127.0.0.1:8000/index.html?v=20261008-editorial-5#paper-vla-early-exit`. The new cache token is consistent across both pages and tests. No Git push or Worker deployment was performed; production remains unchanged.
- Browser evidence: `artifacts/editorial-20261008/papers-v5-real-figures.jpg` in the durable workspace captures all three updated rows. The actual default CSS viewport was 775 × 959 at DPR 2 (not the initially requested desktop override); the screenshot is 775 × 959. Images loaded successfully and had no concept captions or horizontal overflow. This is an actual tablet-width rendering, not a claimed 1190px desktop comparison.
- Phone: actual CSS 390 × 844 at DPR 1, no overflow; all 12 paper images loaded and three concept captions remain. VLA, LoRA, QES display at 350 × 175, 350 × 189.765625, and 350 × 149.296875 respectively, with matching picture wrapper heights and no clipping. `artifacts/editorial-20261008/mobile-v5-real-figures.jpg` records VLA and LoRA at that state. Actual 320 × 740 at DPR 1 also has no horizontal overflow. Temporary viewport overrides were reset before handoff. Console error/warning check returned no entries.
- Verification: 137 Node tests and 3 Python image tests passed; `git diff --check` is clean. Independent read-only review confirmed the exact three-slot scope and preserved metadata. PDF hashes, bounding boxes, source-page identification, selected figure content, and output hashes are recorded in the three extraction notes linked from `docs/publication-figure-sources.md`.
- No actionable P0/P1/P2 image integration defects remain. LoRA title synchronization (the supplied PDF includes “on Loss-Based Forgetting”) was offered as an optional separate choice; no title changes are included without that choice.
- The following sections are retained history for editorial-4 and earlier design revisions, not the current figure inventory.

## Latest revision — editorial-4 concept covers

- Request: fill the six generic pending slots with other pictures. No publication metadata, original research figures, layout hierarchy, or Worker context changed in this revision.
- Local preview: `http://127.0.0.1:8000/index.html?v=20261008-editorial-4#papers`. Production remains unchanged.
- Six individually generated, topic-specific concept covers replace the shared pending image. Each uses a visible “Concept illustration” caption, descriptive alt text, and `data-figure-status="illustration"`; none claims to be source-paper artwork or scientific evidence. Exact prompts and provenance are linked in `docs/publication-figure-sources.md`.
- Root visually inspected all six full-size covers. Their white backgrounds, restrained gray line work, muted blue/sage accents, and distinct subjects fit the existing editorial treatment.
- Browser confirmed all 12 paper images loaded: six distinct concept covers and six untouched original figures. Desktop selected the optimized 640px WebP variants; all six cover variants at that tier together total 63030 bytes. Largest single cover variant at any tier is 28374 bytes.
- Desktop evidence: `artifacts/editorial-qa/papers-v4-final.jpg`, CSS viewport 1190 × 1322, DPR 1, Publications selected, no horizontal overflow. The capture is the in-app viewport-only image (1190 × 1234, bottom strip omitted by the capture API), not a claim of a full-page capture.
- Mobile evidence: `artifacts/editorial-qa/mobile-v4-final.jpg` (390 × 844) and `mobile-v4-320-final.jpg` (320 × 740), DPR 1, no horizontal overflow. At 390px the cover picture and image both render at 230px, with a readable caption and intact title/author/summary flow.
- Automated verification: all 137 Node tests and 3 Python image tests passed, including unique cover mappings, unchanged original artwork, disclosure captions, real image signatures, responsive variant dimensions, image byte ceilings, and matching editorial-4 cache tokens. `git diff --check` is clean.
- No actionable P0/P1/P2 visual issues remain in the changed surface. The following sections retain earlier editorial-3 comparison history and are not the latest cover inventory.

## Reference and scope

- Approved image: `artifacts/editorial-qa/reference.png` (1190 × 1322 pixels).
- Original image: `/Users/stephen/.codex/generated_images/019f8dc5-6b53-71d2-beb2-cbf5593d096a/exec-e054b21a-0a2b-4ebe-b606-ec7f41eda0f1.png`.
- Local implementation: `http://127.0.0.1:8000/index.html?v=20261008-editorial-3`.
- Base: current published release commit `5ec9048`, copied into an independent local checkout. The unrelated dirty original workspace was not overwritten.
- This is a local preview, not a production release. No Git push or Worker deployment was performed.

## Comparison evidence

- Full comparison input: `artifacts/editorial-qa/comparison-v3-final.jpg`, placing the approved reference and browser-rendered implementation together (2380 × 1322).
- Focused comparison input: `artifacts/editorial-qa/timbre-v3-focused-comparison.jpg`, comparing the source design and rendered TIMBRE figure, title, verified authors, metadata, introduction, and links in one input. Complete authors and verified arXiv metadata intentionally take more space than the mock.
- Final implementation: `artifacts/editorial-qa/desktop-v3-final.jpg` and `artifacts/editorial-qa/papers-v3-final.jpg`.
- Browser full-document capture: `artifacts/editorial-qa/home-v3-final-full.jpg` (1190 × 5757), cropped without scaling to the first 1190 × 1322 pixels for comparison. Survey detail is `artifacts/editorial-qa/survey-v3-final.jpg`.
- CSS viewport: 1190 × 1322; devicePixelRatio: 1. Source and comparison image density are 1:1. The in-app viewport-only capture omitted its bottom strip; the full-document capture and exact top crop were used to avoid that clipping. A clip-API experiment was not used as final evidence.
- State: homepage at top, career detail disclosures closed, Agent closed. Reference highlights Experience, while the final top-of-page state appropriately highlights About.

## Surface review

| Surface | Result |
| --- | --- |
| Typography | Large sans-serif bilingual name; black titles and restrained gray supporting text. Linked paper titles inherit the same weight as unlinked titles. |
| Layout | White canvas, slim fixed navigation rail, top-right portrait, career-first rows, thin separators. Four principal employers are visible; full role details remain expandable. |
| Color | No decorative gradients or colored dashboard cards; color comes from the real portrait and research figures. |
| Images | Original portrait and six authentic publication figures reused. Six unavailable figures use the same honest Figure pending raster asset, explicitly requested by the owner. All 12 rows contain one image, contained rather than cropped. Existing optimized WebP/srcset/lazy-loading assets remain. All 18 Life Photos and their order are preserved. |
| Copy | Full verified author lists, descriptions, venues, and status retained. TIMBRE has its public arXiv link; PIVOT is still in preparation for CVPR. The survey venue is Frontiers of Computer Science, corrected by the owner, with Submitted retained and no acceptance or active-review claim. Local Agent context is synchronized. |

Intentional differences from the illustrative reference: all 12 manuscripts remain, in the existing newest-first order; six missing source figures now have explicitly labeled pending artwork, as requested in this revision. No scientific content was fabricated. The full original employment evidence is kept behind Details; earlier Mico experience remains expandable. WeChat and LinkedIn remain available. News is retained in a lower disclosure instead of a right-side card. The mockup's abbreviated author line is replaced by the complete verified author list.

## Comparison and fix history

1. P1 — inherited `grid-area: photo` created implicit hero columns and misplaced the portrait. Reset grid area. Evidence: `desktop-before.jpg` → `desktop-v2.jpg`.
2. P2 — six default career rows and long team names crowded the intended career-first composition. Grouped Tencent's two original team scopes under one employer, retained all eight team bullets, moved Mico into Earlier experience, and tightened alignment/spacing. All 16 original employment bullets and six original appointment scopes remain. Evidence: `desktop-v2.jpg` → `desktop-final.jpg`.
3. P1 — mobile supporting role overlapped the Chinese name. Removed the negative margin and placed supporting copy in a full-width grid row. Evidence: `mobile-before.jpg` → `mobile-final.jpg`; 320px bounds also verified.
4. P2 — inherited four publication grid rows generated empty space. Reset `grid-template-rows: auto`; made true figures fluid-width and aligned their responsive source sizes. Evidence: intermediate desktop capture → `full-document.jpg` and `paper-comparison.jpg`.
5. P2 — linked titles inherited a lighter link weight. Set title links to inherit heading weight and retained visible keyboard focus. Evidence: `paper-comparison.jpg`.
6. P2 — ratio-only scrollspy could leave Experience active during a very long paper section. Added frame-coalesced positional tracking and a regression test. Rechecked with TIMBRE at 88px from viewport top: Publications active.
7. P2 — this revision's mobile image check found that the picture wrapper retained a 210px ceiling while its image could reach 230px. Matched both ceilings at 230px, preventing bottom-edge clipping; a CSS regression assertion now covers both selectors. Post-fix browser check confirmed matching 230px heights, 17px body separation, and no horizontal overflow. Cache token advanced to editorial-3 so the corrected CSS is loaded.

Revision-specific source checks: scoped local searches did not find PDFs for PIVOT, ZCPO, or the Runtime Stack survey. The three new ICLR OpenReview PDF downloads returned verification-required responses; the in-app browser also displayed the verification screen. No CAPTCHA was bypassed. See `docs/publication-figure-sources.md` for precise sources and the honest pending-image manifest. Six pending figures reuse a single 640px WebP of 2220 bytes on desktop, with 320px/960px tiers of 760/5282 bytes. All 12 image loads were verified in the browser. Early captures with an inconsistent in-app density were discarded from final visual comparison; final desktop evidence is CSS 1190 × 1322 at DPR 1.

No actionable P0/P1/P2 visual issues remain in the final compared state. Minor P3: reference and production text wrapping differ where complete verified content is longer than the illustrative mockup.

## Responsive and functional QA

- Desktop: 1190 × 1322; no horizontal overflow. `desktop-final.jpg`, `papers-desktop.jpg`, `experience-expanded.jpg`, `life-desktop.jpg`.
- Tablet: 768 × 1024; navigation reflows to a sticky horizontal header; no horizontal overflow. `tablet.jpg`.
- Phone: 390 × 844 and 320 × 740; no horizontal overflow; portrait, full-width supporting copy, stacked paper figures and photo mosaic checked. `mobile-final.jpg`, `mobile-320.jpg`, `papers-mobile.jpg`, `life-mobile.jpg`.
- Updated publication images: `artifacts/editorial-qa/mobile-v3-final.jpg` captures the 390 × 844 paper view at DPR 1 after clicking Publications; matching 230px picture/image heights and 17px image-to-text gap were verified. `mobile-v3-320-final.jpg` records the additional 320 × 740 no-overflow check. The browser viewport override was reset before handoff.
- Details opened and closed; original Alibaba evidence was visibly present and correctly scoped.
- TIMBRE title clicked; an actual new browser tab opened at `https://arxiv.org/abs/2610.04795` with the matching paper title.
- Life Photos navigation and first optimized images loaded successfully; 18-photo preservation covered by structural and image tests.
- Agent opens as a native dialog with focused input, closes/returns focus, supports Escape/source navigation, and does not use avatars or a scripted answer fallback.
- Live test from the API-approved local origin on port 8000 returned a Llama 4 Scout response describing AutoResearch, post-training, Agentic RL, and Xianyu inspection. An initial test on preview port 8767 was blocked by the existing origin allowlist; the preview was moved to allowed port 8000 rather than weakening the backend allowlist.
- Local Worker context was synchronized, but this newer context is not deployed. The live connectivity test is not a claim that those new Worker facts are already online.
- Page console error/warning inspection after the successful model request returned an empty list.
- Final automated verification for editorial-3: 137/137 Node tests and 3/3 Python image tests passed; `git diff --check` clean. The new tests enforce 12 figure rows, six explicitly pending images, unchanged real artwork, corrected venue across homepage/Agent, and compact responsive pending assets.

## Handoff

The local preview is ready for user review. The production site remains unchanged.
