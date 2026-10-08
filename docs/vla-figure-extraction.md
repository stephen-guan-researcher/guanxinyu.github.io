# VLA Early Exit authentic figure extraction

## Verified source

- Source PDF: `/Users/stephen/Downloads/1.pdf`
- SHA-256: `a2f8ebbd254a19a4356a5666cdde87723fbd0cd15a5601bf7cb1d2ee00837556`
- Verified title on the first page: **How Deep Should a VLA Think When Thinking Costs Time? Budget-Constrained RL for Early Exit**
- Page count: 21
- Source page header: Under review as a conference paper at ICLR 2027
- Source PDF was not modified. The SHA-256 was checked before and after extraction and remained identical.

## Selected figure

- Figure identification: **Figure 1: Method.**
- PDF page number: **2** (1-based; PyMuPDF index 1).
- All three original panels are retained: (a) Latency-coupled control loop; (b) One policy for when and how deep; (c) Training under a latency budget.
- Original in-figure labels, formulas, arrows, colors, and panel borders are preserved. Surrounding page header, review line numbers, figure caption, and body text are excluded.
- This is an authentic raster extraction of the paper's vector figure, not an AI-generated concept cover or a redrawn diagram.

Caption identification, transcribed from the selected page (PDF math normalized for plain text):

> Figure 1: Method. (a) The frozen VLA (OpenVLA-OFT) runs in a simulator that keeps running while it infers: an inference exiting at rung k_t burns round(ell(k_t)/Delta t) control steps, and between inferences the robot executes the current plan. (b) The general scheduler decides when to infer and at which exit; we learn the exit decision - at each exit an inference reaches, act on it or continue - and fix the chunk at 8 actions, since a learned refresh decision reduced to it (Section 6.3). (c) It is trained by PPO under a constraint on the inference share, with the multiplier held to the share of the greedy policy that is deployed.

## Extraction geometry and output

- Source page dimensions: 612 x 792 PDF points.
- Crop bounding box: **(108, 78, 504, 276)** PDF points, in PyMuPDF's top-left-origin coordinates `(x0, y0, x1, y1)`.
- Crop dimensions: 396 x 198 PDF points.
- Rendering: PyMuPDF `Page.get_pixmap`, matrix scale 4 x 4 (equivalent to 288 dpi), RGB colorspace, no alpha.
- Final asset: `/private/tmp/guanxinyu-editorial-20261008.sFsPZ7/images/paper-vla-early-exit.png`
- Raster dimensions: **1584 x 792 pixels**, RGB PNG.
- Asset SHA-256: `84a1555ca711a5af9a43a569da9733866ad19e2b83f3067dd6c03cfaa16d860c`
- Reproducible helper: `/private/tmp/guanxinyu-editorial-20261008.sFsPZ7/scripts/extract-vla-figure.py`

## Visual verification

The complete source page was rendered with Poppler at 180 dpi and visually inspected. The final cropped PNG was then inspected separately. All three panels and their boundaries are visible, with no clipping of figure content and no surrounding caption, line numbers, or body text included. The natural 2:1 figure aspect ratio was preserved; no stretching or artificial padding was applied. No extraction defects were observed.
