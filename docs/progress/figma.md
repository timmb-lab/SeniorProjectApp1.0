# Figma Progress

Last refreshed: 2026-05-20

Figma remains a product-design source for route, state, data, and permission handoffs. It is not an automation source of truth and it does not define project automation cadence.

## Active Product File

- Active Figma file: `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`
- File key: `z4t4tFPAKrMDh6pIYOeEw6`
- Team id: `1638213362346160913`
- Key implementation nodes: `18:2`, `31:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, `69:2`, `78:2`, and full MVP alpha prototype page `98:2`.

## Current Guidance

- Use Figma to clarify route/data/permission questions that block implementation.
- Do not let Figma become the production account system, database, evidence store, audit log, or dashboard source of truth.
- Do not spend broad passes on visual polish while Day 7 alpha still needs workflow endpoints, permission tests, Drive evidence implementation, account lifecycle work, and deployment verification.

## Current Automation Contract

Figma work is owned by `senior-capstone-figma-product-builder`, running hourly at minute 30 PT. It must stay Figma-only and produce route/data/permission handoffs, functional state variants, screenshot/metadata verification, or exact Figma blockers. The non-Figma builder may consume existing Figma evidence but must not call Figma tools.

## 2026-05-20 11:35 PT - MVP-028 Review History Prototype Alignment

- `automation ID`: `senior-capstone-figma-product-builder`
- `selected requirement IDs`: `MVP-028`, supporting `MVP-015` and `MVP-016`
- `selected slice`: Align and verify full MVP alpha prototype review-history annotations after rebuild added persisted comments and immutable submission versions.
- `active file`: `z4t4tFPAKrMDh6pIYOeEw6`
- `page`: `05 Full MVP Alpha Prototype`
- `nodes touched`: `98:9` (`Prototype / 06 / Review detail and decision drawer`) and `98:10` (`Prototype / 07 / Student revision loop`)
- `changed in Figma`: Updated route/data/permission annotation text to name `/api/reviews/:submissionId/history`, `reviews`, `comments`, `status_history`, `submission_versions`, redacted storage IDs, and scoped student/reviewer permissions; corrected sidebar/header text widths in both frames.
- `verification`: `use_figma` returned mutated nodes `98:533`, `98:534`, `98:535`, `98:520`, `98:521`, `98:539`, `98:550`, `98:602`, `98:603`, `98:604`, `98:589`, `98:590`, `98:608`, and `98:611`; readback found zero suspicious clipped text nodes in both frames. `get_design_context` and `get_screenshot` succeeded for nodes `98:9` and `98:10`.
- `implementation handoff`: Rebuild should treat node `98:9` as the teacher review/detail handoff and node `98:10` as the student revision/history handoff when carrying the account smoke review-history UI into the main alpha workflow.
- `self-improvement`: none
