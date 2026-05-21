# Structured Run Manifests

This directory holds structured manifests for productive Senior Capstone runs.

Current automation contract:

- Active top-of-hour non-Figma builder: `senior-capstone-nonfigma-mvp-builder`.
- Active bottom-of-hour non-Figma builder: `senior-capstone-nonfigma-mvp-builder-bottom`.
- Active top-of-hour Figma-only builder: `senior-capstone-figma-product-builder-top`.
- Active bottom-of-hour Figma-only builder: `senior-capstone-figma-product-builder`.
- Combined cadence: both lanes run at minute 0 and minute 30 PT, 96 scheduled builder starts/day.
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

Do not add manifests for any other Senior Capstone builder automation. Daily and weekly oversight may create report/audit records, but they do not add builder capacity.
