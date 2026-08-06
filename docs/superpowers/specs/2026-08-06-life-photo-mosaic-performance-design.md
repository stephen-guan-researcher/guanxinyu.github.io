# Life Photo Mosaic and Performance Design

## Goal

Add the three supplied photographs at the beginning of Life Photos, present all photographs as one visually continuous collage, and reduce mobile transfer and rendering cost without changing the homepage, Agent, publication, or resume content.

## Selected direction

Use a deterministic CSS Grid mosaic. The new road photograph is the lead landscape tile. The new camera and aquarium photographs form a stacked portrait pair beside it on desktop and sit side by side below it on mobile. The remaining photographs preserve their existing relative order and fill a dense, low-gap grid.

This was selected over CSS columns because columns make reading order and responsive placement less predictable, and over a JavaScript justified-row layout because JavaScript adds layout work and cumulative-layout-shift risk.

## Layout contract

- The gallery is a single clipped surface with one outer radius and a 4 px desktop gap / 3 px compact gap.
- Individual photographs have no border, card radius, shadow, caption, or padding.
- Desktop uses a 12-column grid with a 96 px base row. The opening road image spans eight columns and six rows; each opening portrait spans four columns and three rows.
- The remaining images use explicit landscape, portrait, and soft-portrait span classes so the grid stays intentional and stable.
- At widths up to 600 px, the grid uses two columns. The road image spans both columns, the two new portraits occupy one column each, and later landscape or featured images can span both columns.
- Every tile has a fixed grid span before its image loads, so the collage does not jump as assets arrive.

## Image and loading contract

- Import sanitized JPEG fallbacks named `life-road-red-shirt.jpg`, `life-camera-portrait.jpg`, and `life-jellyfish-aquarium.jpg`.
- Re-encode every Life Photo into WebP tiers at 320, 640, 960, 1280, and source width where applicable, using quality 76 and method 6.
- The lead road image is the only gallery image with `fetchpriority="high"` and no lazy-loading attribute.
- All other gallery images use `loading="lazy"` and `decoding="async"`.
- Each `picture` exposes accurate `srcset` candidates and a tile-aware `sizes` value so phones choose 320 px for half-width portraits and no more than 640 px for ordinary compact tiles.
- Offscreen tiles may use `content-visibility: auto` with a fixed intrinsic size, but the first three tiles must render normally.
- JPEG fallbacks must contain no EXIF, GPS, XMP, Photoshop, or comment metadata.

## Accessibility and content

- Keep meaningful English `alt` text for every image.
- Preserve the existing 15-photo relative order after the three new photographs.
- Preserve `coastal-temple.jpg` as the final photograph.
- Do not change navigation, contact details, profile wording, publication content, Agent behavior, or Worker code.

## Verification

- Contract tests assert 18 photographs, exact first-three order, retained previous order, one prioritized gallery image, 17 lazy images, responsive WebP candidates, metadata-free fallbacks, and continuous-grid CSS.
- Automated browser QA covers 390 px, 800 px, and 1440 px widths, checks no horizontal overflow, validates first-three geometry, records resource sizes, and captures screenshots.
- The full Node and Python suites, JavaScript syntax checks, and `git diff --check` must pass before publishing.
- After pushing to `main`, verify `https://guanxinyu.blog/life.html` with a cache-busting query and confirm the three new images and release stylesheet are live.

