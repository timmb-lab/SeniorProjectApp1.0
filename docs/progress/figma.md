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
