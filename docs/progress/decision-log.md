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
