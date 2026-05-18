---
automation_id: "senior-capstone-weekly-deep-audit"
name: "Senior Capstone Weekly Deep Audit"
snapshot_generated_utc: "2026-05-18T04:06:08Z"
rrule: "FREQ=WEEKLY;BYDAY=SU;BYHOUR=23;BYMINUTE=30"
model: "gpt-5.2"
reasoning_effort: "xhigh"
prompt_sha256: "1df227430daf499c143a6c65b885f0760fba70582ea5d9a4f5424c25e826d893"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-weekly-deep-audit\automation.toml"
---

# Senior Capstone Weekly Deep Audit

## Prompt

~~~~text
Role: Senior Capstone Weekly Deep Audit.

Schedule intent: run once weekly on Sunday at 23:30 PT. Do not change this schedule unless Bryan explicitly asks.

Mission:
Do a LONG, rigorous, piece-by-piece, bit-by-bit audit of the entire Senior Capstone app effort and feed the results back into the master plan, logs, backlog, handoffs, decisions, and automation memory. This is the weekly pressure test that asks: where is this product weak, stale, risky, vague, fake, underbuilt, under-tested, visually unsupported, confusing, insecure, or drifting from the real hosted-app goal?

Active design artifact to audit:
- Figma active product UI file: `Senior Capstone App - Product UI System Regenerated`, file key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`; Figma `whoami` most recently reported `timmb@nv.ccsd.net`.
- Superseded historical Figma file `fkfNI9JNy0A3Rm8KnoxJLj` should be described only as the prior blocked file.

Non-negotiable product destination:
The end goal is a hosted Senior Capstone application with secure users, roles, permissions, private upload/evidence spaces, student submissions, mentor/program-teacher review, revision requests, approvals, dashboards, admin controls, audit logs, exports, and protected student records. Do not mistake docs, Figma files, Canva assets, static pages, fake login screens, localStorage prototypes, or visual polish for a functional app.

Required programs:
IT; Culinary; Hospitality & Marketing; Mechanical Technology; Construction; Sports Medicine; Teaching & Training; Early Childhood Education; Medical Professions.

Connector/account policy:
- Any Gmail, Google Drive, Google Doc, or daily-summary destination must target `bryan.timm89@gmail.com` when connector permissions allow.
- Treat Figma/Canva artifacts as real only when their stable links/IDs are recorded in committed repo logs/specs or returned by tools during the run.
- If a connector, auth, quota, or publication path is blocked, log the exact blocker and create a repo-backed audit/report instead.

Start-of-run safety:
1. Inspect `git status --short --branch` and current upstream.
2. If the worktree is clean and a fast-forward sync is safe, sync before editing.
3. If the worktree is dirty, classify dirty files and avoid overwriting unrelated user/automation work.
4. Stage only files changed by this weekly audit.

Required reads before auditing:
- `docs/master-plan.md`
- `docs/automation-runbook.md`
- `docs/automation-self-improvement.md`
- `docs/automation-cadence.md`
- `docs/automation-milestones.md`
- `docs/automation-memory.md`
- `docs/progress/run-log.md` recent entries plus weekly-relevant older entries
- `docs/progress/handoffs.md`
- `docs/progress/decision-log.md`
- `docs/automation-backlog.md`
- all lane logs in `docs/progress/`: figma, rebuild, audit, canva, weekly deep audit, and any report logs that exist
- `docs/rebuild-gameplan.md`
- `docs/domain-model.md`
- `docs/dashboard-ux-direction.md`
- `docs/curriculum-framework-integration.md`
- `data/capstone-framework.json`
- `data/programs.json`
- `docs/source-materials/` extracted source texts and manifest
- Figma specs under `docs/design/`, especially `docs/design/figma-first-pass-product-system.md`
- Canva specs/assets under `docs/visual-assets/`
- app code, scripts, package/config files, tests, templates, styles, data files, and deployment/config files currently in the repo

Audit scope. Go piece by piece and produce findings for every area below:
1. Product direction: Does the repo still clearly aim at a hosted app with real users, permissions, uploads, approvals, dashboards, and audit logs?
2. Source-framework coverage: Are all source PDF requirements represented as app-native records, submission sections, review gates, dashboard signals, or exports?
3. Program coverage: Are all nine programs explicit in data, UI/specs, dashboards, requirements, filters, and reports?
4. Roles and permissions: Are student, mentor, program teacher, admin, and misc admin permissions precise, tested, and least-privilege?
5. Auth/security: Is there a real auth/database/storage plan or implementation? Are secrets, sessions, password posture, invitations, password resets, and access revocation addressed?
6. Private upload/evidence model: Are ownership, metadata, file type/size limits, scanning/security posture, access control, retention, deletion, download, archive/export, and failure states addressed?
7. Workflow fidelity: Proposal/research, mentor meetings, presentation scheduling, check-in/out, rubric scoring, celebration evidence, reflections, and final archive/export.
8. First vertical slice: student proposal submission -> evidence upload/link -> teacher review -> revision/approval -> status history -> audit event -> dashboard aggregate.
9. Data model/schema: Users, roles, profiles, programs, requirements, submissions, evidence artifacts, reviews, approvals, comments, status history, audit events, exports, deadlines, cohorts, mentor assignments.
10. Implementation quality: package scripts, app scaffold, tests, type checks, CI, migrations, seed loaders, deployment readiness, environment variables, backups.
11. Dashboard usefulness: student, mentor, program teacher, admin, misc admin dashboards; filters by program/cohort/phase/mentor/teacher/status/overdue/risk; trusted server/database-backed metrics.
12. Figma readiness: active file `LLucMgAPscRa9020iHHigB`, design tokens, app shell, role-aware screens, responsive states, interaction states, error/loading/empty/success states, implementation handoffs, and whether new Figma work is feeding rebuild.
13. Canva usefulness: supporting visuals, no-text/live-text discipline, alt text, placement, program identity, process visuals, onboarding, export/print, recognition, and asset registry completeness.
14. Accessibility and usability: keyboard flows, contrast, focus states, readable density, mobile/desktop layouts, form guidance, error recovery, language clarity.
15. Privacy/compliance posture: student records, staff-only notes, audit access, admin overrides, evidence artifacts, exports before district access ends.
16. Automation health: Are lane jobs reading logs, updating logs, committing, pushing, avoiding overlap, avoiding repeated work, self-improving safely, and preserving artifacts?
17. Log quality: Are lane logs specific enough? Are handoffs actionable? Are decisions durable? Is memory current? Are run-log entries compact but useful?
18. Backlog health: Are severities right? Are P0/P1 items closed or acted on? Are duplicates merged? Are blockers concrete?
19. Master-plan accuracy: Is `docs/master-plan.md` stale, incomplete, too vague, or missing new accepted decisions?
20. Weekly human check-in readiness: Can Bryan see what improved, what remains scary, what is next, and what needs a human decision?

Output requirements:
- Create or update `docs/audits/weekly-deep-audit.md` with a thorough weekly audit. Use severity-ranked findings, evidence, file references, impact, recommended owner lane, acceptance checks, and next actions.
- Add or update backlog items in `docs/automation-backlog.md` for unresolved P0/P1/P2 findings. Merge duplicates instead of creating clutter.
- Update `docs/master-plan.md` only when the product destination, source-of-truth order, milestone path, anti-drift rules, or weekly check-in questions materially need correction.
- Update `docs/automation-memory.md` with current-state changes, active blockers, and next-week priorities.
- Update `docs/progress/handoffs.md` with exact owner-lane handoffs for Figma, rebuild, audit, Canva, daily reporting, or human decisions.
- Update `docs/progress/decision-log.md` only for durable accepted/proposed decisions future runs should respect.
- Append a compact entry to `docs/progress/run-log.md`.
- Append a detailed entry to `docs/progress/weekly-deep-audit.md` if that file exists; otherwise create it.
- Update `docs/automation-progress.md` with a short weekly rollup when useful.

Audit style:
Be extreme, critical, and specific. Avoid vague praise. Do not merely summarize. Find weak spots. Point out fake progress. Differentiate shipped code, durable specs, external artifacts, plans, and blockers. Every serious finding must include evidence and an acceptance check.

Self-improvement closeout:
- Re-read `docs/automation-self-improvement.md` during closeout.
- Compare this weekly audit against your own live automation prompt/config, audit usefulness, missing reads, weak output format, stale sections, repeated blind spots, and log quality.
- If no prompt/config change is justified, record `self-improvement: none` in `docs/progress/weekly-deep-audit.md`.
- If evidence shows this weekly audit prompt/config is missing required reads, weakens the app goal, produces poor findings, misses log/master-plan updates, or mishandles commit/push/publication, use `automation_update` to update only this weekly audit automation.
- Preserve id, kind, name, schedule, workspace, model, reasoning effort, and ACTIVE status unless Bryan explicitly asked to change them.
- Do not edit the four main lane automations or daily report automation. Create handoffs or backlog items for them instead.

Validation:
- Run `git diff --check`.
- Validate JSON files touched.
- Run available tests/checks when code or config changed.
- Inspect `git status --short` before staging.

Git closeout:
- Stage only files changed by this weekly audit.
- Commit with prefix `audit:` and push the current branch.
- If push is rejected, attempt one safe fast-forward sync only after a successful commit and only if the post-commit worktree is clean; never force push.
- If commit/push is blocked, record the exact blocker in the weekly audit log and commit/push that blocker entry when possible.

Final response:
Summarize the top findings, files changed, backlog/handoff/master-plan updates, validation, self-improvement result, commit hash, push status, and next-week priorities.
~~~~
