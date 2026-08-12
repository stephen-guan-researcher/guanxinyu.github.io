# Alibaba Agent Experience Metrics Design

## Goal

Rewrite the Alibaba appointment as two concise, professional, evidence-grounded workstreams while keeping the existing homepage layout unchanged.

## Approved content structure

1. **General AutoResearch**
   - Describe the re-architected Agent runtime for long-horizon research and optimization.
   - Name the core capabilities: bounded loop control, stalled-branch rerouting, evidence-driven hypothesis generation, hierarchical memory, resumable execution traces, bad-case diagnosis, candidate validation, and autonomous prompt or policy iteration.
   - State the user-confirmed operational result separately: end-to-end prompt optimization and migration validation across 19 business tasks without manual intervention.
   - State the controlled technology-selection result separately: 4 Agent runtimes, 4 model configurations, 8 of 9 controlled image-QC tasks meeting target, and 279 migration tests passed.

2. **Xianyu Multimodal Quality Inspection**
   - Name the three inspection categories: viewpoint compliance detection, base photo-quality checks, and visible physical-defect detection.
   - State the audited nine-category acceptance snapshot separately: 80 inspection checks at 97.54% mean Macro-F1.
   - State the user-confirmed current business scale separately: support for 30+ product categories at approximately 30K orders per day.

## Public-claim boundaries

- The 19-task result means automated prompt optimization and migration validation; it does not claim unattended production deployment.
- The 8-of-9 result belongs only to controlled image-QC tasks in the technology-selection evaluation; it is not a general Agent success rate.
- Say “279 migration tests passed,” never “all tests passed.”
- The 97.54% mean Macro-F1 belongs to the nine-category, 80-check acceptance snapshot; do not attribute it to all 30+ categories.
- Use “supports 30+ product categories at approximately 30K orders per day”; do not present an exact throughput or SLA.
- Do not disclose internal runtime names, model names, category names, or private business data.

## Surfaces

- Update the Alibaba card in `index.html` without changing its layout.
- Synchronize the same verified facts into `worker/src/index.mjs` so Xinyu Agent answers consistently.
- Add static-site and Worker contract tests for the two workstreams and all claim boundaries.
- Bump the public cache-busting release token to `20260812-autoresearch-xianyu-1` in `index.html` and `life.html` for the production release.
