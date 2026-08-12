# Alibaba Agent Experience Metrics Design

## Goal

Rewrite the Alibaba appointment as two concise, professional, evidence-grounded workstreams while keeping the existing homepage layout unchanged.

## Approved content structure

1. **General-Purpose Agent Runtime / AutoResearch**
   - Describe an evidence-grounded Agent runtime for long-horizon research and engineering workflows.
   - Name the core capabilities: project understanding, modular Skill routing, bad-case-driven iterative optimization, regression testing, resumable experiment traces, and approval-gated migration.
   - Quantify only the controlled evaluation: 4 Agent runtimes, 4 model configurations, 8 of 9 tasks meeting target on a controlled image-QC benchmark, and 279 migration tests passed.

2. **Multimodal Quality Inspection Agent / Xianyu**
   - Describe viewpoint compliance, image quality, and product-condition assessment.
   - State the probation-defense estimate as a modeled unit-cost reduction of 78.8%, from RMB 1.00 to RMB 0.212 per order.
   - State the user-confirmed current business scale as support for 30+ product categories at approximately 30K orders per day.

## Public-claim boundaries

- The 8-of-9 result belongs only to a controlled image-QC benchmark; it is not a general Agent success rate.
- Say “279 migration tests passed,” never “all tests passed.”
- Describe the cost reduction as modeled, not realized savings.
- Use “supports 30+ product categories at approximately 30K orders per day”; do not present an exact throughput or SLA.
- Do not disclose internal runtime names, model names, category names, or private business data.

## Surfaces

- Update the Alibaba card in `index.html` without changing its layout.
- Synchronize the same verified facts into `worker/src/index.mjs` so Xinyu Agent answers consistently.
- Add static-site and Worker contract tests for the two workstreams and all claim boundaries.
- Bump the public cache-busting release token in `index.html` and `life.html` for the production release.
