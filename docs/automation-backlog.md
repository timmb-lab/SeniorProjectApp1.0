# Automation Backlog

This file tracks unresolved cross-category issues for the Senior Capstone rebuild. Ordinary backlog hygiene is owned by the 30-minute MVP builder, while the weekly strategy review may reprioritize backlog items from seven-day evidence.

Active automation ownership is tracked in `docs/automation-cadence.md`. The `owner` values in backlog items remain functional product groupings; they are not separate project automations.

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
- `status`: in-progress
- `source`: Cycle linked document, senior guide, and mentor teacher guide PDFs
- `affected area`: private evidence/upload/link model
- `evidence`: Source workflow repeatedly asks students to link documents, slides, photos, letters, reflections, and final products. Figma now has a private evidence/review-history implementation contract in active file `z4t4tFPAKrMDh6pIYOeEw6`, node `37:2`, shared `EvidenceArtifactRow` component variants in node `43:2` / component set `43:149`, and mobile student evidence/revision contract node `56:2`, with upload/link states, permission matrix, review history, mobile blocked-submit/access-denied states, and audit guardrails. Migration `migrations/0001_foundation.sql` now creates `evidence_repositories` and `evidence_artifacts`; D1 has the default Google Drive repository row pointing to root folder `1XPgYKbIMqv332DAJZJNJetHppFB670e7` and index sheet `1b446rp3oyx9G4LpKYE47qXxpU41EOW-2Ota2fGum49c`; `/api/evidence/repository` is authenticated and audited. Actual Drive upload credentials, artifact access tests, and file-byte upload flow are still missing.
- `next action`: Add the server-side Drive upload credential/OAuth path, signed URL or access-controlled retrieval path, immutable review history linkage, unauthorized access audit events, and permission tests for student-own, mentor-assigned, program-teacher, admin, misc-admin, and unauthorized evidence access before any dashboard relies on submission counts.
- `last updated`: 2026-05-18 11:32 PT

### SC-004

- `severity`: P1
- `owner`: rebuild
- `status`: open
- `source`: Senior guide and mentor teacher guide PDFs
- `affected area`: mentor meetings, presentation scheduling, celebration evidence, and archive/export
- `evidence`: The PDFs require mentor meeting attendance/make-up tracking, outline approval, presentation time scheduling, presentation check-out/check-in, celebration setup photo, ingredient lists for food, and May 5 personal archive/export. Figma now specifies archive/export controls in active file `z4t4tFPAKrMDh6pIYOeEw6`, node `69:2`, and meeting/presentation scheduling in node `78:2`, including prep evidence, attendance capture, make-up linkage, outline approval gates, slot conflicts, audited check-out/check-in, scoped permissions, and route/data contracts. None of the meeting/presentation/celebration/archive workflows are implemented yet.
- `next action`: Create implementation slices after SC-001/SC-003 for `Meeting`, `MeetingAttendance`, `PresentationSlot`, celebration evidence, and archive/export workflow; consume Figma node `78:2` when implementing meeting attendance, outline approval, presentation slots, conflict checks, and audited check-out/check-in, and consume node `69:2` when implementing `StudentArchiveExport`, `ExportRequest`, `ExportArtifact`, signed downloads, and archive/export audit events.
- `last updated`: 2026-05-18 11:18 PT

### SC-005

- `severity`: P0
- `owner`: rebuild
- `status`: in-progress
- `source`: automation self-improvement infrastructure pass and repeated stack-decision risk
- `evidence`: `docs/master-plan.md` now defines the revised MVP as a secure database-backed app with users, groups, roles, progress updates, private evidence, audit logs, dashboards, announcements, exports, and GitHub-to-Cloudflare hosting. `docs/architecture/adr-0001-stack-auth-database-upload.md` is accepted and refined by `D-2026-05-18-019`. Active Figma nodes `18:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, `69:2`, and `78:2` specify route/data/permission contracts for execution map, evidence history, component variants, admin provisioning, mobile revision, progress dashboards, audit logs, exports, mentor meetings, and presentation scheduling. Local scaffold now includes `package.json`, `wrangler.jsonc`, `functions/`, `.dev.vars.example`, and `migrations/0001_foundation.sql`. Cloudflare Pages project `senior-capstone-app` and D1 database `senior-capstone-db` are provisioned; the migration has been applied remotely; Pages preview/production config includes the D1 binding, Google Drive evidence root folder, Google Drive evidence index sheet, and `PASSWORD_PEPPER` / `SESSION_PEPPER` secrets. `alpha.html`, `alpha.js`, `alpha.css`, `/api/alpha/state`, and `functions/_lib/alpha-flow-model.js` now create the Day 7 alpha app flow with D1-backed seeded state, persona switching, student/teacher/mentor/admin/misc-admin views, workflow transitions, audit timeline updates, evidence validation, and no `localStorage` student-record persistence. Alpha state-machine tests, alpha contract checks, CI, the week framework, and preview script now exist. Production deployment verified `/alpha.html`, `/api/alpha/state`, `APP_ENV=production`, first-admin login/session for `bryan.timm89@gmail.com`, and `/api/health` `userCount=5` after fake alpha test accounts were seeded. D1 has the global admin role, four fake `.test` role accounts, test cohort/group/mentor/proposal/progress/submission/evidence fixtures, `bootstrap_admin_created`, and `test_accounts_seeded` audit evidence; production `BOOTSTRAP_SETUP_KEY` has been removed. The admin-only seed endpoint rejects unauthenticated calls with 401 and student calls with 403. Drive upload credentials/OAuth, broader auth/permission tests, account lifecycle, and production meeting/presentation workflow code remain incomplete.
- `next action`: Broaden tests for auth, permission helpers, protected evidence access, status transitions, audit/export controls, meeting attendance, and presentation-slot conflicts; then implement the first admin/progress vertical slice and Drive upload credential/OAuth path while consuming active Figma contracts.
- `last updated`: 2026-05-18 12:45 PT

### SC-006

- `severity`: P0
- `owner`: rebuild
- `status`: in-progress
- `source`: Bryan Day 7 alpha deadline request
- `affected area`: full app-flow alpha without production user accounts
- `evidence`: Bryan needs a full-fledged alpha by Day 7. For planning, Day 1 is Monday, 2026-05-18 and the alpha gate is end of day Sunday, 2026-05-24 PT. Production user accounts may remain incomplete, but the whole app flow must work through seeded/demo personas or a clearly labeled role switcher. The first D1-backed seeded alpha flow is deployed at `alpha.html` with `/api/alpha/state`, covering student proposal/evidence submit, teacher revision/approval, mentor meeting/presentation risk, admin export/deadline notice, misc-admin read-only report, dashboard aggregates, audit/activity, evidence validation, and permission denial. Four fake `.test` role accounts are also login-verified for student, program teacher, mentor, and misc-admin walkthroughs, with credentials stored only in ignored `.secrets/`. `docs/alpha-week-framework.md`, `scripts/check-alpha-contract.mjs`, `scripts/verify-cadence-30min.ps1`, `npm run check`, `npm run deploy:preview`, and `.github/workflows/ci.yml` now define the week plan and alpha/automation verification rail.
- `next action`: Deepen the alpha into real workflow endpoints and add the known-gaps file, broader auth/permission tests, mobile/error/empty QA, and Drive upload credential/OAuth implementation.
- `acceptance check`: A reviewer can run the app and complete student -> teacher review -> revision/resubmission -> approval -> dashboard/audit update without real accounts or code edits, while the UI clearly labels alpha account/security shortcuts and avoids real student data.
- `last updated`: 2026-05-18 12:45 PT
