# Structured Run Manifests

This directory holds structured manifests for productive Senior Capstone runs.

Current automation contract:

- Active minute-0 non-Figma builder: `senior-capstone-nonfigma-mvp-builder`.
- Active minute-15 Figma-only builder: `senior-capstone-figma-product-builder-15`.
- Active minute-30 non-Figma builder: `senior-capstone-nonfigma-mvp-builder-30`.
- Active minute-45 Figma-only builder: `senior-capstone-figma-product-builder`.
- Combined cadence: one builder starts every 15 minutes, 96 scheduled builder starts/day.
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
