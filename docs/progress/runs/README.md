# Structured Run Manifests

This directory holds structured manifests for productive Senior Capstone runs.

Current automation contract:

- Active GUI automation: `senior-capstone-hourly-qol-orchestrator`.
- Cadence: every 30 minutes.
- Verifier: `scripts/verify-cadence-30min.ps1`.

Future manifests should name:

- `run_id`
- `timestamp`
- `automation_id`
- `master_plan_section`
- `requirement_ids`
- `accepted_mvp_pass`
- `changed_files`
- `verification`
- `blockers`
- `commit`
- `self_improvement`

Do not add manifests for any other Senior Capstone project automation.
