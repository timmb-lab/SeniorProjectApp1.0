# Automation Runbook

Date: 2026-05-18

This runbook is the shared operating manual for the Senior Capstone automation loop.

## Purpose

The automations should steadily turn the current static guide into a GitHub-to-Cloudflare hosted, role-based Senior Capstone platform without duplicating work, trampling each other's files, or producing vague planning artifacts that no one can implement.

The top-level product anchor is `docs/master-plan.md`. Every automation must read it before selecting work and should be able to name the master-plan section its chosen slice advances.

Milestones live in `docs/automation-milestones.md`. Product work should advance the earliest incomplete milestone unless a higher-severity backlog item demands attention.

Self-improvement rules live in `docs/automation-self-improvement.md`. Every automation may tune its own prompt/config from evidence, but product progress remains the default work.

Improvement-request default: when Bryan asks for ways to improve, treat that as permission to implement the strongest safe, high-confidence improvements immediately, then log, validate, commit, and push them.

Automation operating infrastructure now includes:

- `docs/automation-prompts/`: repo snapshots of live automation prompts.
- `docs/progress/runs/`: structured JSON run manifests.
- `docs/human-decisions.md`: Bryan-level decision queue.
- `docs/artifacts.json`: structured external artifact registry.
- `docs/mvp-requirements-catalog.md`: category-owned MVP requirements, statuses, blockers, and acceptance evidence.
- `scripts/snapshot-automation-prompts.ps1`: regenerates prompt snapshots from live automation TOML files.
- `scripts/check-automation-contract.ps1`: validates live prompts when present, repo prompt snapshots when live TOMLs are unavailable, registry files, and required automation contract references. Use `-RequireLive` when the goal is to fail on local Codex registry drift instead of accepting snapshot fallback.
- `scripts/run-powershell-script.mjs`: lets npm/CI run project PowerShell scripts with non-interactive flags on the available PowerShell runtime.

## Connector Approval Preflight

Unattended automations must not discover a write-approval prompt only after they have started a connector action. Connector write access is a local Codex app preflight item, not something a prompt can reliably solve after the tool call is already waiting.

Before a scheduled automation depends on an external write tool, verify that the needed tool is either already allowed in `C:\Users\bryan\.codex\config.toml` or that the automation has an explicit repo fallback.

For the daily Senior Capstone Google Doc report, the required Google Drive write grants are:

```toml
[apps.connector_5f3c8c41a1e54ad7a76272c89e2554fa.tools."google drive_create_file"]
approval_mode = "approve"

[apps.connector_5f3c8c41a1e54ad7a76272c89e2554fa.tools."google drive_batch_update_document"]
approval_mode = "approve"
```

If a grant is missing, Bryan must run the action once while present and choose `Always allow`, or the automation must skip that connector write and use its committed repo fallback. Do not rely on a future unattended run to click approval. For email reporting, prefer drafts over direct sends unless Bryan has explicitly approved unattended sending.

## No-Human-Approval Script Rule

Senior Capstone project scripts must be safe for unattended automation. Automations should run repo scripts with explicit non-interactive execution flags:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\<script-name>.ps1
```

When npm is available, use the repo wrappers for common automation script actions:

```powershell
npm run automation:snapshot
npm run check:automation
npm run check:automation:live
```

When npm is unavailable but Node is available, use the wrapper directly:

```powershell
node scripts/run-powershell-script.mjs scripts/check-automation-contract.ps1
node scripts/run-powershell-script.mjs scripts/check-automation-contract.ps1 -RequireLive
node scripts/run-powershell-script.mjs scripts/measure-automation-efficiency.ps1 -RepoRoot . -Days 30
```

Use `-RequireLive` / `npm run check:automation:live` only when auditing the live Codex GUI/local automation registry. The default automation check may validate repo prompt snapshots when live TOMLs are unavailable, which keeps CI and repo-only audits useful.

Scripts in `scripts/` must not use `Read-Host`, `PromptForChoice`, `Pause`, `prompt()`, `confirm()`, `readline`, `inquirer`, stdin waits, or ad hoc confirmation gates. If a script needs a risky external or destructive action, it should require an explicit command-line flag and otherwise choose the safe repo-only path. Unattended automations should not wait for approvals inside scripts; they should use saved approval grants, safe defaults, or committed blocker records with exact next action.

## Backend Account/Provisioning Rule

For the Senior Capstone app backend foundation, local scaffolding, schema design, migration files, permission helpers, and tests can proceed without a live Cloudflare account. Remote setup requires Bryan-owned authorization before an unattended run can safely create or bind production resources:

- Cloudflare account/organization selected for Workers/Pages, D1, R2, secrets, logs, and the future custom domain.
- Wrangler or Cloudflare API access authorized for that account.
- GitHub repository access granted to Cloudflare Workers & Pages, scoped to this repo when possible.
- A decision on school Google/Microsoft SSO versus a hardened username/password pilot path.
- Confirmation that student emails and private evidence storage are allowed under school/district policy.

If those account/provisioning pieces are missing, rebuild should still scaffold local code and migrations, then log a precise `ACTION REQUIRED` item instead of blocking all work.

## QoL Automation Rebuild

Bryan explicitly rebuilt the project automation from scratch into ten focused QoL target groups: source framework seed, Drive upload/OAuth, protected evidence tests, teacher review endpoints, immutable review history, mentor presentation flow, admin ops endpoints, announcements, account lifecycle, and Cloudflare verification. The live registry represents that as thirty single-slot automations, three per QoL target, because a single automation with multiple daily BYHOUR values was not reliably firing.

After the overnight May 18-19 audit, Slot 2 and Slot 3 are paused reserve capacity. Slot 1 remains active for all ten QoL targets, giving the project one daily burn-down pass per target while write access and policy blockers are repaired. Do not reactivate the paused companions until a live audit shows the active Slot 1 runners can write, validate, commit, and push again.

## Category Runner No-Intervention Contract

The Senior Capstone automation system now uses ten active Slot 1 QoL runners plus twenty paused reserve companions. Together, the active runners run 10 times per day on a staggered schedule recorded in `docs/automation-cadence.md`, with no shared scheduled start slots. The older orchestrator, standby lanes, daily prototype job, separate weekly audit job, broad seven-category runners, brief hourly escalation, and 20x category system are superseded by these QoL runners.

Each QoL runner should resolve everything it can resolve from accepted docs, repo evidence, saved connector approvals, and safe fallbacks. It should not stop for a human when it can:

- Accept an already documented default decision that Bryan has explicitly or implicitly authorized in this project.
- Patch a script, prompt, checker, snapshot, manifest, log, or fallback path that is clearly failing.
- Use `C:\Users\bryan\.codex\config.toml` approval grants that already exist.
- Avoid a mutating connector call that would require a fresh approval and write the repo fallback instead.
- Convert an external OAuth/scope failure into a committed blocker with exact account-level action required.

Human-decision entries are reserved for account ownership, legal/privacy policy, school operations, budget, credentials, and production provisioning decisions that cannot be inferred from accepted docs.

## A-Material Automation Quality Bar

Every productive run should produce A-material evidence. It must do one of three things:

- Land verified MVP progress for a named requirement ID from `docs/mvp-requirements-catalog.md`.
- Repair a repeatable project automation, script, checker, snapshot, or manifest failure so the same miss is less likely to recur.
- Commit an exact blocker with the requirement ID, command or tool that failed, suspected account/tool cause, and next action.

For automation maintenance, only touch automation related to this project: local Senior Capstone automation TOMLs, prompt snapshots, automation docs/logs/manifests, project automation scripts/checkers, and project automation memory.

## Writable Preflight

Every QoL run must spend the first minute proving it can do useful work before it opens large context:

- Run `git status --short --branch`.
- Confirm the current automation is not a paused reserve Slot 2 or Slot 3 runner.
- Confirm repo writes are available by planning a tiny repo-owned log/manifest update before broad inspection. Do not make throwaway files.
- Confirm command execution can run the bundled or PATH Node/PowerShell path needed for repo checks.
- If `apply_patch`, shell execution, `$CODEX_HOME` reads, Git LFS, Node/npm, or commit/push is blocked by policy, stop the product slice immediately and leave the shortest possible blocker closeout with the exact command/error and next action. Do not spend a full run rediscovering the same read-only state.
- If only external deployment/connector access is blocked, keep working on local code/tests/docs that can be committed; log the external blocker as a narrow follow-up.

## Token Budget Guardrail

QoL automations should avoid giant context loads. Every run reads the required anchors, then stays narrow:

- Prefer `rg`, recent run manifests, and relevant log sections before opening long files.
- Read the specific source files, tests, docs, Figma/Canva handoffs, or Cloudflare setup notes needed for the selected QoL target.
- Avoid broad repo scans unless the selected acceptance check requires it.
- Pick one bounded QoL slice per run and leave unrelated MVP work for its own automation.

## 30-Day Efficiency Auto-Scaling Protocol

The current burn-down cadence is 10 active starts/day, with twenty paused reserve starts/day available only after write access and accepted-pass conversion improve. Scaling should first improve conversion, target selection, and blocker burn-down, not simply add starts.

Use this command for explicit automation audits and Sunday calibration:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\measure-automation-efficiency.ps1 -RepoRoot . -Days 30
```

Use `-OutputPath <path>` when a scheduled run should save the JSON scorecard as a durable artifact before logging or summarizing it.

The efficiency scorecard measures active QoL automation count, daily start capacity, 30-day start capacity, minimum spacing, observed run manifests, accepted-pass telemetry, requirement IDs seen, and QoL automations with no observed manifest. Since the May 19 burn-down adjustment, active QoL automation count should be 10 while daily active start capacity remains 10.

Scaling rules:

- Keep the 10-start/day burn-down schedule until a live audit shows the active runners can produce durable commits or exact committed blockers.
- Minimum 30-day target is 60 accepted MVP passes; stretch is 90. With 300 active scheduled starts in 30 days during burn-down mode, the system needs 20 percent accepted-pass conversion for minimum and 30 percent for stretch.
- While burn-down mode is active, the effective conversion target is higher: 60 accepted MVP passes from 300 active starts requires 20 percent conversion, and 90 requires 30 percent. If that is unrealistic, weekly calibration should lower the accepted-pass target or explicitly reactivate reserve slots after write access is fixed.
- If accepted-pass conversion is below target, retarget the next week toward implementation, tests, deployment proof, exact blockers, and high-risk requirements before adding more runs.
- If a QoL automation has no accepted evidence or exact blocker after seven days, sharpen its backlog item, prompt instructions, or handoff before changing cadence.
- If run duration or dirty-worktree collisions repeatedly exceed the 48-minute start spacing, reduce collision risk by selecting non-conflicting verification slices, narrowing prompts, or recommending a schedule adjustment for Bryan.
- If blockers dominate a QoL area, the automation should commit one precise blocker with the account/tool/policy action required and then move to adjacent non-blocked evidence in its scope.
- If the project exceeds the stretch target with low collision risk, keep cadence stable and tighten acceptance quality; do not chase more starts for its own sake. Reactivate Slot 2 first, then Slot 3, only when duplicate capacity is likely to land real work.

New run manifests should include `accepted_mvp_pass`, `requirement_ids`, `duration_minutes`, `output_kind`, and `automation_efficiency.scale_signal` so the weekly source-framework/catalog runner can retarget from evidence instead of guessing. `scripts/check-automation-contract.ps1` enforces those fields for manifests at or after the 2026-05-18 14:47 PT efficiency-audit cutoff.

## Surface Expansion Rule

Every QoL run should treat the selected requirement as a cross-surface product slice. Before closeout, decide which of these surfaces need work or proof:

- App code, routes, D1 schema, data models, and server-side authorization.
- Cloudflare Pages, D1 bindings, environment/secrets, deploy proof, and exact Cloudflare/Wrangler blockers.
- Figma route/data/permission handoff and state/component annotations.
- Canva support assets only when they serve a real app placement and preserve privacy/live-text discipline.
- Tests, CI, browser/mobile smoke checks, and no-secret/no-real-student-data checks.
- Docs, artifacts, handoffs, requirement catalog status, and run manifests.

Do not mark a requirement as complete because one surface improved. A requirement should move toward `mvp ready` only when all required surfaces have evidence or a precise committed blocker.

## Autonomous Loop Contract

The automation system has three durable control surfaces:

- Master planner: `docs/master-plan.md`. Every run reads it first, names the section that justifies the selected slice, and updates it only when evidence shows the destination, source order, milestone path, or anti-drift rules are stale.
- Pass logger: `docs/progress/run-log.md` plus one structured JSON manifest in `docs/progress/runs/` and the relevant lane/report log. Every productive run writes all three layers so the next run can continue without relying on chat history.
- Self-patching contract: the live automation prompt, `docs/automation-prompts/`, `scripts/snapshot-automation-prompts.ps1`, and `scripts/check-automation-contract.ps1`. When a run changes the automation operating contract, it must update the relevant prompt or support script in the same pass, regenerate snapshots when live prompts changed, run the checker, log the evidence, commit, and push.

The loop should be able to run repeatedly: planner -> bounded work -> pass logger -> self-review -> narrow prompt/script patch when evidence justifies it -> validation -> commit/push.

## Required Source Materials

The app framework now includes the four source PDFs the school uses to run the Senior Project cycle.

Every lane should treat these as product requirements, not optional reference notes:

- `data/capstone-framework.json`
- `docs/curriculum-framework-integration.md`
- `docs/source-materials/extraction-manifest.json`
- `docs/source-materials/research-proposal-challenge.txt`
- `docs/source-materials/senior-project-cycle-linked-document.txt`
- `docs/source-materials/senior-guide.txt`
- `docs/source-materials/mentor-teacher-guide.txt`

The key translation is: old instructions to copy, link, email, or save documents become app-native requirements, private evidence artifacts, guided submission sections, review gates, dashboard signals, and export/archive workflows.

## App End Goal

The final product is a hosted application, not a static website, loose documentation set, or collection of visuals. The revised MVP is a secure database-backed app with account/group management, progress updates, role-aware dashboards, private evidence, audit logs, and Cloudflare deployment.

The app must support:

- Secure user accounts with usernames/passwords or a managed-auth equivalent.
- User groups, cohorts, and admin-managed role assignments.
- Role-based permissions for students, mentors, program teachers, administrators, and miscellaneous admin/support users.
- Private student upload/evidence spaces for documents, images, links, reflections, artifacts, forms, and phase deliverables.
- Student submissions, revisions, resubmissions, comments, and status history.
- Database-backed progress updates that students and staff can trust.
- Mentor and teacher review flows for approving or rejecting phase progress.
- Mentor meeting attendance, make-up, outline approval, and presentation scheduling flows.
- Presentation day check-out/check-in, rubric scoring, and celebration day evidence flows.
- Final student archive/export before district account access ends.
- Admin override and escalation flows with audit records.
- Announcement publishing for staff/admin updates.
- Dashboards for students, mentors, teachers, program leads, and administrators.
- Filters and reporting by program, cohort, phase, mentor, teacher, status, overdue state, and risk.
- Program-specific requirements for IT, Culinary, Hospitality & Marketing, Mechanical Technology, Construction, Sports Medicine, Teaching & Training, Early Childhood Education, and Medical Professions.
- Privacy-conscious handling of student records, uploads, exports, audit logs, and staff-only notes.
- GitHub-connected Cloudflare Workers/Pages hosting with a future custom domain purchased by Bryan.

Static content, Canva assets, Figma files, templates, and printable materials are supporting assets only. They must make the app clearer and more useful, but they are not the product by themselves. Figma should heavily drive functional design and state coverage, but must not be treated as the production account system, database, evidence store, audit log, or dashboard source of truth. Canva should heavily support stunning imagery with clear placement, live-text discipline, and no private data baked into images.

## Required Programs

Every lane must keep these programs explicit:

- IT
- Culinary
- Hospitality & Marketing
- Mechanical Technology
- Construction
- Sports Medicine
- Teaching & Training
- Early Childhood Education
- Medical Professions

## Work Selection

Each run chooses exactly one bounded scope.

## Daily Goal And Weekly Calibration

For this Senior Capstone project only, the current 100-pass / roughly 45-day MVP target translates to a real daily goal of at least 2 accepted MVP passes per calendar day, with 3 accepted passes as the stretch goal when the repo is unblocked. The current 10 active QoL starts are burn-down execution capacity, with 20 paused reserve starts available only after write access and conversion recover; scheduled starts are not accepted passes.

An accepted MVP pass must leave durable evidence: a pushed commit or published external artifact recorded in the repo, plus validation or a concrete blocker that reduces MVP ambiguity. The first two accepted passes each day should usually be implementation-heavy while `SC-005` remains open.

`senior-capstone-qol-source-framework-seed` owns weekly calibration. On Sundays it must review the last seven days of run manifests, run-log entries, commits, backlog movement, handoffs, and audit findings. It should count accepted MVP passes against the minimum 2/day and 14/week goal, then update only this project's `docs/master-plan.md`, `docs/automation-memory.md`, and `docs/mvp-requirements-catalog.md` with the next week's daily goal/allocation when evidence requires adjustment.

Priority order:

1. P0/P1 items from `docs/automation-backlog.md`.
2. Secure database/auth/account-group/progress foundation and GitHub-to-Cloudflare deployment work.
3. Earliest incomplete milestone from `docs/automation-milestones.md`.
4. The lane's previous explicit next step.
5. Handoffs from the adjacent lane in the cadence.
6. The smallest useful new slice in that lane.

Do not start broad new work when a precise blocker exists.

## Log-First Scaling Protocol

The automation loop is expected to run for months, so every lane must work from durable memory instead of rediscovering context or relying on final chat text.

At the start of every run, read these logs before selecting work:

- `docs/master-plan.md`: top-level product destination, milestone path, source-of-truth order, and anti-drift rules.
- `docs/mvp-requirements-catalog.md`: category-owned MVP requirements, statuses, evidence, blockers, and acceptance checks.
- `docs/automation-memory.md`: compact current-state snapshot and source-of-truth index.
- `docs/progress/run-log.md`: cross-lane chronological run index. Read the most recent 20 entries when the file grows large.
- Your lane log:
  - Figma: `docs/progress/figma.md`
  - Core rebuild: `docs/progress/rebuild.md`
  - Audit: `docs/progress/audit.md`
  - Canva: `docs/progress/canva.md`
- Adjacent/consumer lane logs needed for handoff context.
- `docs/progress/handoffs.md`: cross-lane handoff ledger. Prioritize open handoffs assigned to your lane when they outrank ordinary milestone work.
- `docs/progress/decision-log.md`: durable product, architecture, security, data, and workflow decisions. Do not relitigate accepted decisions unless new evidence requires a superseding decision.
- `docs/automation-backlog.md`: unresolved quality/security/product issues.
- `docs/automation-self-improvement.md`: the guarded protocol for improving each automation's own prompt/config without drifting from the app goal.
- `docs/human-decisions.md`: decisions requiring Bryan's judgment or explicit acceptance.
- `docs/artifacts.json`: canonical registry of external Figma, Canva, Google, deployment, and other durable artifacts.
- `docs/progress/runs/`: recent structured run manifests when measuring automation health or repeated work.

Use this source-of-truth order when logs conflict:

1. Current repository code/data and source materials.
2. `docs/master-plan.md`.
3. Accepted architecture/product decisions in `docs/progress/decision-log.md`.
4. Open P0/P1 backlog items.
5. Open handoffs assigned to the lane.
6. `docs/automation-memory.md`.
7. Lane progress logs and run log.
8. Older rollup notes in `docs/automation-progress.md`.

At the end of every run, leave enough memory for the next lane to continue without guessing:

- Append a detailed entry to the lane progress log.
- Append a compact one-entry summary to `docs/progress/run-log.md`.
- Update `docs/master-plan.md` only when the product destination, source-of-truth order, milestone path, or anti-drift rules materially change.
- Update `docs/mvp-requirements-catalog.md` when requirement status, evidence, blocker, owner category, or acceptance checks materially change.
- Update `docs/automation-memory.md` when current milestone, active stack choice, artifact IDs, open blockers, or next-lane priorities changed.
- Update `docs/progress/handoffs.md` for every cross-lane ask, with a stable handoff ID, owner lane, status, exact next action, acceptance check, and evidence needed to close.
- Update `docs/progress/decision-log.md` only for real product, architecture, data, security, workflow, or visual-system decisions that future runs should respect.
- Update `docs/automation-backlog.md` for unresolved P0/P1/P2 issues.
- Create a structured run manifest in `docs/progress/runs/` for every productive run.
- Update `docs/artifacts.json` whenever creating, superseding, verifying, or consuming a durable external artifact.
- Update `docs/human-decisions.md` when a decision needs Bryan's judgment, account access, provisioning, budget, privacy approval, or school-operation confirmation.
- Run the self-improvement closeout from `docs/automation-self-improvement.md`: record `self-improvement: none` when no prompt/config/script change is justified, or update only the automation's own prompt/config plus the smallest relevant project script with evidence and a log entry when a narrow change is justified.
- If a script/checker/snapshot/manifest failure is reproducible and repairable inside the repo, patch it before ordinary product work or record a compact blocker with the exact command, error, suspected file, and next action.
- If a live automation prompt/config changed, run `scripts/snapshot-automation-prompts.ps1`, then run `scripts/check-automation-contract.ps1`, and commit the updated prompt snapshots.
- If the master planner, pass logger, or self-patching contract changed, update `scripts/check-automation-contract.ps1` in the same pass when the checker needs to enforce the new rule.

Do not make vague log entries such as "made improvements." Every log entry should name files, artifacts, checks, decisions, blockers, and the next specific action.

When logs become large, do not delete history. Add or refresh a concise summary in `docs/automation-memory.md`, then continue appending detailed entries to the lane logs.

Loop prevention:

- Read the last two entries in your lane log before selecting work.
- Do not repeat the same scope unless you are closing a specific backlog item with new evidence.
- If the same finding/slice appears repeatedly, either resolve it, block it with a clear reason, or escalate it in the backlog with a better owner and next action.

## Backlog Format

Use stable IDs:

```text
SC-001
```

Each unresolved item should include:

- `id`
- `severity`: P0, P1, P2, or P3
- `owner`: figma, rebuild, audit, canva, or human
- `status`: open, in-progress, blocked, resolved
- `source`
- `affected area`
- `evidence`
- `next action`
- `last updated`

The audit automation owns backlog hygiene. Other lanes may update items they resolve, but should not casually reprioritize unrelated items.

When selecting a backlog item:

- Mark it `in-progress` when safe.
- Close it as `resolved` only with evidence.
- Mark it `blocked` only with a concrete blocker and next action.
- Avoid creating duplicate backlog items for the same issue.

## Definition Of Done

Every run should end with:

- One bounded scope completed or honestly blocked.
- A concrete artifact, patch, spec, audit, validation, or tool-created design.
- Validation appropriate to the files changed.
- A lane progress entry.
- A structured run manifest in `docs/progress/runs/`.
- A handoff packet when another lane needs to act.
- Backlog updated when relevant.
- Artifact registry updated when an external artifact was created, superseded, consumed, or verified.
- Human decision queue updated when Bryan needs to decide.
- Publication/commit gate satisfied.
- Only own files staged.
- Lane-prefixed commit when repo files changed.
- Current branch pushed, or exact blocker committed and pushed.

## Publication And Commit Gate

Every automation run must leave durable, discoverable evidence of what happened. A run is not done just because it created something in memory, generated a local file, or received a tool response.

Each run must end in exactly one of these durable outcomes:

1. A pushed repo commit containing the code, docs, data, tests, specs, logs, or assets changed by that run.
2. A published external artifact, such as a Figma or Canva artifact, with its returned link or ID recorded in a committed and pushed repo handoff file.
3. A committed and pushed blocker entry that explains why publication, artifact creation, commit, or push could not be completed.

For this project, local-only repo changes are not an acceptable closeout. If repo files changed, the automation must validate, inspect `git status --short`, stage only current-run files, commit with the lane prefix, and push. If the first push is rejected, fetch/rebase once on a clean worktree and retry. Never force push.

External artifacts count only when:

- The tool returned a stable link or ID.
- The lane progress log records that link or ID.
- `docs/artifacts.json` records or updates the artifact when it is durable and expected to be referenced later.
- Any implementation handoff is committed to the repo, such as a Figma spec, Canva asset registry entry, audit finding, or rebuild integration note.
- The final response names the artifact/link/ID and commit/push status.

Repo changes count only when:

- The automation staged only files it created or intentionally modified.
- The commit message uses the correct lane prefix.
- The branch was pushed successfully, or a precise push blocker was committed/logged.

Before ending, each automation must run or otherwise inspect `git status --short`. The worktree should be clean for the automation's own work. If dirty files remain, the run must classify them as unrelated user/other-automation changes or log exactly why its own changes could not be committed.

No silent outputs:

- Do not leave generated files untracked.
- Do not leave local-only specs, screenshots, exports, or reports outside the repo unless they are explicitly temporary and logged.
- Do not claim a Figma, Canva, Google Doc, deployed preview, or exported asset exists unless a tool returned a link/ID or the repo contains the artifact.
- Do not rely on final-chat text as the only record of a lane's work.
- If no repo files changed, say why. This should be rare because every productive run should at least update its lane progress log.

## Anti-Patterns

Avoid:

- Placeholder-only docs.
- Prompt/config churn without evidence or outside `docs/automation-self-improvement.md`.
- Editing another lane's live prompt/config without an explicit human request.
- Changing live prompts without updating `docs/automation-prompts/` snapshots.
- Creating external artifacts without updating `docs/artifacts.json`.
- Burying account, budget, privacy, or stack decisions in narrative logs instead of `docs/human-decisions.md`.
- Skipping structured run manifests, which makes automation health impossible to measure.
- Repeating the same broad audit without closing a finding.
- Inventing dashboards from client state.
- Claiming the MVP exists before users, groups, permissions, progress, and audit events persist in a secure database.
- Treating a Cloudflare static deploy as sufficient without the database/security foundation.
- Treating Figma prototype state, Figma variables, plugin storage, or local browser state as production accounts, records, private evidence, audit logs, or dashboard data.
- Creating visual assets with no app placement.
- Creating UI specs with no data or permission mapping.
- Treating `localStorage`, static files, or public assets as final storage for student records, submissions, approvals, uploads, or staff notes.
- Ignoring upload/evidence ownership, privacy, metadata, virus/security posture, size/type constraints, failure states, or retention questions.
- Rebuilding the PDF linked-document workflow as a static checklist instead of turning it into app-native submissions, evidence, review gates, and dashboards.
- Creating code without tests when behavior changes.
- Writing important app text only inside images.
- Adding student-to-student messaging, chat, or social feeds. Version 2.0 may include notifications and announcements, but no student messaging.
- Starting iOS/Android implementation before MVP 1.0 database, security, deployment, and admin-preview foundations are real.
- Creating external Figma/Canva/Google artifacts without committing the link or ID into the repo handoff/progress records.
- Ending with untracked or unstaged files from the automation's own work.
- Staging unrelated dirty files.
- Force pushing.

## Handoff Packet

Every lane should include a handoff packet when another lane needs to act.

Required fields:

- Consumer lane.
- Artifact, file, spec, asset, or backlog ID.
- Exact next action.
- Acceptance check.
- Known limits or risks.

Examples:

- Figma to rebuild: component spec path, data fields, states, and acceptance check.
- Rebuild to audit: files changed, command to run, expected result, and risk area.
- Audit to Figma: finding ID, affected screen/spec, and acceptance check.
- Canva to rebuild: asset/spec path, intended filename/location, dimensions, alt text, and placement.

## Lane Outputs

Figma:
- App shell specs.
- Screen specs.
- Admin preview and account/group management specs.
- Component inventory.
- State and interaction specs.
- Upload/evidence flow specs.
- Permission and role-state specs.
- Database-backed progress/update state specs.
- Announcement and mobile-aware pattern specs for future 2.0 planning.
- Guided research challenge and mentor-meeting flow specs.
- Figma links when tools create actual artifacts.

Core rebuild:
- Architecture decisions.
- App scaffold.
- Schema and workflow logic.
- Auth, user, role, and permission foundations.
- User groups, cohorts, account provisioning, and progress update foundations.
- Private upload/evidence storage model.
- Requirement seed loader for `data/capstone-framework.json`.
- Meeting, presentation, celebration, reflection, and archive/export workflow foundations.
- Tests.
- GitHub-to-Cloudflare CI/deployment readiness.

Audit:
- Severity-ranked findings.
- Backlog triage.
- Acceptance criteria.
- Safe content/spec patches.

Canva:
- Supporting asset specs or Canva artifacts.
- Program identity visuals.
- Phase/process visuals.
- Upload, permission, evidence, review, and revision support visuals.
- Announcement, onboarding, and dashboard empty-state image families.
- Research challenge, mentor meeting, presentation, celebration, reflection, and archive support visuals.
- Empty states, onboarding, recognition, and print/export visuals.

## Git Rules

- Pull only when the worktree is clean and fast-forward is possible.
- Stage only files changed by the current run.
- Commit prefix must match the lane:
  - `figma:`
  - `rebuild:`
  - `audit:`
  - `canva:`
- Push the current branch after committing.
- If push is rejected, attempt one safe fast-forward sync only if the post-commit worktree is clean.
- Never force push.
- If blocked, log the exact blocker in the lane progress file and commit/push that blocker log when possible.
