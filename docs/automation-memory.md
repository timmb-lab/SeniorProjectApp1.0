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
- Day 7 alpha flow now exists at `alpha.html` with `/api/alpha/state` using D1 `app_settings` as a server-owned seeded demo-state layer for student, program teacher, mentor, admin, and misc-admin personas.
- Cloudflare Pages project `senior-capstone-app` is provisioned against `timmb-lab/SeniorProjectApp1.0`; the public Pages URL is `https://senior-capstone-app.pages.dev`.
- Cloudflare D1 database `senior-capstone-db` (`3141d9ac-08b7-49c1-92ba-bbf50c1a611f`) is provisioned and migration `migrations/0001_foundation.sql` has been applied remotely.
- Hardened username/password auth endpoints now exist for bootstrap, login, logout, and session lookup. `PASSWORD_PEPPER` and `SESSION_PEPPER` are set as Cloudflare Pages secrets. First-admin bootstrap is complete for `bryan.timm89@gmail.com`; D1 has the active global admin role and `bootstrap_admin_created` audit event, and the production `BOOTSTRAP_SETUP_KEY` has been removed.
- Production D1 auth is live enough for test flow work: `/api/health` returns `userCount=5`, and four fake `.test` alpha accounts have been seeded for student, program teacher, mentor, and misc-admin roles. Credentials are only in ignored `.secrets/test-accounts-2026-05-18.json`; do not expose them in docs, commits, or chat.
- Google Drive evidence repository root folder `1XPgYKbIMqv332DAJZJNJetHppFB670e7` and index sheet `1b446rp3oyx9G4LpKYE47qXxpU41EOW-2Ota2fGum49c` exist and are wired into Pages config and D1 metadata. Server-side Drive upload credential/OAuth flow remains pending.
- Alpha state-machine tests, alpha contract checks, and GitHub Actions CI workflows now exist (`tests/alpha-flow.test.mjs`, `scripts/check-alpha-contract.mjs`, `npm run check`, `.github/workflows/ci.yml`, and `.github/workflows/alpha-ci.yml`); broader auth/permission/Drive-upload tests remain incomplete.
- Source PDFs have been extracted and converted into app-native requirements in `data/capstone-framework.json`.
- Bryan reset the Senior Capstone automation setup on 2026-05-18, then rebuilt it again as ten active QoL automations. All prior active/standby, daily prototype, weekly audit, seven-category, hourly, and 20x project automation TOMLs are superseded by the QoL set.
- The QoL source of truth is `docs/automation-cadence.md`, and the requirements source of truth remains `docs/mvp-requirements-catalog.md`. Every QoL run must ladder from `docs/master-plan.md` into that catalog, name requirement IDs advanced, and update catalog status/evidence/blockers when material progress happens.
- Figma, Canva, guided-prototype, daily reporting, weekly calibration, and deployment verification work are now handled only when a relevant QoL runner selects a bounded slice that needs that surface.
- Every QoL prompt now requires a relevant progress log entry, compact run-log entry, structured run manifest, relevant memory/handoff/decision/catalog updates, verification, commit, and push.
- Every QoL prompt references `docs/master-plan.md` and `docs/mvp-requirements-catalog.md` along with the durable logs.
- Daily automation summaries, when produced as part of category work, should use `bryan.timm89@gmail.com` for the Google Drive/Doc target if connector permissions allow.
- Every QoL automation now uses `docs/automation-self-improvement.md` to self-review, log whether prompt/config/script changes were needed, and update only its own live automation prompt/config plus the smallest relevant project script when evidence and tool availability justify it.
- Weekly 100-pass goal calibration is now owned by `senior-capstone-qol-source-framework-seed` on Sunday source-framework/catalog runs. It reviews committed evidence, counts accepted MVP passes, and updates only this project's master plan, memory, and requirements catalog when evidence requires a goal/allocation adjustment.
- Automation operating infrastructure now includes prompt snapshots in `docs/automation-prompts/`, structured run manifests in `docs/progress/runs/`, human decisions in `docs/human-decisions.md`, external artifact registry in `docs/artifacts.json`, and contract scripts in `scripts/`.
- Rebuild and content audit lane logs now exist at `docs/progress/rebuild.md` and `docs/progress/audit.md`; `scripts/check-automation-contract.ps1` requires both so future automation reviews catch missing lane-log anchors.
- The automation contract now explicitly forbids local-only repo closeout and interactive project-script prompts: live prompts include the no-human-approval rule, and `scripts/check-automation-contract.ps1` fails if project scripts use PowerShell or JavaScript prompt/confirmation patterns.

## Current Priority

The 100-pass master plan was refreshed on 2026-05-18 after the professional-plan Figma catch-up and automation hardening work. Repo state through commit `08660f3` is the baseline, with later Figma admin provisioning contract node `48:2`, mobile evidence/revision contract node `56:2`, progress update/dashboard aggregate contract node `61:2`, audit log/export controls contract node `69:2`, and mentor meeting/presentation scheduling contract node `78:2`. The Cloudflare Pages/D1 scaffold now exists; Day 7 alpha shell/state-machine/tests now exist; first-admin bootstrap is verified; fake role test accounts are seeded and login-verified; Drive upload credentials, broader permission tests, account lifecycle, and deeper vertical workflow endpoints remain the priority gap.

1. Hit the Day 7 alpha gate by 2026-05-24 PT: full app flow working through seeded/demo personas, without production user accounts blocking progress.
2. Execute accepted `SC-005` / `SC-006` / `HD-2026-05-18-001` / ADR-0001: Cloudflare Workers/Pages + D1 + app-flow alpha + later hardened auth/security assumptions.
3. Continue the real app foundation with TypeScript, package scripts, tests, route shell, role/persona switcher, seed/demo data, and GitHub-to-Cloudflare deployment structure.
4. Model users, groups, roles, permissions, programs, cohorts, requirements, progress records, submissions, evidence artifacts, reviews, approvals, announcements, audit events, export records, meeting attendance, and presentation slots, consuming Figma node `48:2` for admin provisioning states, node `61:2` for progress-update/dashboard-aggregate rules, node `69:2` for audit-log/export controls, and node `78:2` for meeting/presentation scheduling rules.
5. Build the alpha proposal/progress flow: student dashboard -> proposal/research -> evidence metadata/link -> teacher review -> revision/approval -> dashboard/audit update -> mentor/admin/misc-admin views, including meeting/presentation signals where they affect alpha dashboards.

Immediate next five useful passes: broaden auth/permission/evidence tests, extend alpha data into real workflow endpoints, add Google Drive upload credential/OAuth implementation, implement account provisioning/invitation/password-reset lifecycle, then deepen mobile/error/empty/permission alpha QA. The D1-backed alpha flow, persona switcher, student/teacher/mentor/admin/misc-admin views, fake login-capable role accounts, audit timeline, runbook, alpha-week framework, alpha contract checker, preview deploy command, CI workflows, production deployment, and first-admin bootstrap verification now exist.

Real daily MVP goal: minimum 2 accepted MVP passes per calendar day, stretch 3 when unblocked, and at least 14 accepted MVP passes per week until the 100-pass target is met or recalibrated. Until the Day 7 alpha is accepted, the first two accepted passes each day should usually be app-flow implementation or alpha verification, not broad design polish or production account hardening. The 30 daily QoL starts are capacity, not a goal to count scheduled starts as accepted passes. `senior-capstone-qol-source-framework-seed` must review the prior seven days of committed run evidence and adjust only this project's next-week daily goal/allocation in `docs/master-plan.md`, `docs/automation-memory.md`, and `docs/mvp-requirements-catalog.md` when evidence requires it.

Current account/provisioning watchpoint: Cloudflare Pages/D1 setup is done for the first foundation, district SSO is explicitly unavailable for MVP, and the Google Drive evidence root folder is now selected/configured. First-admin credentials and fake test-account credentials were generated into ignored local `.secrets/` storage; bootstrap is complete, production setup key is removed, and four fake `.test` role accounts can log in. Remaining account/config-owned work is server-side Drive upload credentials/OAuth, invitation/import/password-reset flows, credential rotation, broader permission tests, and any district/privacy approval before real student records are entered.

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
- `SC-003`: Google Drive EvidenceArtifact model is in-progress; metadata tables and root folder exist, but upload credentials and permission tests are still needed.
- `SC-004`: mentor meetings, presentation scheduling, celebration evidence, archive/export workflows.
- `SC-005`: P0 Cloudflare stack/auth/database/user-group/progress/private-upload scaffold is in-progress with Pages/D1/migrations/auth endpoints, password/session pepper secrets, Drive root folder configured, D1-backed alpha flow, state-machine tests, alpha contract checks, CI, production alpha deployment, verified first-admin bootstrap, and login-verified fake role test accounts; broader permission tests, account lifecycle, and Drive upload credentials remain.
- `SC-006`: P0 Day 7 full app-flow alpha due 2026-05-24 PT; production user accounts may be incomplete, and the first D1-backed seeded alpha flow plus fake login-capable role accounts now exist. Framework/check/CI and deployment verification exist; mobile proof and broader workflow tests remain.

## Known External Artifact Memory

- Canva folder: `FAHJ-n-VqFE`.
- Canva asset: `DAHJ-v7TOM8`, proposal approval process strip, no-text 1600x500, palette from `styles.css`.
- Next Canva priority: proposal dashboard empty-state family.
- Active Figma product UI file: `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6` (`z4t4tFPAKrMDh6pIYOeEw6`). Created and populated in Bryan's `Senior Project App` Figma team/project, team id `1638213362346160913`, plan key `team::1638213362346160913`.
- Active Figma file contains five pages: `00 Master Plan + Foundations`, `01 Components + App Screens`, `02 Automation Handoff`, `03 Product Preview + State Variants`, and `04 Guided Daily Prototype`. Key frames include foundations board `2:5`, components board `3:2`, student desktop `3:66`, guided proposal `3:154`, teacher queue `3:190`, mentor/admin snapshots `3:246`, mobile student `3:301`, handoff board `5:2`, state variants board `6:2`, review drawer `6:198`, admin override modal `6:219`, rebuild mapping `6:257`, 100-pass MVP execution map `18:2`, admin account/group provisioning contract `48:2`, mobile evidence/revision contract `56:2`, progress dashboard aggregate contract `61:2`, audit log/export controls contract `69:2`, guided prototype start `75:3`, guided prototype progress `75:34`, guided prototype student path `75:65`, guided prototype staff path `75:96`, guided prototype security boundary `75:127`, guided prototype next ladder `75:158`, and mentor meeting/presentation scheduling contract `78:2`.
- Professional-plan verification succeeded on 2026-05-18 after Bryan upgraded Figma: metadata and screenshots returned for the active file, and Figma write added `100-Pass MVP Execution Map` node `18:2` with route/data/permission contract for rebuild.
- Figma review/override deepening succeeded on 2026-05-18: active file node `31:2` adds teacher review drawer states, admin override modal states, and developer handoff contract node `31:144` covering `ReviewDecision`, `OverrideRequest`, `AuditEvent`, `Submission`, `EvidenceArtifact`, and `UserGroupRole`.
- Figma private evidence/review-history deepening succeeded on 2026-05-18: active file node `37:2` adds private upload/link states, evidence permission matrix, immutable review history timeline, and developer handoff contract node `37:177` for `SubmissionVersion`, `EvidenceArtifact`, `Review`, `Comment`, `AuditEvent`, and `StudentArchiveExport`.
- Figma shared component deepening succeeded on 2026-05-18: active file node `43:2` adds MVP component variant sets `StatusPill` (`43:55`, 11 variants), `ActionButton` (`43:73`, 7 variants), and `EvidenceArtifactRow` (`43:149`, 8 variants), plus shared UI handoff contract `43:150` for `PermissionGate`, `ReviewHistoryItem`, route/data fields, permission scopes, audit guardrails, and acceptance checks.
- Figma admin provisioning deepening succeeded on 2026-05-18: active file node `48:2` adds eight account/group/role/program/cohort provisioning states, permission matrix, data model matrix, and developer handoff contract `48:208` covering `/admin/users`, `/admin/groups`, `/admin/programs`, `/admin/cohorts`, `/admin/audit`, user import, role assignments, mentor assignments, `User`, `UserRole`, `StudentProfile`, `StaffProfile`, `GroupMembership`, `MentorAssignment`, `Permission`, and `AuditEvent`.
- Figma mobile evidence/revision deepening succeeded on 2026-05-18: active file node `56:2` adds four mobile student states for revision checklist, evidence upload/link, submit blocked, and access recovery, plus developer handoff contract `56:114` covering `/student/evidence`, `/student/submissions/:submissionId/revise`, `/api/submissions/:id/evidence`, `/api/evidence/:id/check-access`, `/api/reviews/:id/history`, `/admin/audit`, `Submission`, `SubmissionVersion`, `EvidenceArtifact`, `Review`, `Comment`, `AuditEvent`, `UserGroupRole`, and mobile overflow/permission/audit acceptance checks.
- Figma progress/dashboard aggregate deepening succeeded on 2026-05-18: active file node `61:2` adds five progress-update/dashboard states, six server transition steps, and developer handoff contract `61:113` covering `/student/progress`, `/api/progress-updates`, `/api/submissions/:id/status`, `/teacher/dashboard`, `/mentor/dashboard`, `/admin/dashboard`, `/admin/audit`, `ProgressUpdate`, `StatusHistory`, `RequirementProgress`, `DashboardAggregate`, `DashboardSnapshot`, `AuditEvent`, role scopes, stale-write conflicts, and server-derived aggregate acceptance checks.
- Figma audit/export controls deepening succeeded on 2026-05-18: active file node `69:2` adds five audit-log/export states, six authorization/export pipeline steps, audit stream and export request panels, and developer handoff contract `69:180` covering `/admin/audit`, `/api/audit-events`, `/api/audit-events/:id`, `/admin/exports`, `/api/exports/student-archive`, `/api/exports/:id/download`, `/student/archive`, `AuditEvent`, `AuditEventView`, `ExportRequest`, `StudentArchiveExport`, `ExportArtifact`, `EvidenceArtifact`, `StudentProfile`, `UserGroupRole`, `RetentionPolicy`, signed-download expiry, redaction, explicit scoped permission, and denied-access audit checks.
- Figma mentor meeting/presentation scheduling deepening succeeded on 2026-05-18: active file node `78:2` adds six meeting/presentation states, six server pipeline steps, and developer handoff contract `78:166` covering `/mentor/meetings`, `/mentor/assigned`, `/api/meetings/:id/attendance`, `/student/mentor-meetings`, `/student/presentation`, `/api/presentation-slots`, `/api/presentation-slots/:id/check-in`, `/teacher/dashboard`, `/admin/audit`, `Meeting`, `MeetingAttendance`, `MentorAssignment`, `PresentationSlot`, `Submission`, `SubmissionVersion`, `EvidenceArtifact`, `Review`, `Requirement`, `Deadline`, `AuditEvent`, `StudentProfile`, `UserGroupRole`, slot conflict blocking, make-up linkage, outline approval gates, and audited check-out/check-in checks.
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
- Day 7 alpha app route: `https://senior-capstone-app.pages.dev/alpha.html`, repo entry `alpha.html`, API route `/api/alpha/state`.
- Google Drive evidence repository root folder: `https://drive.google.com/drive/folders/1XPgYKbIMqv332DAJZJNJetHppFB670e7`, title `Senior Project App`; configured in Cloudflare Pages and D1 on 2026-05-18.
- Google Drive evidence repository index: `https://docs.google.com/spreadsheets/d/1b446rp3oyx9G4LpKYE47qXxpU41EOW-2Ota2fGum49c`, sheets `Evidence Index`, `Folder Policy`, and `Upload Intake Fields`.

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
- `D-2026-05-18-022`: use Google Drive folder `1XPgYKbIMqv332DAJZJNJetHppFB670e7` (`Senior Project App`) as the MVP evidence repository root.
- `D-2026-05-18-023`: use `docs/alpha-week-framework.md`, `npm run check`, `scripts/check-alpha-contract.mjs`, `.github/workflows/alpha-ci.yml`, and `npm run deploy:preview` as the Day 7 alpha execution/verification rail.
- `D-2026-05-18-024`: delete the prior Senior Capstone active/standby automation setup and replace it with seven active MVP requirement category runners, laddering from `docs/mvp-requirements-catalog.md`.
- `D-2026-05-18-025`: escalate the seven category runners to hourly execution, 168 scheduled starts/day total, with no human approvals inside project scripts, GUI-facing hourly names, and self-improvement to scripts/checkers as evidence requires.
- `D-2026-05-18-026`: superseded by `D-2026-05-18-027`; the seven category runners were tuned into a 20x/day A-material automation system.
- `D-2026-05-18-027`: delete all Senior Capstone project automation again and rebuild from scratch as ten focused QoL automations, each running exactly 3x/day, with no shared start slots, at least 45 minutes between starts, no human approvals inside project scripts, requirement laddering, token budget guardrails, surface expansion, and script/checker self-improvement.

Current QoL automation IDs:
- `senior-capstone-qol-source-framework-seed` (`ACTIVE`; `00:03`, `08:03`, `16:03` PT; GUI name `Senior Capstone QoL - Source Framework Seed`)
- `senior-capstone-qol-drive-upload-oauth` (`ACTIVE`; `00:51`, `08:51`, `16:51` PT; GUI name `Senior Capstone QoL - Drive Upload OAuth`)
- `senior-capstone-qol-protected-evidence-tests` (`ACTIVE`; `01:39`, `09:39`, `17:39` PT; GUI name `Senior Capstone QoL - Protected Evidence Tests`)
- `senior-capstone-qol-teacher-review-endpoints` (`ACTIVE`; `02:27`, `10:27`, `18:27` PT; GUI name `Senior Capstone QoL - Teacher Review Endpoints`)
- `senior-capstone-qol-immutable-review-history` (`ACTIVE`; `03:15`, `11:15`, `19:15` PT; GUI name `Senior Capstone QoL - Immutable Review History`)
- `senior-capstone-qol-mentor-presentation-flow` (`ACTIVE`; `04:03`, `12:03`, `20:03` PT; GUI name `Senior Capstone QoL - Mentor Presentation Flow`)
- `senior-capstone-qol-admin-ops-endpoints` (`ACTIVE`; `04:51`, `12:51`, `20:51` PT; GUI name `Senior Capstone QoL - Admin Ops Endpoints`)
- `senior-capstone-qol-announcements` (`ACTIVE`; `05:39`, `13:39`, `21:39` PT; GUI name `Senior Capstone QoL - Announcements`)
- `senior-capstone-qol-account-lifecycle` (`ACTIVE`; `06:27`, `14:27`, `22:27` PT; GUI name `Senior Capstone QoL - Account Lifecycle`)
- `senior-capstone-qol-cloudflare-verification` (`ACTIVE`; `07:15`, `15:15`, `23:15` PT; GUI name `Senior Capstone QoL - Cloudflare Verification`)

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

## 2026-05-18 12:47 PT - Automation Coverage Audit

- At that point, seven active category automations were the live source of truth: requirements-audit, backend-security-data, student-workflow-evidence, staff-review-mentor, admin-ops-reporting, deployment-qa, and design-assets-handoff.
- Superseded by the 12:55 PT cadence escalation: the live registry now has 168 starts/day, 24 per category, with no shared scheduled start minute.
- A custom prompt coverage audit verified every `MVP-001` through `MVP-030` is explicitly targeted by at least one active automation prompt.
- `scripts/check-automation-contract.ps1` now enforces all 30 catalog IDs and all 30 active-prompt coverage IDs instead of only checking representative samples.
- Validation passed: `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\check-automation-contract.ps1 -RepoRoot .`.
- Current implementation priorities remain protected-evidence/permission tests, Drive upload credentials/OAuth, source-framework seed loader, production workflow endpoints/history, account lifecycle hardening, and deployment verification.

## 2026-05-18 12:55 PT - Hourly Automation Escalation

- Bryan asked to ensure the Senior Capstone automation runs as many times per day as possible with no human approvals, logging, laddering, and self-improvement to scripts as it goes.
- Superseded by the 20x/day A-material tuning below.
- Updated all seven local Codex automation TOMLs to GUI-facing hourly names and hourly RRULEs: `:03`, `:11`, `:19`, `:27`, `:35`, `:43`, and `:51` every hour in America/Los_Angeles.
- The resulting cadence is 168 scheduled starts/day and 24 starts/category/day, with no exact start overlap.
- The live prompts now include a no-human-approval rule and a self-improvement-to-scripts rule.
- `scripts/check-automation-contract.ps1` now enforces hourly names/RRULEs, 168 daily starts, prompt coverage, prompt no-human-approval/self-improvement fragments, and interactive-prompt bans across PowerShell and JavaScript project scripts.

## 2026-05-18 13:07 PT - 20x A-Material Automation Readiness

- Bryan asked to make any needed changes to get this A-material and ready to run 20x/day while only touching automation related to this project.
- Updated all seven local Codex automation TOMLs to GUI-facing `Senior Capstone 20x System - ...` names and a 20 total starts/day schedule weighted toward backend/security and student workflow.
- A-material prompt rules now require verified MVP progress, a repeatable automation/script/checker repair, or an exact committed blocker with requirement IDs, validation, and next action.
- The checker now enforces the 20x/day schedule, no shared start slots, at least 30 minutes between starts, no-human-approval language, self-improvement-to-scripts language, and the project-only automation maintenance scope.

## 2026-05-18 13:12 PT - MVP And Surface Expansion Audit

- Reviewed all seven active 20x prompts against `docs/mvp-requirements-catalog.md`.
- Every `MVP-001` through `MVP-030` is explicitly covered by at least one active automation prompt.
- Added a surface expansion rule to all seven live local prompts so each selected requirement slice must identify required work/proof in app code/routes/schema, Cloudflare Pages/D1/env/deploy, Figma route-data-permission handoff, Canva support assets, tests/CI, docs/artifacts/handoffs, and exact blockers.
- `scripts/check-automation-contract.ps1` now enforces that surface expansion rule in prompt snapshots.
- Validation passed: prompt snapshots regenerated, automation contract passed, and a custom coverage audit confirmed all 30 MVP IDs remain covered.

## 2026-05-18 13:24 PT - QoL Automation Rebuild

- Bryan asked to delete all project automation and rebuild from scratch so every listed QoL/MVP gap gets at least three daily passes while spreading work across individual automations to control token pressure.
- Deleted the prior seven local Senior Capstone 20x category TOMLs from the active registry and created ten focused QoL automation TOMLs.
- The live QoL cadence creates 30 starts/day, exactly 3x/day per QoL target, with no exact overlaps and at least 45 minutes between starts.
- `scripts/snapshot-automation-prompts.ps1` now removes stale Senior Capstone prompt snapshots before writing the current ten snapshots.
- `scripts/check-automation-contract.ps1` now enforces the exact ten IDs, GUI-facing names, schedules, prompt fragments, token budget guardrails, surface expansion rules, full `MVP-001` through `MVP-030` prompt coverage, no stale Senior Capstone TOMLs, non-interactive scripts, current runbook/master-plan sections, and JSON parse checks.
- Current validation passed: prompt snapshots regenerated and the automation contract passed for 10 QoL automations.

## 2026-05-18 13:58 PT - Full MVP Alpha Prototype

- Active Figma file `z4t4tFPAKrMDh6pIYOeEw6` now includes page `05 Full MVP Alpha Prototype`, page id `98:2`.
- The prototype has 15 primary app states, frames `98:3` through `98:17`, plus map rail `98:1130`.
- Verified by Figma readback: 16 top-level nodes, 15 screens, 176 prototype reactions, 600 text nodes, zero suspicious clipped text nodes, zero detected top-level frame overflow, and shared full-alpha prototype contract data with 15 route entries.
- This should be the primary Figma prototype reference for build-week implementation alongside existing contract nodes `18:2`, `31:2`, `37:2`, `43:2`, `48:2`, `56:2`, `61:2`, `69:2`, and `78:2`.

## 2026-05-18 14:47 PT - 30-Day Automation Efficiency Audit

- Current schedule remains 10 active QoL automations and 30 starts/day, with no exact overlaps and 48-minute minimum spacing.
- 30-day capacity is 900 starts. Minimum accepted-pass target is 60 and stretch target is 90, so conversion thresholds are 6.67 percent and 10 percent.
- Added `scripts/measure-automation-efficiency.ps1` to make Sunday calibration and explicit automation audits evidence-based.
- Added future manifest telemetry requirements: `requirement_ids`, `accepted_mvp_pass`, `duration_minutes`, `output_kind`, and `automation_efficiency.scale_signal`.
- Durable audit: `docs/audits/automation-30-day-efficiency-audit-2026-05-18.md`.
- Decision: keep cadence stable and scale by retargeting QoL focus, blockers, prompt clarity, and acceptance checks before recommending schedule changes.
