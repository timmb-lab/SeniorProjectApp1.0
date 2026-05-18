# Senior Capstone Automation Memory

Date initialized: 2026-05-18

This is the compact working memory for the long-running automation loop. Every automation should read this before selecting work and update it only when the current state materially changes.

Top-level product plan: `docs/master-plan.md`.

## Product Target

Build a GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a secure database-backed operating system for users, groups, roles, programs, cohorts, progress updates, private upload/evidence spaces, student submissions, mentor/teacher review, revision requests, approvals, dashboards, announcements, admin controls, audit logs, exports, and protected student records.

Urgent alpha gate: count 2026-05-18 as Day 1; by end of day Sunday, 2026-05-24 PT, Bryan needs a full-fledged alpha where the whole app flow works through seeded/demo personas or a clearly labeled role switcher. Production user accounts may remain incomplete for alpha, but student, teacher, mentor, admin, misc-admin, proposal, evidence metadata, review/revision/approval, dashboard, audit/activity, export/archive, mobile student, error/empty/permission flows should work well enough to walk through.

This is not a static guide, brochure, or visual-only project.

Figma is the heavy product-design source for functional app screens, database-backed states, admin preview, dashboards, and mobile-aware patterns. It can prototype account/data flows and specify fields/states, but it is not the production account system, database, evidence store, audit log, or dashboard source of truth. Canva is the heavy supporting-image source for polished visuals with clear app placement and no baked-in private/live data. Version 2.0 may explore iOS/Android apps with push notifications and announcements, but no student-to-student messaging.

## Current State

- Repository still contains the original static guide shell, now with a first Cloudflare Pages Functions/D1 scaffold added under `functions/`, `migrations/`, `package.json`, `wrangler.jsonc`, and `.dev.vars.example`.
- Cloudflare Pages project `senior-capstone-app` is provisioned against `timmb-lab/SeniorProjectApp1.0`; the public Pages URL is `https://senior-capstone-app.pages.dev`.
- Cloudflare D1 database `senior-capstone-db` (`3141d9ac-08b7-49c1-92ba-bbf50c1a611f`) is provisioned and migration `migrations/0001_foundation.sql` has been applied remotely.
- Hardened username/password auth endpoints now exist for bootstrap, login, logout, and session lookup. `PASSWORD_PEPPER` and `SESSION_PEPPER` are set as Cloudflare Pages secrets; `BOOTSTRAP_SETUP_KEY` and first-admin bootstrap are not complete.
- Google Drive evidence repository index sheet `1b446rp3oyx9G4LpKYE47qXxpU41EOW-2Ota2fGum49c` exists and is wired into Pages config and D1 metadata. The Drive root folder ID and server-side Drive upload credential/OAuth flow remain pending.
- Tests and CI are not implemented yet.
- Source PDFs have been extracted and converted into app-native requirements in `data/capstone-framework.json`.
- The primary beta-build automation is now `senior-capstone-rebuild-rebuilt`, renamed in the app as `Senior Capstone Gold Standard Orchestrator`, running exactly 5x/day at `00:20`, `05:20`, `10:20`, `15:20`, and `20:20` PT. It uses the master plan, logs, and work ladder to choose one bounded beta-advancing slice per run until the app reaches a real beta.
- Specialist lane jobs still exist for Figma, Canva, content audit, and daily report, but they are intentionally `PAUSED` standby prompts so the Senior Capstone system is not running overlapping specialist jobs all day. Weekly deep audit remains `ACTIVE` and separate for long severe review.
- Daily guided prototype refresh automation `senior-capstone-daily-guided-prototype-refresh` is `ACTIVE` at `22:10 PT` and updates the active Figma page `04 Guided Daily Prototype` from that day's progress, blockers, and next ladder step.
- The four main automation lanes and the daily reporting automation now read the shared memory, run log, handoff ledger, and decision log before choosing work or summarizing progress.
- Every main lane prompt now requires a lane log entry, compact run-log entry, relevant memory/handoff/decision updates, verification, commit, and push.
- Every main lane and the daily reporting automation now reference `docs/master-plan.md` along with the logs.
- Daily automation summaries and the Google Drive/Doc target should use `bryan.timm89@gmail.com`.
- Every main lane and the daily reporting automation now use `docs/automation-self-improvement.md` to self-review, log whether prompt/config changes were needed, and update only their own live automation prompt/config when evidence justifies it.
- A weekly deep audit automation, `senior-capstone-weekly-deep-audit-rebuilt`, now runs Sundays at `23:45 PT` to produce a severe whole-system audit and feed durable findings into the master plan, memory, backlog, handoffs, decision log, and run logs without sharing an exact start slot with the 5x/day orchestrator.
- Automation operating infrastructure now includes prompt snapshots in `docs/automation-prompts/`, structured run manifests in `docs/progress/runs/`, human decisions in `docs/human-decisions.md`, external artifact registry in `docs/artifacts.json`, and contract scripts in `scripts/`.
- Rebuild and content audit lane logs now exist at `docs/progress/rebuild.md` and `docs/progress/audit.md`; `scripts/check-automation-contract.ps1` requires both so future automation reviews catch missing lane-log anchors.
- The automation contract now explicitly forbids local-only repo closeout and interactive project-script prompts: live prompts include the publication/script auto-approval hard rule, and `scripts/check-automation-contract.ps1` fails if project scripts use interactive prompt/confirmation patterns.

## Current Priority

The 100-pass master plan was refreshed on 2026-05-18 after the professional-plan Figma catch-up and automation hardening work. Repo state through commit `08660f3` is the baseline, with later Figma admin provisioning contract node `48:2`, mobile evidence/revision contract node `56:2`, progress update/dashboard aggregate contract node `61:2`, and audit log/export controls contract node `69:2`: Figma implementation contracts are now ahead of the hosted app, while the production scaffold/auth/database/storage/test/deployment foundation is still missing.

1. Hit the Day 7 alpha gate by 2026-05-24 PT: full app flow working through seeded/demo personas, without production user accounts blocking progress.
2. Execute accepted `SC-005` / `SC-006` / `HD-2026-05-18-001` / ADR-0001: Cloudflare Workers/Pages + D1 + app-flow alpha + later hardened auth/security assumptions.
3. Scaffold the real app foundation with TypeScript, package scripts, tests, route shell, role/persona switcher, seed/demo data, and GitHub-to-Cloudflare deployment structure.
4. Model users, groups, roles, permissions, programs, cohorts, requirements, progress records, submissions, evidence artifacts, reviews, approvals, announcements, audit events, and export records, consuming Figma node `48:2` for admin provisioning states and scoped misc-admin rules, node `61:2` for progress-update/dashboard-aggregate rules, and node `69:2` for audit-log/export controls.
5. Build the alpha proposal/progress flow: student dashboard -> proposal/research -> evidence metadata/link -> teacher review -> revision/approval -> dashboard/audit update -> mentor/admin/misc-admin views.

Immediate next five useful passes: alpha app shell/role switcher/seed data, student proposal/evidence flow, teacher review/revision loop, mentor/admin/misc-admin dashboard and audit/activity surfaces, then mobile/error-state/alpha runbook/Cloudflare preview proof.

Real daily MVP goal: minimum 2 accepted MVP passes per calendar day, stretch 3 when unblocked, and at least 14 accepted MVP passes per week until the 100-pass target is met or recalibrated. Until the Day 7 alpha is accepted, the first two accepted passes each day should usually be app-flow implementation or alpha verification, not broad design polish or production account hardening. The active weekly deep audit must review the prior seven days of committed run evidence and adjust only this project's next-week daily goal/allocation in `docs/master-plan.md` and this memory file when evidence requires it; schedules, workspace, model, reasoning effort, and status stay unchanged unless Bryan explicitly asks.

Current account/provisioning watchpoint: Cloudflare Pages/D1 setup is done for the first foundation, and district SSO is explicitly unavailable for MVP. Remaining Bryan/config-owned work is the Google Drive evidence root folder ID, `BOOTSTRAP_SETUP_KEY`, first-admin credentials, and any district/privacy approval before real student records are entered.

## Canonical Programs

- IT
- Culinary
- Hospitality & Marketing
- Mechanical Technology
- Construction
- Sports Medicine
- Teaching & Training
- Early Childhood Education
- Medical Professions

## Active Backlog

See `docs/automation-backlog.md`.

Current backlog anchors:

- `SC-001`: framework seed loader and minimal requirement schema.
- `SC-002`: guided Research Proposal Challenge UI and review queue spec.
- `SC-003`: Google Drive EvidenceArtifact model is in-progress; metadata tables exist, but root folder, upload credentials, and permission tests are still needed.
- `SC-004`: mentor meetings, presentation scheduling, celebration evidence, archive/export workflows.
- `SC-005`: P0 Cloudflare stack/auth/database/user-group/progress/private-upload scaffold is in-progress with Pages/D1/migrations/auth endpoints and password/session pepper secrets created; tests, CI, Drive root folder, upload credentials, bootstrap key, and first-admin bootstrap remain.
- `SC-006`: P0 Day 7 full app-flow alpha due 2026-05-24 PT; production user accounts may be incomplete, but every core role/workflow must work through seeded/demo personas.

## Known External Artifact Memory

- Canva folder: `FAHJ-n-VqFE`.
- Canva asset: `DAHJ-v7TOM8`, proposal approval process strip, no-text 1600x500, palette from `styles.css`.
- Next Canva priority: proposal dashboard empty-state family.
- Active Figma product UI file: `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6` (`z4t4tFPAKrMDh6pIYOeEw6`). Created and populated in Bryan's `Senior Project App` Figma team/project, team id `1638213362346160913`, plan key `team::1638213362346160913`.
- Active Figma file contains five pages: `00 Master Plan + Foundations`, `01 Components + App Screens`, `02 Automation Handoff`, `03 Product Preview + State Variants`, and `04 Guided Daily Prototype`. Key frames include foundations board `2:5`, components board `3:2`, student desktop `3:66`, guided proposal `3:154`, teacher queue `3:190`, mentor/admin snapshots `3:246`, mobile student `3:301`, handoff board `5:2`, state variants board `6:2`, review drawer `6:198`, admin override modal `6:219`, rebuild mapping `6:257`, 100-pass MVP execution map `18:2`, admin account/group provisioning contract `48:2`, mobile evidence/revision contract `56:2`, progress dashboard aggregate contract `61:2`, audit log/export controls contract `69:2`, guided prototype start `75:3`, guided prototype progress `75:34`, guided prototype student path `75:65`, guided prototype staff path `75:96`, guided prototype security boundary `75:127`, and guided prototype next ladder `75:158`.
- Professional-plan verification succeeded on 2026-05-18 after Bryan upgraded Figma: metadata and screenshots returned for the active file, and Figma write added `100-Pass MVP Execution Map` node `18:2` with route/data/permission contract for rebuild.
- Figma review/override deepening succeeded on 2026-05-18: active file node `31:2` adds teacher review drawer states, admin override modal states, and developer handoff contract node `31:144` covering `ReviewDecision`, `OverrideRequest`, `AuditEvent`, `Submission`, `EvidenceArtifact`, and `UserGroupRole`.
- Figma private evidence/review-history deepening succeeded on 2026-05-18: active file node `37:2` adds private upload/link states, evidence permission matrix, immutable review history timeline, and developer handoff contract node `37:177` for `SubmissionVersion`, `EvidenceArtifact`, `Review`, `Comment`, `AuditEvent`, and `StudentArchiveExport`.
- Figma shared component deepening succeeded on 2026-05-18: active file node `43:2` adds MVP component variant sets `StatusPill` (`43:55`, 11 variants), `ActionButton` (`43:73`, 7 variants), and `EvidenceArtifactRow` (`43:149`, 8 variants), plus shared UI handoff contract `43:150` for `PermissionGate`, `ReviewHistoryItem`, route/data fields, permission scopes, audit guardrails, and acceptance checks.
- Figma admin provisioning deepening succeeded on 2026-05-18: active file node `48:2` adds eight account/group/role/program/cohort provisioning states, permission matrix, data model matrix, and developer handoff contract `48:208` covering `/admin/users`, `/admin/groups`, `/admin/programs`, `/admin/cohorts`, `/admin/audit`, user import, role assignments, mentor assignments, `User`, `UserRole`, `StudentProfile`, `StaffProfile`, `GroupMembership`, `MentorAssignment`, `Permission`, and `AuditEvent`.
- Figma mobile evidence/revision deepening succeeded on 2026-05-18: active file node `56:2` adds four mobile student states for revision checklist, evidence upload/link, submit blocked, and access recovery, plus developer handoff contract `56:114` covering `/student/evidence`, `/student/submissions/:submissionId/revise`, `/api/submissions/:id/evidence`, `/api/evidence/:id/check-access`, `/api/reviews/:id/history`, `/admin/audit`, `Submission`, `SubmissionVersion`, `EvidenceArtifact`, `Review`, `Comment`, `AuditEvent`, `UserGroupRole`, and mobile overflow/permission/audit acceptance checks.
- Figma progress/dashboard aggregate deepening succeeded on 2026-05-18: active file node `61:2` adds five progress-update/dashboard states, six server transition steps, and developer handoff contract `61:113` covering `/student/progress`, `/api/progress-updates`, `/api/submissions/:id/status`, `/teacher/dashboard`, `/mentor/dashboard`, `/admin/dashboard`, `/admin/audit`, `ProgressUpdate`, `StatusHistory`, `RequirementProgress`, `DashboardAggregate`, `DashboardSnapshot`, `AuditEvent`, role scopes, stale-write conflicts, and server-derived aggregate acceptance checks.
- Figma audit/export controls deepening succeeded on 2026-05-18: active file node `69:2` adds five audit-log/export states, six authorization/export pipeline steps, audit stream and export request panels, and developer handoff contract `69:180` covering `/admin/audit`, `/api/audit-events`, `/api/audit-events/:id`, `/admin/exports`, `/api/exports/student-archive`, `/api/exports/:id/download`, `/student/archive`, `AuditEvent`, `AuditEventView`, `ExportRequest`, `StudentArchiveExport`, `ExportArtifact`, `EvidenceArtifact`, `StudentProfile`, `UserGroupRole`, `RetentionPolicy`, signed-download expiry, redaction, explicit scoped permission, and denied-access audit checks.
- Preferred Figma write target remains Bryan's `Senior Project App` Figma team/project, team id `1638213362346160913`, plan key `team::1638213362346160913`, URL `https://www.figma.com/files/team/1638213362346160913/all-projects?fuid=1601310066605052228`. Future Figma automation should continue active work in file `z4t4tFPAKrMDh6pIYOeEw6`.
- Prior regenerated Figma file for reference only: `https://www.figma.com/design/LLucMgAPscRa9020iHHigB` (`LLucMgAPscRa9020iHHigB`). It was created under the older target `team::1601310068697743794`, which is the team id shown in the previous MCP rate-limit/paywall URL.
- Active Figma repo specs: `docs/design/figma-first-pass-product-system.md` and `docs/design/figma-product-preview-state-variants.md`.
- Superseded Figma historical file: `https://www.figma.com/design/fkfNI9JNy0A3Rm8KnoxJLj` (`fkfNI9JNy0A3Rm8KnoxJLj`). File creation succeeded but canvas write was blocked by the prior Starter MCP tool-call limit.
- Canva first-pass folder: `FAHJ-8DxQyk`, `https://www.canva.com/folder/FAHJ-8DxQyk`.
- Canva first-pass workflow infographic: `DAHJ-3dKnPU`, edit `https://www.canva.com/d/C-dVNnTDKRODcKi`, view `https://www.canva.com/d/tfRo2Sq_1JHu0zu`.
- Canva first-pass visual-system report: `DAHJ-xaMuj8`, edit `https://www.canva.com/d/NXZGwxgXRKYnTPc`, view `https://www.canva.com/d/MA6S4b_xAC69y1C`.
- Canva first-pass program identity poster: `DAHJ-6LVuME`, edit `https://www.canva.com/d/J9nRXQPXi0O-_hM`, view `https://www.canva.com/d/2FoRYnzFDrZAHqc`.
- Cloudflare Pages app: `https://senior-capstone-app.pages.dev`, project `senior-capstone-app`, project id `45041fa7-82ad-489d-a928-962d53c3b95a`.
- Cloudflare D1 database: `senior-capstone-db`, database id `3141d9ac-08b7-49c1-92ba-bbf50c1a611f`, region `WNAM`.
- Google Drive evidence repository index: `https://docs.google.com/spreadsheets/d/1b446rp3oyx9G4LpKYE47qXxpU41EOW-2Ota2fGum49c`, sheets `Evidence Index`, `Folder Policy`, and `Upload Intake Fields`; root folder pending.

## Decisions To Respect

Read `docs/progress/decision-log.md` for accepted or superseded decisions.

- As of this update, the deployment direction and default Cloudflare-compatible stack are accepted under `HD-2026-05-18-001` and ADR-0001: GitHub-connected Cloudflare Workers/Pages, D1-compatible database, R2-compatible private evidence storage, Workers-compatible managed auth or school-approved SSO, server-side authorization, and audit logging.
- `D-2026-05-18-001`: automations use the log-first scaling protocol.
- `D-2026-05-18-002`: `docs/master-plan.md` is the top-level product plan.
- `D-2026-05-18-003`: daily automation summaries and Google Drive/Doc target account use `bryan.timm89@gmail.com`.
- `D-2026-05-18-004`: automations may improve their own prompt/config from evidence using the guarded self-improvement protocol, while preserving schedule/workspace/model/status unless the user explicitly asks otherwise.
- `D-2026-05-18-005`: run a weekly deep audit automation to perform a long piece-by-piece whole-system review and feed findings back into the master plan and logs.
- `D-2026-05-18-006`: superseded by `D-2026-05-18-009` and `D-2026-05-18-010`; prior regenerated Figma file `LLucMgAPscRa9020iHHigB` is now reference-only rather than the active writable target.
- `D-2026-05-18-007`: automations use prompt snapshots, structured run manifests, human decisions, artifact registry, and a contract checker as core operating infrastructure.
- `D-2026-05-18-008`: MVP 1.0 is a secure database/account/group/progress foundation hosted through GitHub to Cloudflare; Figma and Canva are heavy product/visual inputs; 2.0 may add iOS/Android notifications and announcements, with no student messaging.
- `D-2026-05-18-009`: Figma product-design automation should target Bryan's `Senior Project App` team/project (`team::1638213362346160913`) for future writes because repeated MCP rate-limit errors were pointing at the older team `team::1601310068697743794`.
- `D-2026-05-18-010`: active Figma product UI source was recreated and continued in the new `Senior Project App` team as file `z4t4tFPAKrMDh6pIYOeEw6`; later professional-plan verification succeeded under `D-2026-05-18-015`.
- `D-2026-05-18-011`: superseded by `D-2026-05-18-013`; the prior every-30-minute beta loop is replaced by the 5x/day gold-standard orchestrator.
- `D-2026-05-18-013`: the consolidated Senior Capstone gold-standard orchestrator runs exactly 5x/day, keeps specialists paused as standby prompts, performs no-intervention approval preflight/fallbacks, self-heals scripts/prompts/checkers when evidence justifies it, and keeps upgrading the project from the master plan and logs until beta.
- `D-2026-05-18-014`: `HD-2026-05-18-001` and ADR-0001 are accepted as the default Cloudflare stack path.
- `D-2026-05-18-015`: Bryan's professional-plan Figma upgrade unblocked verification/write calls; use the 100-pass-or-less, roughly 45-day MVP target as a delivery constraint without changing the gold-standard orchestrator cadence/status.
- `D-2026-05-18-016`: automations must validate, commit, and push project repo changes; project scripts must run non-interactively with safe auto-approval defaults and no prompt/confirmation gates.
- `D-2026-05-18-017`: real daily delivery target is at least 2 accepted MVP passes per calendar day, stretch 3 when unblocked, and at least 14 accepted MVP passes per week.
- `D-2026-05-18-018`: real accounts, persistent data, private evidence storage, server-side authorization, migrations, deployment config, and permission tests are MVP foundation setup work; Figma is design/prototype/spec only and must not own production records.
- `D-2026-05-18-019`: use hardened app-owned username/password auth for the MVP pilot because district SSO is unavailable, provision the first Cloudflare Pages + D1 foundation in Bryan's authorized Cloudflare account, and use Google Drive as the MVP evidence repository path.
- `D-2026-05-18-020`: keep a daily guided multi-frame Figma prototype refresh active at `22:10 PT` so Bryan can see that day's actual progress and next ladder position without turning Figma into the production data source.
- `D-2026-05-18-021`: Day 7 alpha is due 2026-05-24 PT with all app flow working through seeded/demo personas; production user accounts are explicitly post-alpha hardening, not an alpha blocker.

Current rebuilt automation IDs:
- `senior-capstone-canva-visual-system-rebuilt` (`PAUSED` standby)
- `senior-capstone-figma-product-design-rebuilt` (`PAUSED` standby)
- `senior-capstone-rebuild-rebuilt` (`Senior Capstone Gold Standard Orchestrator`, primary 5x/day runner)
- `senior-capstone-content-quality-audits-rebuilt` (`PAUSED` standby)
- `senior-capstone-daily-automation-report-rebuilt` (`PAUSED` standby; reporting handled by orchestrator)
- `senior-capstone-daily-guided-prototype-refresh` (`ACTIVE`; daily `04 Guided Daily Prototype` refresh at `22:10 PT`)
- `senior-capstone-weekly-deep-audit-rebuilt`

## Handoff Rules

Read `docs/progress/handoffs.md` before selecting work. Close handoffs with evidence, not vibes.

Each new handoff should include:

- Stable handoff ID.
- Source lane.
- Owner lane.
- Status.
- Exact next action.
- Acceptance check.
- Evidence needed to close.

## Logging Rules

Every productive automation run should update:

- Its lane log in `docs/progress/`.
- `docs/progress/run-log.md`.
- A structured run manifest in `docs/progress/runs/`.
- Any changed handoff, decision, backlog, or memory file.
- `docs/artifacts.json` for durable external artifacts.
- `docs/human-decisions.md` for Bryan-level decisions.

Every run should end with a pushed commit or a committed blocker entry explaining why that could not happen.

Every run should also record `self-improvement: none` or a specific self-improvement change with evidence.
