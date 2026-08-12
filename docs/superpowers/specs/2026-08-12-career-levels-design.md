# Career Levels Design

## Goal

Add the verified internal career levels to the Work Experience role lines while preserving the existing clean layout and keeping Xinyu Agent consistent with the homepage.

## Visible copy

- Alibaba: `AI Agent Researcher · P6`
- Baidu: `Senior Research Scientist · T4+`
- Tencent Hunyuan Text-to-Text Pipeline Team: `Research Scientist · T5`
- Tencent Hunyuan Strategy Group 4: `Research Scientist · T5`

The company and team headings, employment dates, summaries, metrics, profile card, news timeline, and all other appointments remain unchanged. The levels are plain text within the existing `.career-role` line; no new badge, color, or layout component is introduced.

## Agent consistency

The verified profile context supplied to Workers AI will state Alibaba P6, Baidu T4+, and Tencent T5. The dedicated Tencent career-date context will also retain T5 on both Tencent appointments. The Agent must not infer levels for the Chinese Academy of Sciences or Mico World roles.

## Verification

- A site-contract test must require the four exact role-and-level strings in their corresponding experience cards.
- A Worker test must require the three verified level facts and both Tencent T5 subperiods in the model context.
- Existing static-site, Worker, and image tests must continue to pass.
- Desktop and mobile previews must show the longer role lines without overflow or layout regressions.

## Publishing boundary

This change is prepared from the current production `main` branch in an isolated worktree. Publishing is a separate step and requires an explicit release request after preview verification.
