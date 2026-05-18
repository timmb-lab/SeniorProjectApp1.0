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
- `decision`: Each Senior Capstone automation may review and improve its own live prompt/config from evidence, using `docs/automation-self-improvement.md`, while preserving schedule, workspace, model, reasoning effort, active status, log requirements, commit/push requirements, and the hosted-app goal unless the user explicitly asks for a change.
- `reason`: The automation loop is expected to run over months. To scale, each lane needs a safe repair mechanism for stale instructions, missing required reads, weak logs, publication blockers, and repeated work without devolving into prompt churn.
- `applies to`: all Senior Capstone automations, including daily reporting
- `source`: user request: "the goal is self improverment as it goes... they should also update their own scripts as they go if they see room for improvement"
- `last updated`: 2026-05-18

### D-2026-05-18-005

- `status`: accepted
- `area`: automation operations and quality governance
- `decision`: Add `senior-capstone-weekly-deep-audit`, a Sunday `23:30 PT` automation that performs a long, severe, piece-by-piece audit of the whole Senior Capstone product and feeds durable findings into `docs/master-plan.md`, `docs/audits/weekly-deep-audit.md`, `docs/progress/weekly-deep-audit.md`, `docs/automation-memory.md`, `docs/automation-backlog.md`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, and `docs/progress/run-log.md`.
- `reason`: Weekly human check-ins need a deeper synthesis than the rotating lane jobs and daily summaries provide. The project needs an explicit quality-governance loop that finds weak spots, stale plans, fake progress, missing app foundations, and automation drift.
- `applies to`: all Senior Capstone automation lanes, weekly reporting/audit flow, master-plan upkeep, backlog and handoff governance
- `source`: user request: "A weekly automation that does a LONG LONG LONG HUGE HUGE HUGE PIECE BY PIECE BIT BY BIT AUDIT ON WHERE AND HOW IT CAN BE IMPROVED FED INTO MSATER PLAN AND THE LOGS"
- `last updated`: 2026-05-18

### D-2026-05-18-006

- `status`: accepted
- `area`: product design source of truth
- `decision`: Treat Figma file `LLucMgAPscRa9020iHHigB` (`https://www.figma.com/design/LLucMgAPscRa9020iHHigB`) as the active Senior Capstone product UI source. The previous Figma file `fkfNI9JNy0A3Rm8KnoxJLj` is superseded historical context because canvas writing was blocked by the old Figma Starter MCP tool-call limit.
- `reason`: Bryan updated the connected Figma account and requested the Figma work be regenerated. The regenerated file was created and populated successfully under the updated Figma connection, with three pages, 9 components, core app screens, metadata verification, and screenshot verification.
- `applies to`: Figma automation, rebuild automation, audit automation, Canva automation, daily report, weekly deep audit, Figma specs and handoffs
- `source`: user request: "I updated my Figma account so it's using a new one - regenerate all the Figma stuff in the new account - it has higher limits now -- and then adjust all automations accordingly"
- `last updated`: 2026-05-18
