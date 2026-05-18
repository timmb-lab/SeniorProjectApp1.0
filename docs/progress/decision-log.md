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

- `status`: accepted
- `area`: automation cadence and beta delivery
- `decision`: Use `senior-capstone-rebuild-rebuilt`, named `Senior Capstone Beta Evolution Loop`, as the primary continuous beta-build automation. It runs every 30 minutes all day every day at minute `00` and `30`, reads the master plan and logs, chooses one bounded beta-advancing slice, updates/upgrades the project, verifies, logs, commits, and pushes until the app reaches beta.
- `reason`: Bryan explicitly asked to set up automation to continue evolving the project using the master plan and logs until beta, running every 30 minutes all day every day.
- `applies to`: `senior-capstone-rebuild-rebuilt`, automation cadence docs, automation memory, prompt snapshots, run manifests, beta delivery workflow
- `source`: user request on 2026-05-18: "Set up automation to continue evovolving this, using our master plan, and our logs, to update and upgrade this until we hit a beta -- run every 30 minutes all day everyday"
- `last updated`: 2026-05-18

### D-2026-05-18-012

- `status`: accepted
- `area`: automation cadence and conflict avoidance
- `decision`: Senior Capstone automations must not share exact scheduled start slots. Keep the primary beta loop at minute `00` and `30`; stagger specialist jobs away from those slots: Canva at `00:10`, `06:10`, `12:10`, and `18:10`; daily report at `07:40`; weekly deep audit at Sunday `23:45`; Figma at `01:15`, `07:15`, `13:15`, and `19:15`; content audit at `03:45`, `09:45`, `15:45`, and `21:45`.
- `reason`: Live review found the weekly deep audit had an active exact-start conflict with the 30-minute beta loop at Sunday `23:30`, while paused Canva and daily report schedules would conflict with the beta loop if re-enabled.
- `applies to`: all Senior Capstone automations, automation cadence docs, prompt snapshots, contract checker, and future schedule edits
- `source`: user request on 2026-05-18: "verify automations don't conflict and review all senior proejct automations"
- `last updated`: 2026-05-18 08:27 PT
