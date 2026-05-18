# Automation Handoff Ledger

This file tracks cross-lane asks that should survive for future automation runs. Lane logs can contain narrative, but this ledger is the actionable queue.

Status values:

- `open`
- `in-progress`
- `blocked`
- `resolved`

## Open Handoffs

### H-2026-05-18-001

- `source lane`: canva
- `owner lane`: canva
- `status`: open
- `source`: captured Canva memory from prior run
- `artifact`: Canva asset `DAHJ-v7TOM8` in folder `FAHJ-n-VqFE`
- `next action`: Create or specify the proposal dashboard empty-state family: no proposals yet, filtered out, waiting on review, and revision requested.
- `acceptance check`: Asset/spec includes placement, dimensions, alt text, live-text guidance, privacy notes, and handoff for Figma/rebuild.
- `evidence to close`: Canva link/ID or committed asset spec entry plus lane progress entry.
- `last updated`: 2026-05-18

### H-2026-05-18-002

- `source lane`: audit
- `owner lane`: rebuild
- `status`: open
- `source`: security/app-readiness discussion
- `artifact`: `SC-001` and `SC-003`
- `next action`: Document the Cloudflare-compatible stack decision and begin the real app scaffold with auth/database/user-group/progress/private evidence storage assumptions explicit.
- `acceptance check`: ADR names app framework, auth provider, database, storage, GitHub-to-Cloudflare deployment target, environment variables, local development path, backup/export posture, and security tradeoffs.
- `evidence to close`: Committed ADR plus follow-up scaffold or backlog update.
- `last updated`: 2026-05-18

### H-2026-05-18-004

- `source lane`: canva
- `owner lane`: canva
- `status`: open
- `source`: manual Canva first-pass kickoff
- `artifact`: Canva folder `FAHJ-8DxQyk`, specs `docs/visual-assets/canva-first-pass.md` and `docs/visual-assets/canva-asset-specs.md`
- `next action`: Refine the proposal dashboard empty-state family using the new workflow infographic and visual-system report.
- `acceptance check`: Empty-state family includes no proposals yet, filtered out, waiting on review, and revision requested states with app placement, dimensions, alt text, privacy notes, and live-text guidance.
- `evidence to close`: Canva design IDs or committed specs for the empty-state family plus lane progress entry.
- `last updated`: 2026-05-18

### H-2026-05-18-005

- `source lane`: figma
- `owner lane`: rebuild
- `status`: open
- `source`: regenerated Figma product UI system
- `artifact`: active Figma file `LLucMgAPscRa9020iHHigB`, spec `docs/design/figma-first-pass-product-system.md`
- `next action`: After the Cloudflare stack/scaffold decision, map the active Figma screens to app routes/components/data fields for the revised MVP admin/progress slice and the proposal workflow slice.
- `acceptance check`: Rebuild plan or implementation references the active Figma frame IDs for student home, guided proposal form, evidence/review states, teacher review queue, mentor/admin dashboards, mobile student home, and any new admin account/group/progress screens Figma adds.
- `evidence to close`: Committed implementation plan or code scaffold consuming the active Figma file and naming routes/components/data fields.
- `last updated`: 2026-05-18

### H-2026-05-18-006

- `source lane`: ops
- `owner lane`: rebuild
- `status`: open
- `source`: automation operating-infrastructure pass plus revised MVP direction
- `artifact`: `SC-005`, `HD-2026-05-18-001`, `docs/architecture/adr-0001-stack-auth-database-upload.md`
- `next action`: Resolve the Cloudflare production stack/auth/database/user-group/progress/private-upload decision before broad feature work.
- `acceptance check`: Rebuild commits an accepted or superseding ADR naming app framework, auth provider, database, user/group model, progress model, private upload storage, ORM/migrations approach, GitHub-to-Cloudflare deployment path, environment/secrets path, local development setup, tests, backup/export posture, and security tradeoffs.
- `evidence to close`: Committed ADR with status accepted or superseded, plus either scaffold work or a precisely blocked provisioning note.
- `last updated`: 2026-05-18

## Resolved Handoffs

### H-2026-05-18-003

- `source lane`: figma
- `owner lane`: figma
- `status`: resolved
- `source`: manual Figma first-pass kickoff
- `artifact`: superseded Figma file `fkfNI9JNy0A3Rm8KnoxJLj`, active Figma file `LLucMgAPscRa9020iHHigB`, spec `docs/design/figma-first-pass-product-system.md`
- `next action`: Build the three-page Figma file when MCP quota allows: `00 Master Plan + Foundations`, `01 Components + App Screens`, `02 Automation Handoff`.
- `acceptance check`: Figma progress log includes page/frame IDs plus metadata or screenshot verification.
- `evidence to close`: `docs/progress/figma.md` records active file `LLucMgAPscRa9020iHHigB`, all three pages, key frame IDs, 9 components, metadata verification, and screenshot verification.
- `last updated`: 2026-05-18
