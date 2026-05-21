# Figma Progress

Last refreshed: 2026-05-20

Figma remains a product-design source for route, state, data, and permission handoffs. It is not an automation source of truth and it does not define project automation cadence.

## Active Product File

- Active Figma file: `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`
- File key: `z4t4tFPAKrMDh6pIYOeEw6`
- Team id: `1638213362346160913`
- Key implementation nodes: `18:2`, `31:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, `69:2`, `78:2`, full MVP alpha prototype page `98:2`, production boundary node `124:2`, workspace account edge-state node `133:2`, and presentation dashboard state node `139:2`.

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

## 2026-05-20 12:35 PT - MVP-028 Full Alpha Handoff Consumption Update

- `automation ID`: `senior-capstone-figma-product-builder`
- `selected requirement IDs`: `MVP-028`, supporting `MVP-015`, `MVP-016`, `MVP-017`, and `MVP-018`
- `selected slice`: Update and verify the full MVP alpha prototype route/implementation handoff after rebuild consumed review history in the primary alpha console.
- `active file`: `z4t4tFPAKrMDh6pIYOeEw6`
- `page`: `05 Full MVP Alpha Prototype`
- `nodes touched`: `98:17` (`Prototype / 14 / Route and implementation handoff`); text nodes `98:1079`, `98:1087`, `98:1088`, `98:1073`, `98:1074`, `98:1119`, and `98:1123` through `98:1127`.
- `changed in Figma`: Added `review_history_consumed_at` to the records row, clarified that review history is consumed in the primary alpha console, redirected the next rebuild focus to mentor/presentation/admin depth, preserved the API/D1/audit/storage-redaction permission boundary, and fixed compact handoff text widths.
- `verification`: `use_figma` returned the mutated node IDs, set shared plugin data key `senior_capstone/handoff_status_2026_05_20`, and found zero suspicious clipped text nodes; `get_design_context` confirmed the updated route/data/permission handoff text; `get_screenshot` succeeded for node `98:17` at `1024x648` from original `1360x860`.
- `implementation handoff`: Rebuild should stop repeating review-history UI work unless hosted smoke finds a regression; next implementation depth should target mentor/presentation and admin operations flows using nodes `78:2`, `48:2`, `69:2`, and `98:17`.
- `self-improvement`: none

## 2026-05-20 16:41 PT - MVP-028 Production App/Public Guide Boundary Handoff

- `automation ID`: `senior-capstone-figma-product-builder`
- `selected requirement IDs`: `MVP-028`, supporting `MVP-031` through `MVP-040`
- `selected slice`: Create and verify a production-boundary handoff that distinguishes public Student/Teacher guide mode from the authenticated role-aware workspace route.
- `active file`: `z4t4tFPAKrMDh6pIYOeEw6`
- `page`: `05 Full MVP Alpha Prototype`
- `nodes touched`: `124:2` (`Prototype / 15 / Production app and public guide boundary`)
- `changed in Figma`: Added public guide annotations for `/` and generated `public-companion/`; added authenticated workspace annotations for `/workspace`, `/workspace.html`, `/api/auth/me`, `/api/student/dashboard`, `/api/submissions/:id/evidence`, and `/api/submissions/:id/evidence/upload`; mapped role states for signed-out, student, mentor, program teacher, admin, misc admin, no-role pending, permission denied, Drive-missing, and unsupported upload; recorded current Drive/Cloudflare setup blockers without treating them as Figma blockers.
- `verification`: `use_figma` created node `124:2`, then corrected collapsed text heights and acceptance-card bullet overflow; final readback found zero suspicious clipped text nodes, zero child overflow, 7 contract routes, 9 records, 6 permission scopes, 6 guardrails, and 3 blocker notes. `get_design_context` and `get_screenshot` succeeded for node `124:2`; final screenshot returned `800x1024` from original `1360x1742`.
- `implementation handoff`: Rebuild should consume node `124:2` before adding browser-visible role-pending and permission-denied workspace states; public guide mode stays public content organization, while workspace state stays behind session, D1 role/scope, API checks, evidence redaction, and audit logging.
- `self-improvement`: none

## 2026-05-20 17:37 PT - MVP-028 Workspace Account Edge-State Handoff

- `automation ID`: `senior-capstone-figma-product-builder`
- `selected requirement IDs`: `MVP-028`, supporting `MVP-004`, `MVP-032`, `MVP-033`, `MVP-034`, and `MVP-039`
- `selected slice`: Create and verify a workspace account edge-state handoff for disabled, reset-required, no-assignment, session-expired, role-pending, and section-level permission-denied UI behavior.
- `active file`: `z4t4tFPAKrMDh6pIYOeEw6`
- `page`: `05 Full MVP Alpha Prototype`
- `nodes touched`: `133:2` (`Prototype / 16 / Workspace account edge-state handoff`)
- `changed in Figma`: Added state cards for `session_expired`, `account_disabled`, `reset_required`, `role_pending`, `no_active_assignment`, and `section_permission_denied`; added route/record/audit annotations for `/workspace`, auth/session APIs, role dashboard APIs, `User`, `UserCredential`, `Session`, `UserRole`, `MentorAssignment`, `StaffProgramAssignment`, and `AuditEvent`; stored shared plugin data key `senior_capstone/workspace_account_edge_contract_2026_05_20`.
- `verification`: First readback found zero-width text and an oversized `41066px` auto-layout height; a follow-up layout correction fixed text widths and reduced the frame to `1360x1568`. Final readback found 58 text nodes, zero suspicious clipped text nodes, zero child overflow, 6 states, 9 routes, 9 records, and 6 guardrails. `get_design_context` and `get_screenshot` succeeded for node `133:2`; screenshot returned `889x1024` from original `1360x1568`.
- `implementation handoff`: Rebuild should consume node `133:2` when adding disabled/reset-required/no-assignment/session-expired workspace UI proof and browser smoke coverage through fake `.test` accounts only. Role-pending and source-level permission-denied are already proven but should remain covered.
- `self-improvement`: none

## 2026-05-20 18:33 PT - MVP-028 Presentation Dashboard State Handoff

- `automation ID`: `senior-capstone-figma-product-builder`
- `selected requirement IDs`: `MVP-028`, supporting `MVP-017`, `MVP-020`, `MVP-021`, `MVP-032`, and `MVP-033`
- `selected slice`: Create and verify a dashboard-facing presentation state handoff after rebuild implemented presentation slot scheduling plus check-out/check-in endpoints.
- `active file`: `z4t4tFPAKrMDh6pIYOeEw6`
- `page`: `05 Full MVP Alpha Prototype`
- `nodes touched`: `139:2` (`Prototype / 17 / Presentation dashboard state handoff`)
- `changed in Figma`: Added dashboard-state annotations for student own slot, mentor assigned risk, teacher day-of queue, admin conflict review, permission-denied action, and empty/loading presentation surfaces; mapped routes `/student/presentation`, `/mentor/assigned`, `/teacher/dashboard`, `/api/presentation-slots`, `/api/presentation-slots/:id/check-out`, `/api/presentation-slots/:id/check-in`, and `/admin/audit`; mapped records `PresentationSlot`, `MeetingAttendance`, `MentorAssignment`, `StaffProgramAssignment`, `Review`, `Submission`, `StudentProfile`, and `AuditEvent`; stored shared plugin data key `senior_capstone/presentation_dashboard_state_contract_2026_05_20`.
- `verification`: First `use_figma` attempt failed atomically on an invalid `HUG` sizing assignment before any changes. Corrected write created node `139:2`; visual QA then found compact action labels squeezed too narrowly, and a layout correction converted those rows to stacked content. Final readback found zero suspicious clipped text nodes and zero child overflow. `get_design_context` and `get_screenshot` succeeded for node `139:2`; screenshot returned `717x1024` from original `1360x1943`.
- `implementation handoff`: Rebuild should consume node `139:2` when surfacing presentation slot, conflict, check-out, check-in, denied-action, empty, and loading states in canonical student, mentor, teacher, and admin dashboards from persisted `PresentationSlot` and `AuditEvent` rows.
- `self-improvement`: none
