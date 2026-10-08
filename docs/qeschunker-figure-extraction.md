# QESChunker original figure extraction

This asset is a direct raster extraction of the authentic Figure 1 from the supplied publication PDF. It is not an AI-generated concept cover or a reconstructed diagram. No AI generation, redrawing, recoloring, or content retouching was used.

## Source verification

- Source PDF: `/Users/stephen/Downloads/3.pdf`
- PDF SHA256: `7a9df4b23cf5d6b0bf5a9583255de21433a9650c78f78eae52e1d00f25c34e7a`
- Verified title on PDF page 1: QESChunker: A Single Objective Unifies Overlapping and Non-Overlapping Chunking for RAG.
- PDF page count: 16.
- Source status visible in the PDF: under review as a conference paper at ICLR 2027; anonymous authors. Extraction does not imply acceptance or publication status beyond the supplied PDF.

## Figure identification

- Figure: Figure 1, method overview.
- PDF page: 2, using one-based page numbering.
- Caption identification: "Figure 1: Overview of QESChunker. A shared question-evidence objective supports exact dynamic programming for non-overlapping partitions and benefit-cost greedy selection for overlapping indices." The caption is recorded here for identification and is excluded from the image.
- Retained content: the complete non-overlap panel, dynamic programming table and path, unified objective block, overlap panel, candidate and selected markers, arrows, formulas, and all figure-internal labels.
- Excluded content: caption, surrounding body text, review line numbers, running header, and page number.

## Extraction parameters

- PDF page dimensions: 612 x 792 points.
- PDF crop bounding box: `[148.0, 85.0, 471.0, 223.0]` points, ordered `[x0, y0, x1, y1]` in PyMuPDF's unrotated page coordinate system with origin at the top left.
- Crop dimensions: 323 x 138 PDF points, including a small white margin around the complete figure.
- Renderer: PyMuPDF `Page.get_pixmap`, `Matrix(6, 6)`, `clip=Rect(148, 85, 471, 223)`, `colorspace=fitz.csRGB`, `alpha=False`.
- Render scale: 6 pixels per PDF point, equivalent to 432 dpi. The source figure is vector/text content; no low-resolution embedded bitmap was upscaled.
- Final asset: `/private/tmp/guanxinyu-editorial-20261008.sFsPZ7/images/paper-qeschunker-overview.png`
- Final asset SHA256: `2105ea36c749624b4de70e7d09d3a7063c814755d51059de0f52c2a8b5f7ea85`
- Raster dimensions: 1938 x 828 pixels.
- Format: RGB PNG, three color channels, no alpha channel.

## Visual verification

The complete source page was rendered with Poppler at 150 dpi and inspected to locate Figure 1 and the caption boundary. The final clipped RGB raster was then inspected at full rendered size. All three figure sections, formulas, arrows, internal labels, and boundaries remain present and unclipped. No caption, review line number, or body text is visible in the final asset. The original source PDF was not modified. No extraction issues were observed. The native wide aspect ratio was preserved rather than forcing a 3:2 crop.
