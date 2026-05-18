# Senior Capstone Automation Progress

This log is the handoff surface for the hourly rebuild automation. Add a new entry after each run with concrete changes, verification, risks, and the recommended next slice.

## 2026-05-18 Manual Kickoff Pass

Intent:
- Finish the initial audit/gameplan requested by the user.
- Give the hourly automation durable anchor documents so it does not rediscover the same context every run.
- Add the missing Medical Professions program to the canonical program set.

Files changed:
- `docs/rebuild-gameplan.md`
- `docs/domain-model.md`
- `data/programs.json`
- `docs/automation-progress.md`

What changed:
- Added a critical rebuild audit that names the current static-guide limitations, the production risks, the desired hosted-app workflows, the required roles, the security/privacy posture, and the recommended phased rebuild.
- Added a detailed domain model blueprint covering users, roles, student/staff profiles, programs, program requirements, submissions, evidence artifacts, reviews, approvals, comments, audit events, status transitions, permissions, and dashboard metrics.
- Added a structured program seed file with all nine required programs:
  - IT
  - Culinary
  - Hospitality & Marketing
  - Mechanical Technology
  - Construction
  - Sports Medicine
  - Teaching & Training
  - Early Childhood Education
  - Medical Professions
- Updated the hourly automation prompt in the Codex app so future runs read these anchor files first and use `data/programs.json` as the initial canonical program list.

Verification:
- `app.js` syntax check passed with bundled Node.
- `data/programs.json` parsed successfully and contained exactly the nine required program names.
- Internal content link check passed for 33 app-defined links.
- Headless browser smoke check was attempted but could not run because the bundled `playwright` package could not resolve `playwright-core` in this environment.

Current standing:
- The repo now has a written rebuild direction and a first structured data asset.
- The production app itself is not scaffolded yet.
- There is still no backend, auth, database, test runner, package manifest, CI, or deployment pipeline.
- The current public guide still depends on `app.js`, `styles.css`, static HTML shells, and local browser storage.

Recommended next slice:
- Add a formal architecture decision record for the chosen rebuild stack and repo layout.
- Then scaffold the hosted app foundation with a package manifest, TypeScript, tests, lint/type checks, and a place for database schema/migrations.
- The first product vertical slice should remain: student proposal submission -> teacher review -> revision or approval -> dashboard count -> audit log.

## 2026-05-18 Dashboard Reference Pass

Intent:
- Convert user-provided dashboard references into durable product guidance for the rebuild.
- Preserve the direction that staff dashboards should feel like serious operational tools with cards, tables, boards, filters, right-rail metrics, and workload views.

Files changed:
- `docs/dashboard-ux-direction.md`
- `docs/rebuild-gameplan.md`
- `docs/automation-progress.md`

What changed:
- Added a dashboard UX direction document mapping the references into Senior Capstone-specific student, mentor, program teacher, admin, and misc admin dashboards.
- Defined recommended navigation, layout, view modes, status pills, dashboard metrics, reusable components, and the first dashboard vertical slice.
- Linked the rebuild gameplan to the dashboard UX direction so future automation runs account for it.

Verification:
- Documentation-only change. No runtime behavior changed.

Recommended next slice:
- Add a formal architecture decision record and then scaffold the app foundation.
- When implementation begins, use the first dashboard slice from `docs/dashboard-ux-direction.md`: student proposal card, program teacher proposal review queue, and admin proposal counts by program.

## 2026-05-18 Automation Cadence Pass

Intent:
- Set up the recurring Figma, Canva, content audit, and core rebuild cadence requested by the user.
- Stagger jobs so they work together instead of colliding in the same repository at the same minute.

Automations:
- `senior-capstone-figma-product-design`: hourly at `:00`.
- `senior-capstone-rebuild-hourly`: hourly at `:05`.
- `senior-capstone-content-quality-audits`: hourly at `:15` and `:45`.
- `senior-capstone-canva-visual-system`: hourly at `:30`.

Files changed:
- `docs/automation-cadence.md`
- `docs/automation-progress.md`

What changed:
- Added a durable automation cadence document explaining each job's ownership and schedule.
- Moved the existing core rebuild job from `:30` to `:05` to avoid colliding with the new Canva visual-system job.
- Created dedicated Figma, Canva, and content-quality audit automations.

Verification:
- Automation tool confirmed creation/update of the scheduled jobs.
- Documentation-only repo change. No runtime behavior changed.

Recommended next slice:
- Let the first full loop run, then inspect `docs/automation-progress.md` for handoff quality and collisions.
- If the automation outputs are too broad, tighten each prompt toward smaller vertical slices.

## 2026-05-18 Automation Prompt Upgrade Pass

Intent:
- Improve all four Senior Capstone automation prompts so they behave like coordinated specialists with clear lane ownership, bounded work, verification, and handoffs.

Automations updated:
- `senior-capstone-figma-product-design`
- `senior-capstone-rebuild-hourly`
- `senior-capstone-content-quality-audits`
- `senior-capstone-canva-visual-system`

What changed:
- Added stronger read-first instructions and progress-log awareness.
- Added explicit lane ownership for Figma, core rebuild, content audits, and Canva.
- Added one-bounded-slice-per-run discipline.
- Added clearer program coverage requirements for all nine programs.
- Added verification expectations.
- Added artifact/spec/finding requirements for each lane.
- Added sharper accessibility, privacy, and implementation-readiness constraints.
- Added handoff rules so jobs pass work to the correct lane instead of duplicating each other.

Files changed:
- `docs/automation-cadence.md`
- `docs/automation-progress.md`

Verification:
- Automation tool confirmed all four prompt updates.
- Documentation-only repo change. No runtime behavior changed.

Recommended next slice:
- Let one full automation cycle run.
- Then audit whether entries in `docs/automation-progress.md` are specific enough, whether any job is too broad, and whether Figma/Canva produce usable artifacts or need more template/tool-specific prompting.

## 2026-05-18 Commit And Push Prompt Pass

Intent:
- Update all four Senior Capstone automations so completed repository changes are committed and pushed instead of accumulating silently in the worktree.

Automations updated:
- `senior-capstone-figma-product-design`
- `senior-capstone-rebuild-hourly`
- `senior-capstone-content-quality-audits`
- `senior-capstone-canva-visual-system`

What changed:
- Each automation now inspects branch/upstream before work.
- Each automation must stage only files it created or modified during that run.
- Each automation must commit after verification and progress-log update when repository files changed.
- Each automation must push the current branch after a successful commit.
- Each automation must avoid staging unrelated dirty files from users or other automations.
- Each automation must log commit/push blockers explicitly.

Commit prefixes:
- Figma: `figma:`
- Core rebuild: `rebuild:`
- Content audit: `audit:`
- Canva: `canva:`

Files changed:
- `docs/automation-cadence.md`
- `docs/automation-progress.md`

Verification:
- Automation tool confirmed all four prompt updates.
- Documentation-only repo change. No runtime behavior changed.

Recommended next slice:
- Watch the next full automation loop for clean commit boundaries. If jobs conflict over `docs/automation-progress.md`, consider having each job write lane-specific progress files and a rollup summary.

## 2026-05-18 Automation Prompt Hardening Pass

Intent:
- Improve the four automation prompts again with safer sync rules, lane-specific progress logs, clearer definitions of done, and less shared-file contention.

Automations updated:
- `senior-capstone-figma-product-design`
- `senior-capstone-rebuild-hourly`
- `senior-capstone-content-quality-audits`
- `senior-capstone-canva-visual-system`

What changed:
- Added safe start-of-run sync policy: fast-forward pull only when the worktree is clean and upstream exists.
- Added lane-specific progress logs:
  - `docs/progress/figma.md`
  - `docs/progress/rebuild.md`
  - `docs/progress/audit.md`
  - `docs/progress/canva.md`
- Reframed `docs/automation-progress.md` as a short rollup file rather than every automation's primary scratchpad.
- Tightened each lane's deliverables and preferred repo output locations.
- Added more explicit definitions of done and validation expectations.
- Preserved commit/push requirements with lane prefixes.

Files changed:
- `docs/automation-cadence.md`
- `docs/automation-progress.md`

Verification:
- Automation tool confirmed all four prompt updates.
- Documentation-only repo change. No runtime behavior changed.

Recommended next slice:
- Let one full loop run and check whether lane logs reduce collisions.
- If shared rollups still conflict, stop requiring routine writes to `docs/automation-progress.md` and reserve it for human-reviewed milestones only.

## 2026-05-18 Automation Prompt Priority Pass

Intent:
- Improve all four automation prompts with backlog-aware priority selection, clearer definition-of-done behavior, and safer push-race handling.

Automations updated:
- `senior-capstone-figma-product-design`
- `senior-capstone-rebuild-hourly`
- `senior-capstone-content-quality-audits`
- `senior-capstone-canva-visual-system`

What changed:
- Added `docs/automation-backlog.md` as the shared unresolved issue queue.
- Made content audits the owner of backlog severity, owner, status, and next-action hygiene.
- Added lane-specific priority order:
  1. P0/P1 blockers.
  2. Prior lane next step.
  3. Adjacent-lane handoffs.
  4. Smallest useful new slice.
- Added structured progress-entry formats per lane.
- Added one safe fast-forward retry after push rejection, with no force pushes.
- Tightened definition-of-done requirements for each lane.

Files changed:
- `docs/automation-cadence.md`
- `docs/automation-progress.md`

Verification:
- Automation tool confirmed all four prompt updates.
- Documentation-only repo change. No runtime behavior changed.

Recommended next slice:
- Allow one full cycle to create lane logs and backlog entries.
- Then audit whether backlog ownership is working and whether commit/push retry behavior is reducing stuck work.

## 2026-05-18 Automation Prompt Runbook Pass

Intent:
- Improve all four automation prompts again with a reusable runbook, initial backlog skeleton, stronger anti-repetition guidance, and explicit quality gates.

Automations updated:
- `senior-capstone-figma-product-design`
- `senior-capstone-rebuild-hourly`
- `senior-capstone-content-quality-audits`
- `senior-capstone-canva-visual-system`

What changed:
- Added `docs/automation-runbook.md` as the shared operating manual.
- Added `docs/automation-backlog.md` as the shared unresolved issue queue.
- Prompts now read the runbook and backlog before selecting work.
- Added stable backlog ID format guidance.
- Added anti-patterns: no placeholder-only docs, no repeated broad audits, no visual assets without placement, no UI specs without data/permission mapping.
- Added lane self-review expectations.
- Preserved commit/push requirements and safe push retry behavior.

Files changed:
- `docs/automation-runbook.md`
- `docs/automation-backlog.md`
- `docs/automation-cadence.md`
- `docs/automation-progress.md`

Verification:
- Automation tool confirmed all four prompt updates.
- Documentation-only repo change. No runtime behavior changed.

Recommended next slice:
- Let the next audit run populate the backlog with any real P0/P1/P2 gaps.
- Then verify Figma, rebuild, and Canva select work from that backlog rather than creating disconnected artifacts.

## 2026-05-18 Automation Prompt Milestone Pass

Intent:
- Improve all four automation prompts with milestone-driven work selection, anti-churn rules, and clearer first-slice focus.

Automations updated:
- `senior-capstone-figma-product-design`
- `senior-capstone-rebuild-hourly`
- `senior-capstone-content-quality-audits`
- `senior-capstone-canva-visual-system`

What changed:
- Added `docs/automation-milestones.md`.
- Prompts now read milestones before selecting work.
- Work priority now includes earliest incomplete milestone after P0/P1 blockers.
- Added explicit anti-churn rule against spending automation runs on prompt/cadence improvement unless the user asks or a P0 automation failure blocks productive work.
- Tightened focus on M1/M2/M3: architecture/scaffold, domain/security foundations, and first proposal-review vertical slice.
- Added lane self-review requirements around what became clearer/safer/more production-ready.

Files changed:
- `docs/automation-milestones.md`
- `docs/automation-runbook.md`
- `docs/automation-cadence.md`
- `docs/automation-progress.md`

Verification:
- Automation tool confirmed all four prompt updates.
- Documentation-only repo change. No runtime behavior changed.

Recommended next slice:
- Stop iterating on prompts unless a real automation failure appears.
- Let the automations advance M0/M1, beginning with committing/pushing the operating docs and producing the architecture/scaffold decision.

## 2026-05-18 Automation Prompt Loop-Prevention Pass

Intent:
- Improve all four automation prompts with anti-loop behavior, backlog WIP handling, and standard handoff packets.

Automations updated:
- `senior-capstone-figma-product-design`
- `senior-capstone-rebuild-hourly`
- `senior-capstone-content-quality-audits`
- `senior-capstone-canva-visual-system`

What changed:
- Each lane now checks its last two progress entries before selecting work.
- Each lane must avoid repeating the same scope unless it is closing a specific backlog item with new evidence.
- Each lane can mark selected backlog items in-progress, resolved, or blocked with evidence.
- Each lane now includes a handoff packet when another lane needs to act.
- Canva now requires an asset registry/spec entry rebuild can consume.
- Audit now has explicit repeated-finding behavior: close, block, merge, or escalate rather than repeat.

Files changed:
- `docs/automation-runbook.md`
- `docs/automation-cadence.md`
- `docs/automation-progress.md`

Verification:
- Automation tool confirmed all four prompt updates.
- Documentation-only repo change. No runtime behavior changed.

Recommended next slice:
- Let the next automation cycle produce lane logs and handoff packets.
- Audit should verify the first handoff packet from each lane is actually actionable.

## 2026-05-18 App-End-Goal Prompt Pass

Intent:
- Adjust all four automation prompts and shared operating docs so the target is unmistakably a hosted app, not a static guide, standalone visual system, or documentation-only rebuild.

Automations updated:
- `senior-capstone-figma-product-design`
- `senior-capstone-rebuild-hourly`
- `senior-capstone-content-quality-audits`
- `senior-capstone-canva-visual-system`

What changed:
- Prompts now explicitly anchor on secure users/accounts, roles, permissions, private upload/evidence spaces, student submissions, review/approval workflows, dashboards, admin controls, audit records, and protected student records.
- Figma is directed to design permission-aware app screens and upload/evidence flows.
- Core rebuild is directed to own auth, authorization, user models, private upload/evidence storage, backend workflows, tests, and deployment readiness.
- Content audits are directed to reject anything that treats static docs, localStorage, public assets, or visuals as the final student-record system.
- Canva is directed to create supporting visuals for upload/evidence, review, revision, permission, status, and program identity concepts only where they improve the app experience.
- Shared docs now name the app end goal, add upload/evidence and permission requirements, and update M2/M3 milestone expectations.

Files changed:
- `docs/automation-runbook.md`
- `docs/automation-milestones.md`
- `docs/automation-cadence.md`
- `docs/automation-progress.md`

Verification:
- Automation tool confirmed prompt updates before this documentation pass.
- Documentation-only repo change. No runtime behavior changed.

Recommended next slice:
- Core rebuild should choose the auth/permissions/upload storage architecture and scaffold the first secure workflow boundary.
- Figma should specify the student proposal plus evidence upload/link flow, including permission, failure, and review states.
