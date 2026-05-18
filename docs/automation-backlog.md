# Automation Backlog

This file tracks unresolved cross-lane issues for the Senior Capstone rebuild. The content audit automation owns backlog hygiene.

## Status Values

- `open`
- `in-progress`
- `blocked`
- `resolved`

## Severity Values

- `P0`: blocks safe hosted launch or risks student privacy/security/data integrity.
- `P1`: breaks core workflow, role clarity, dashboard trust, or program coverage.
- `P2`: causes confusion, inconsistency, accessibility weakness, or implementation ambiguity.
- `P3`: polish, copy refinement, or future enhancement.

## Items

### SC-001

- `severity`: P1
- `owner`: rebuild
- `status`: open
- `source`: 2026 source-PDF curriculum ingestion
- `affected area`: framework seed loading
- `evidence`: `data/capstone-framework.json` now defines required submissions, due labels, credit owners, review gates, quality checks, staff actions, and dashboard signals, but no app seed loader or schema consumes it yet.
- `next action`: Create the first framework seed loader and minimal tables/types for requirements, sections, quality checks, deadlines, credit owners, and review gates.
- `last updated`: 2026-05-18

### SC-002

- `severity`: P1
- `owner`: figma
- `status`: resolved
- `source`: Research Proposal Challenge PDF
- `affected area`: student proposal/research workflow
- `evidence`: The source assignment is a guided quality engine. The active recreated Figma file `z4t4tFPAKrMDh6pIYOeEw6` now includes guided proposal frame `3:154`, with section-level completeness, revision feedback, attached evidence, submit/resubmit path, and teacher review context. `docs/design/figma-first-pass-product-system.md` records the active file and frame IDs.
- `next action`: Future Figma runs should deepen variants and edge states instead of treating the guided proposal form as missing.
- `last updated`: 2026-05-18

### SC-003

- `severity`: P1
- `owner`: rebuild
- `status`: open
- `source`: Cycle linked document, senior guide, and mentor teacher guide PDFs
- `affected area`: private evidence/upload/link model
- `evidence`: Source workflow repeatedly asks students to link documents, slides, photos, letters, reflections, and final products. Figma now has a private evidence/review-history implementation contract in active file `z4t4tFPAKrMDh6pIYOeEw6`, node `37:2`, with upload/link states, permission matrix, review history, and audit guardrails, but the hosted app has not yet implemented private EvidenceArtifact storage, external-link metadata, access checks, or review status.
- `next action`: Rebuild must implement the private EvidenceArtifact model, upload/link access checks, signed URL expiry, immutable review history, unauthorized access audit events, and permission tests before any dashboard relies on submission counts.
- `last updated`: 2026-05-18 09:41 PT

### SC-004

- `severity`: P1
- `owner`: rebuild
- `status`: open
- `source`: Senior guide and mentor teacher guide PDFs
- `affected area`: mentor meetings, presentation scheduling, celebration evidence, and archive/export
- `evidence`: The PDFs require mentor meeting attendance/make-up tracking, outline approval, presentation time scheduling, presentation check-out/check-in, celebration setup photo, ingredient lists for food, and May 5 personal archive/export, but these are not implemented yet.
- `next action`: Create implementation slices after SC-001/SC-003 for meeting attendance, presentation slots, celebration evidence, and archive/export workflow.
- `last updated`: 2026-05-18

### SC-005

- `severity`: P0
- `owner`: rebuild
- `status`: in-progress
- `source`: automation self-improvement infrastructure pass and repeated stack-decision risk
- `affected area`: Cloudflare production stack, auth, database, user groups, progress updates, private uploads, deployment, secrets, tests, and safe hosted-app foundation
- `evidence`: `docs/master-plan.md` now defines the revised MVP as a secure database-backed app with users, groups, roles, progress updates, private evidence, audit logs, dashboards, announcements, and GitHub-to-Cloudflare hosting. `docs/architecture/adr-0001-stack-auth-database-upload.md` is accepted as the default Cloudflare-compatible stack path. No production app scaffold, managed auth, database, private file storage, migrations, API layer, tests, CI, or GitHub-to-Cloudflare deployment pipeline exists yet.
- `next action`: Rebuild lane must scaffold the selected stack with auth/database/user-group/progress/private-upload/deployment assumptions explicit.
- `last updated`: 2026-05-18
