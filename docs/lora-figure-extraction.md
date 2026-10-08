# LoRA attribution authentic figure extraction

This asset is the complete authentic Figure 1(a) method-and-comparison subfigure rendered directly from the supplied paper PDF. It is not an AI-generated concept cover or a redrawn scientific figure. The whole source subfigure is selected for thumbnail readability; no result plot is partially cropped or selectively edited.

## Source identification

- Source PDF: `/Users/stephen/Downloads/2.pdf`
- PDF SHA-256: `d00554b656061877f90d4816315dca78be3047638b04ec5eb449dc585b798258`
- Verified title on page 1: **Static Gradient Attribution Underperforms a Density-Matched Random Mask on Loss-Based Forgetting Within LoRA’s B-Matrix**
- Verified page count: 24.
- Source page size: 612 x 792 PDF points, rotation 0.
- The source PDF was read only. Its SHA-256 was rechecked after extraction and remained unchanged.
- The homepage currently uses a shorter earlier title. This extraction task does not change the homepage title or manuscript metadata.

## Selected figure and crop

- Selected subfigure: **Figure 1(a): Method and comparison.** The parent figure is **Figure 1: The density-matched comparison.**
- Source page: **2** (1-based; PyMuPDF page index 1).
- Retained content: The complete Figure 1(a) parameter-pool, selection-rule, compared-arms, train-and-evaluate, and outcome diagram. All five columns, their bottom labels, arrows, original text, and the outcome-column statement are retained without retouching.
- Excluded content: The `(a) Method and comparison.` subcaption and all of Figure 1(b), including its plots, axes, legend, annotations, and `(b) Key effect (D1, seven seeds).` subcaption. Figure 1(b) is excluded as a whole, not selectively cropped within a result plot.
- Caption identification: The source caption states that both arms draw 10% of the rank-16 LoRA B pool, train the same 1.6M parameters, and differ in coordinate selection; its second panel describes the matched-density loss-based BWT comparison across seven seeds.
- Caption text block bbox: `(108.0, 406.478424, 504.003326, 460.787079)` PDF points. The main `Figure 1:` caption is excluded from the asset. The Figure 1(a) subcaption occupies `(255.201004, 273.870972, 356.799286, 282.837372)` and is also excluded.
- Extraction bbox: **`(136.0, 84.0, 472.0, 266.0)`** PDF points, using PyMuPDF's top-left origin in the unrotated page coordinate system.
- The crop also excludes the paper's running header, review line numbers, body text, and page footer. It preserves the complete selected method subfigure's natural layout and colors without relabeling or adding content.

## Output and reproducibility

- Final asset: `/private/tmp/guanxinyu-editorial-20261008.sFsPZ7/images/paper-lora-attribution.png`
- Site-relative asset: `images/paper-lora-attribution.png`
- Raster dimensions: **1344 x 728 pixels**, natural aspect ratio approximately **1.846:1**.
- Format and colorspace: **PNG, RGB, no alpha**.
- Render scale: **4 pixels per PDF point** (288 DPI equivalent), rendered directly from the PDF's vector content with PyMuPDF 1.27.2.3 / MuPDF 1.27.2.
- Asset size: 178361 bytes.
- Asset SHA-256: `2d94f60761931bb23283cf4557df988b355ab186e029daceac59ccdb53e5eab1`
- Reproduction helper: `scripts/extract-lora-figure.py`. The helper verifies the source hash, title, page count, Figure 1 caption, and all five method-column headings before writing the RGB PNG. It also checks that captions, the result panel, and the running header are absent from the crop's text.

Run from the workspace root:

```sh
/Users/stephen/miniforge3/bin/python3 scripts/extract-lora-figure.py
```

## Verification

The complete first and second PDF pages were rendered and visually inspected to verify the title, figure identity, and crop boundaries. Following a thumbnail-readability review, the selected asset was revised from the full two-panel Figure 1 to the complete Figure 1(a) subfigure. The revised final PNG was visually inspected at full resolution and checked with Pillow for PNG format, RGB mode, and the exact 1344 x 728 dimensions. Every one of the five method columns and their bottom labels remains intact. No subcaption, result panel, body text, main caption, or review line numbers remain in the crop.

The bundled Poppler renderer encountered a fontconfig cache/configuration loop on the first page and was terminated. PyMuPDF rendered both review pages and the final asset successfully; this renderer issue does not affect the delivered image. No source PDF, HTML, CSS, tests, or shared documentation was modified by the extraction helper.
