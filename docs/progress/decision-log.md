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
