# Automation Decision Log

This file records durable decisions that future automations should reference before reopening the same question. Use it for product, architecture, data, security, workflow, visual-system, or operational choices with lasting impact.

Decision status values:

- `accepted`
- `superseded`
- `proposed`
- `rejected`

## Decisions

### D-2026-05-18-001

- `status`: accepted
- `area`: automation operations
- `decision`: Use a log-first scaling protocol with a compact shared memory file, cross-lane run log, handoff ledger, decision log, lane logs, and backlog.
- `reason`: The automations are expected to run over months. They need durable memory, anti-repetition context, and handoff continuity without depending on final chat text or rereading every historical detail every run.
- `applies to`: all Senior Capstone automations
- `source`: user request to edit automations to log and reference logs for scaling
- `last updated`: 2026-05-18

### D-2026-05-18-002

- `status`: accepted
- `area`: automation operations and product planning
- `decision`: Use `docs/master-plan.md` as the top-level product plan that every Senior Capstone automation must read before selecting work.
- `reason`: The product direction was spread across rebuild, milestones, memory, domain, dashboard, and progress docs. A single master plan gives every lane one common destination while the logs preserve recent context and handoffs.
- `applies to`: all Senior Capstone automations
- `source`: user request to edit automations to reference the master plan and logs
- `last updated`: 2026-05-18

### D-2026-05-18-003

- `status`: accepted
- `area`: automation reporting
- `decision`: Send Senior Capstone daily automation summary email to `bryan.timm89@gmail.com` and target the Google Drive/Doc reporting path for `bryan.timm89@gmail.com` wherever connector permissions allow.
- `reason`: The user explicitly changed the desired Google Drive/all automation summary destination from the school email to `bryan.timm89@gmail.com`.
- `applies to`: `senior-capstone-daily-automation-report`, reporting docs, fallback report logs
- `source`: user request: "google drive/all automation summaries should be bryan.timm89@gmail.com"
- `last updated`: 2026-05-18

### D-2026-05-18-004

- `status`: accepted
- `area`: automation operations and self-improvement
- `decision`: Each Senior Capstone automation may review and improve its own live prompt/config from evidence, using `docs/automation-self-improvement.md`, while preserving schedule, workspace, model, reasoning effort, status, log requirements, commit/push requirements, and the hosted-app goal unless the user explicitly asks for a change.
- `reason`: The automation loop is expected to run over months. To scale, each lane needs a safe repair mechanism for stale instructions, missing required reads, weak logs, publication blockers, and repeated work without devolving into prompt churn.
- `applies to`: all Senior Capstone automations, including daily reporting
- `source`: user request: "the goal is self improverment as it goes... they should also update their own scripts as they go if they see room for improvement"
- `last updated`: 2026-05-18

### D-2026-05-18-005

- `status`: accepted
- `area`: automation operations and quality governance
- `decision`: Add `senior-capstone-weekly-deep-audit-rebuilt`, a Sunday `23:45 PT` automation that performs a long, severe, piece-by-piece audit of the whole Senior Capstone product and feeds durable findings into `docs/master-plan.md`, `docs/audits/weekly-deep-audit.md`, `docs/progress/weekly-deep-audit.md`, `docs/automation-memory.md`, `docs/automation-backlog.md`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, and `docs/progress/run-log.md`.
- `reason`: Weekly human check-ins need a deeper synthesis than the rotating lane jobs and daily summaries provide. The project needs an explicit quality-governance loop that finds weak spots, stale plans, fake progress, missing app foundations, and automation drift.
- `applies to`: all Senior Capstone automation lanes, weekly reporting/audit flow, master-plan upkeep, backlog and handoff governance
- `source`: user request: "A weekly automation that does a LONG LONG LONG HUGE HUGE HUGE PIECE BY PIECE BIT BY BIT AUDIT ON WHERE AND HOW IT CAN BE IMPROVED FED INTO MSATER PLAN AND THE LOGS"
- `last updated`: 2026-05-18 08:27 PT
### D-2026-05-18-006

- `status`: superseded
- `area`: product design source of truth
- `decision`: Previously treated Figma file `LLucMgAPscRa9020iHHigB` (`https://www.figma.com/design/LLucMgAPscRa9020iHHigB`) as the active Senior Capstone product UI source. This is now superseded by `D-2026-05-18-009`; `LLucMgAPscRa9020iHHigB` is reference-only until a new active writable file is created or recorded in Bryan's `Senior Project App` team/project.
- `reason`: Bryan updated the connected Figma account and requested the Figma work be regenerated. The regenerated file was created and populated successfully under the updated Figma connection, with three pages, 9 components, core app screens, metadata verification, and screenshot verification.
- `applies to`: Figma automation, rebuild automation, audit automation, Canva automation, daily report, weekly deep audit, Figma specs and handoffs
- `source`: user request: "I updated my Figma account so it's using a new one - regenerate all the Figma stuff in the new account - it has higher limits now -- and then adjust all automations accordingly"
- `last updated`: 2026-05-18 07:41 PT

### D-2026-05-18-007

- `status`: accepted
- `area`: automation operations, measurement, and quality control
- `decision`: Use prompt snapshots, structured run manifests, a human decision queue, an external artifact registry, and an automation contract-check script as core operating infrastructure for the Senior Capstone automation system.
- `reason`: Markdown lane logs are readable but not enough to prove automation work is compounding. The loop needs exact prompt snapshots, machine-readable run records, artifact tracking, explicit Bryan-level decisions, and a fail-fast contract checker.
- `applies to`: all Senior Capstone automations, weekly deep audit, daily reporting, prompt self-improvement, external artifact creation, and rebuild stack governance
- `source`: user accepted the recommendation: "prompt snapshots, structured run manifests, human decision queue, artifact registry, and the contract-check script"
- `last updated`: 2026-05-18

### D-2026-05-18-008

- `status`: accepted
- `area`: MVP scope, deployment direction, and 2.0 roadmap
- `decision`: Revise MVP 1.0 around a fully functional secure database-backed app with users, groups, roles, progress updates, private evidence, audit logs, dashboards, admin controls, announcements, and GitHub-to-Cloudflare Workers/Pages hosting. Treat Figma as the heavy product-design source and Canva as the heavy supporting-image source. Preserve iOS/Android apps with notifications and announcements as a 2.0 horizon, with no student-to-student messaging.
- `reason`: Bryan explicitly revised the minimum viable product to prioritize the secure database/account/group/progress foundation, Cloudflare hosting, Figma/Canva-heavy visuals, and a future mobile app direction.
- `applies to`: all Senior Capstone automations, master plan, milestones, backlog, stack ADR, human decisions, Figma specs, Canva specs, rebuild plans, daily reports, weekly deep audits
- `source`: user request on 2026-05-18: "A fully functional database (with a security focus) that holds all of the data, user accounts/groups, the ability to update progress... HUGE focus on using figma... canva... host this via github to cloudflare workers... 2.0 having an iOS and Android App... no messaging ever needed between students"
- `last updated`: 2026-05-18

### D-2026-05-18-009

- `status`: accepted
- `area`: Figma workspace and rate-limit routing
- `decision`: Update the Figma product-design automation to use Bryan's `Senior Project App` Figma team/project as the preferred write target: team id `1638213362346160913`, plan key `team::1638213362346160913`, URL `https://www.figma.com/files/team/1638213362346160913/all-projects?fuid=1601310066605052228`. Treat the prior regenerated file `LLucMgAPscRa9020iHHigB` as reference-only until a new active file is created or recorded in that team.
- `reason`: Bryan showed that the browser is in the `Senior Project App` Education team/project and noted the plan should have more monthly Figma MCP capacity. The MCP rate-limit errors from recent Figma writes pointed at the older team `team::1601310068697743794`, which strongly indicates the automation was still targeting the old file/team.
- `applies to`: `senior-capstone-figma-product-design-rebuilt`, Figma lane log, artifact registry, Figma specs, automation memory, and future Figma regeneration runs
- `source`: user request on 2026-05-18 with screenshot of the `Senior Project App` Figma team/project and rate-limit concern
- `last updated`: 2026-05-18

### D-2026-05-18-010

- `status`: accepted
- `area`: Figma product design source of truth
- `decision`: Treat recreated Figma file `z4t4tFPAKrMDh6pIYOeEw6` (`https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`) as the active Senior Capstone product UI source. It was created in Bryan's `Senior Project App` team/project, team id `1638213362346160913`, plan key `team::1638213362346160913`.
- `reason`: Bryan asked to move/recreate the Figma work in the new project space and continue working on it. File creation and canvas writes succeeded in the new team; subsequent rate-limit feedback pointed at the new team, confirming the automation is no longer spending calls against the older team.
- `applies to`: `senior-capstone-figma-product-design-rebuilt`, artifact registry, Figma specs, Figma lane log, rebuild handoffs, audits, daily reports, and weekly deep audits
- `source`: user request on 2026-05-18: "Now try to move/recreate the figma thing in the new project space -- and then continue working on it"
- `last updated`: 2026-05-18

### D-2026-05-18-011

- `status`: superseded
- `area`: automation cadence and beta delivery
- `decision`: Use `senior-capstone-rebuild-rebuilt`, named `Senior Capstone Beta Evolution Loop`, as the primary continuous beta-build automation. It runs every 30 minutes all day every day at minute `00` and `30`, reads the master plan and logs, chooses one bounded beta-advancing slice, updates/upgrades the project, verifies, logs, commits, and pushes until the app reaches beta.
- `reason`: Bryan explicitly asked to set up automation to continue evolving the project using the master plan and logs until beta, running every 30 minutes all day every day.
- `applies to`: `senior-capstone-rebuild-rebuilt`, automation cadence docs, automation memory, prompt snapshots, run manifests, beta delivery workflow
- `source`: user request on 2026-05-18: "Set up automation to continue evovolving this, using our master plan, and our logs, to update and upgrade this until we hit a beta -- run every 30 minutes all day everyday"
- `last updated`: 2026-05-18

### D-2026-05-18-012

- `status`: superseded
- `area`: automation cadence and conflict avoidance
- `decision`: Senior Capstone automations must not share exact scheduled start slots. Keep the primary beta loop at minute `00` and `30`; stagger specialist jobs away from those slots: Canva at `00:10`, `06:10`, `12:10`, and `18:10`; daily report at `07:40`; weekly deep audit at Sunday `23:45`; Figma at `01:15`, `07:15`, `13:15`, and `19:15`; content audit at `03:45`, `09:45`, `15:45`, and `21:45`.
- `reason`: Live review found the weekly deep audit had an active exact-start conflict with the 30-minute beta loop at Sunday `23:30`, while paused Canva and daily report schedules would conflict with the beta loop if re-enabled.
- `applies to`: all Senior Capstone automations, automation cadence docs, prompt snapshots, contract checker, and future schedule edits
- `source`: user request on 2026-05-18: "verify automations don't conflict and review all senior proejct automations"
- `last updated`: 2026-05-18 08:27 PT

### D-2026-05-18-013

- `status`: accepted
- `area`: automation cadence, no-intervention operations, and beta delivery
- `decision`: Replace the Senior Capstone every-30-minute beta loop with one active 5x/day gold-standard orchestrator named `Senior Capstone Gold Standard Orchestrator`. It runs at `00:20`, `05:20`, `10:20`, `15:20`, and `20:20` PT. Specialist Figma, Canva, content-audit, and daily-report automations are intentionally paused standby records; weekly deep audit remains active Sundays at `23:45`.
- `reason`: Bryan asked to correct the automation system to the gold standard after reviewing whether it was running 5x/day, logging, laddering, using a master file, self-improving scripts, and avoiding intervention.
- `applies to`: all Senior Capstone automations, automation cadence docs, automation memory, prompt snapshots, run manifests, contract checker, and daily reporting
- `source`: user request on 2026-05-18: "Make the changes necessary to correct to get to the gold standard"
- `last updated`: 2026-05-18 09:01 PT

### D-2026-05-18-014

- `status`: accepted
- `area`: Cloudflare production stack, secure users, database, private uploads, and deployment
- `decision`: Accept `HD-2026-05-18-001` and ADR-0001 as the default implementation path: TypeScript app deployed from GitHub to Cloudflare Workers/Pages, Cloudflare D1 or Cloudflare-compatible database, Cloudflare R2 or access-controlled private evidence storage, Workers-compatible managed auth or school-approved SSO, server-side authorization, and audit logging.
- `reason`: The gold-standard no-intervention request authorizes the automation to stop waiting on the recommended stack decision and proceed with the safe default unless implementation evidence requires a superseding ADR.
- `applies to`: rebuild lane, stack ADR, master plan, automation memory, backlog item `SC-005`, and future Cloudflare scaffold work
- `source`: user request on 2026-05-18: "Make the changes necessary to correct to get to the gold standard"
- `last updated`: 2026-05-18 09:01 PT

### D-2026-05-18-015

- `status`: accepted
- `area`: Figma verification, product design source of truth, and delivery constraint
- `decision`: Bryan's professional-plan Figma upgrade unblocked active-file verification and writing. Continue treating `z4t4tFPAKrMDh6pIYOeEw6` as the active Figma product UI source, with new node `18:2` as the 100-pass MVP execution map and route/data/permission contract. Use Bryan's 100-pass-or-less, roughly 45-day MVP target as a delivery constraint without changing the gold-standard orchestrator cadence, workspace, model, reasoning effort, or status.
- `reason`: Metadata, screenshots, library discovery, design-system search, read-only inspection, and canvas writing all succeeded against the active file after the plan upgrade.
- `applies to`: active Figma file, Figma specs, rebuild handoffs, artifact registry, master plan, milestones, run manifests, and gold-standard orchestrator work selection
- `source`: user request on 2026-05-18: "I updated the pklan to a professional one so can we try all the figma calls again and get it caught up? I want you to really really dial in to get to a MVP in 100 passes or less over the next 45 days or so"
- `last updated`: 2026-05-18 09:06 PT

### D-2026-05-18-016

- `status`: accepted
- `area`: automation publication and project-script auto-approval
- `decision`: Senior Capstone automations must not leave project repo changes local-only. When repo files change, each run must validate, inspect `git status --short`, stage only current-run files, commit with the lane prefix, and push. Project scripts must run unattended with non-interactive execution flags and must not include interactive approval prompts such as `Read-Host`, `PromptForChoice`, `Pause`, or ad hoc confirmation gates.
- `reason`: Bryan explicitly asked to commit and push all changes and ensure automations always do this for the project, with auto approvals for script items.
- `applies to`: live Senior Capstone automation prompts, `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, prompt snapshots, `scripts/check-automation-contract.ps1`, and `scripts/snapshot-automation-prompts.ps1`
- `source`: user request on 2026-05-18: "commit and push all changes - ensure automation also always does this related to this proejct as well as auto approvals on all items in scripots"
- `last updated`: 2026-05-18 09:23 PT

### D-2026-05-18-017

- `status`: accepted
- `area`: 100-pass delivery management and weekly project-only goal calibration
- `decision`: Use a real daily delivery target of at least 2 accepted MVP passes per calendar day, with 3 as the stretch goal when the repo is unblocked, and at least 14 accepted MVP passes per week. The weekly deep audit automation must review the prior seven days of committed evidence and adjust only this project's next-week daily goal/allocation in `docs/master-plan.md` and `docs/automation-memory.md` when evidence requires it.
- `reason`: Bryan clarified that the 100-pass plan needs a realistic daily goal and a weekly automation loop to audit and recalibrate goals. The 5x/day orchestrator schedule is capacity; the delivery target is accepted MVP evidence, not five counted passes every day.
- `applies to`: `docs/master-plan.md`, `docs/automation-memory.md`, `docs/automation-runbook.md`, `docs/automation-cadence.md`, `docs/automation-self-improvement.md`, `senior-capstone-weekly-deep-audit-rebuilt`, prompt snapshots, and `scripts/check-automation-contract.ps1`
- `source`: user request on 2026-05-18: "update the master 100 pass master plan to reflect a REAL daily goal and then automation to review audit and adjust those goals weekly (only in this project)"
- `last updated`: 2026-05-18 10:27 PT

### D-2026-05-18-018

- `status`: accepted
- `area`: MVP backend boundary, Figma scope, and foundation setup
- `decision`: Treat real user accounts, persistent data, private evidence storage, server-side authorization, migrations, deployment config, and permission tests as MVP foundation setup work. Figma may design and prototype those flows, but it must not own production accounts, records, evidence files, audit logs, or dashboard source data.
- `reason`: Bryan confirmed that the account/data pieces belong in the MVP after asking whether Figma could handle accounts and data. The product needs a separate application/backend foundation before it can safely manage student records.
- `applies to`: master plan, rebuild lane, Figma lane, backlog item `SC-005`, ADR-0001, future app scaffold work, dashboards, evidence uploads, and automation audits
- `source`: user request on 2026-05-18: "Okay, let's start getting those pieces set up - as that would be part of the MVP. Updat the MVP master plan accordingly."
- `last updated`: 2026-05-18

### D-2026-05-18-019

- `status`: accepted
- `area`: MVP auth, Cloudflare provisioning, and evidence storage
- `decision`: Use hardened app-owned username/password auth for the MVP pilot because district SSO is not available, provision the first Cloudflare Pages + D1 foundation in Bryan's authorized Cloudflare account, and use Google Drive as the MVP evidence repository path.
- `reason`: Bryan authorized the Cloudflare account work and clarified that the app cannot connect to district SSO; uploads must use a Google Drive repository. R2 is not enabled in the Cloudflare account and is no longer the MVP upload blocker.
- `applies to`: master plan, ADR-0001, `SC-005`, auth/session scaffold, D1 migrations, Google Drive evidence repository, deployment config, human decision queue, and future permission/upload tests
- `implementation evidence`: Cloudflare Pages project `senior-capstone-app`, D1 database `senior-capstone-db` (`3141d9ac-08b7-49c1-92ba-bbf50c1a611f`), migration `migrations/0001_foundation.sql`, and Google Drive evidence index sheet `1b446rp3oyx9G4LpKYE47qXxpU41EOW-2Ota2fGum49c` were created or configured on 2026-05-18.
- `remaining setup`: set `BOOTSTRAP_SETUP_KEY`, bootstrap the first admin, implement Drive upload credentials/OAuth, and add permission/workflow tests before real student data is entered. `PASSWORD_PEPPER`, `SESSION_PEPPER`, and the Google Drive root folder ID are already set in Cloudflare Pages.
- `source`: user request on 2026-05-18: "You are authorized in cloudflare, can you do all this for me? We need hardned Un?pw as we can't connect to district SSO -- uploads need to have google drive repo"
- `last updated`: 2026-05-18

### D-2026-05-18-020

- `status`: accepted
- `area`: Figma prototype operations and automation cadence
- `decision`: Keep an active once-daily automation, `senior-capstone-daily-guided-prototype-refresh`, that updates the active Figma file page `04 Guided Daily Prototype` at `22:10 PT` from that day's actual progress, blockers, and next ladder position.
- `reason`: Bryan asked for a multi-page guided prototype updated now and baked into automation once per day so the prototype keeps reflecting daily project progress and laddering.
- `applies to`: Figma artifact `z4t4tFPAKrMDh6pIYOeEw6`, automation cadence docs, automation memory, prompt snapshots, contract checker, Figma lane log, and future rebuild handoffs that consume daily prototype annotations.
- `guardrail`: The guided prototype may explain account, data, evidence, and workflow states, but it must not contain real credentials, private student records, production evidence files, or be treated as the production account/data source.
- `implementation evidence`: Figma page `04 Guided Daily Prototype` was created in file `z4t4tFPAKrMDh6pIYOeEw6` with frames `75:3`, `75:34`, `75:65`, `75:96`, `75:127`, and `75:158`; the live automation was created with RRULE `FREQ=DAILY;BYHOUR=22;BYMINUTE=10`.
- `source`: user request on 2026-05-18: "I want a multip page guided protto type updated now and then bake into automation that it is running once per day to update prototype from that days' progress and laddering"
- `last updated`: 2026-05-18

### D-2026-05-18-021

- `status`: accepted
- `area`: alpha scope, deadline, and account exception
- `decision`: Treat the Day 7 target as a full app-flow alpha due end of day Sunday, 2026-05-24 PT, counting Monday, 2026-05-18 as Day 1. Production user accounts do not need to work for this alpha; use seeded/demo personas or a clearly labeled role switcher so all student, teacher, mentor, admin, misc-admin, proposal, evidence, review, revision, dashboard, audit/activity, export/archive, mobile, and error/permission flows can be walked through.
- `reason`: Bryan explicitly clarified that by Day 7 he needs a full-fledged alpha without working user accounts, but all app flow should work.
- `applies to`: `docs/master-plan.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, `SC-006`, rebuild lane work selection, daily guided prototype refresh, and future alpha QA/runbook work.
- `guardrail`: Do not call the alpha pilot-ready or safe for real student records while production login, first-admin bootstrap, account lifecycle, Google Drive upload credentials, and hardened authorization tests are incomplete.
- `source`: user request on 2026-05-18: "by day 7 I need a full flredged alpha (w/o user accounts working)_ but all app flow should work"
- `last updated`: 2026-05-18 11:26 PT

### D-2026-05-18-022

- `status`: accepted
- `area`: MVP evidence storage and Google Drive repository setup
- `decision`: Use Google Drive folder `1XPgYKbIMqv332DAJZJNJetHppFB670e7` (`Senior Project App`) as the MVP evidence repository root.
- `reason`: Bryan provided the Google Drive repository folder link to use for uploads/evidence, closing the open root-folder selection blocker.
- `applies to`: master plan, backend setup, `wrangler.jsonc`, `.dev.vars.example`, D1 `evidence_repositories`, Cloudflare Pages environment variables, artifact registry, backlog, handoffs, and future Drive upload/access tests
- `implementation evidence`: Google Drive metadata verified folder id `1XPgYKbIMqv332DAJZJNJetHppFB670e7` as a Drive folder titled `Senior Project App`; folder listing returned successfully; Cloudflare Pages preview and production now set `GOOGLE_DRIVE_EVIDENCE_ROOT_ID`; D1 row `default-google-drive` now has the root folder id and `active` status.
- `remaining setup`: Add the server-side Google Drive upload credential/OAuth path, protected retrieval/access behavior, permission tests, `BOOTSTRAP_SETUP_KEY`, and first-admin bootstrap before real student evidence or records are entered.
- `source`: Bryan provided `https://drive.google.com/drive/folders/1XPgYKbIMqv332DAJZJNJetHppFB670e7?usp=drive_link` on 2026-05-18.
- `last updated`: 2026-05-18 11:32 PT
