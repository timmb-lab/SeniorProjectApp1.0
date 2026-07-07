# Structured Run Manifests

This directory holds structured manifests for productive Senior Capstone runs.

Current proof reports:

- `2026-07-07-v3-gui-overhaul-browser-proof.json` is the local fake-account screenshot manifest for the 2026-07-07 V3 GUI overhaul pass.
- `2026-07-07-12h-v3-gui-overhaul-final-proof.md` is the final proof/status report for the 2026-07-07 V3 GUI overhaul pass.
- `2026-07-05-yuge-max-final-proof.md` is the final proof/status report for the 2026-07-05 YUGE MAX round.
- `2026-07-05-student-ready-final-proof.md` is the student-ready pilot closure proof/status report.
- `2026-07-06-admin-console-overhaul-final-proof.md` is the final proof/status report for the 2026-07-06 admin console overhaul.
- `2026-07-06-admin-console-overhaul-browser-proof.json` is the local fake-account screenshot manifest for the 2026-07-06 admin console overhaul.
- `2026-06-30-workspace-ui-polish-browser-proof.json` is the current local fake-account screenshot manifest.
- `2026-06-29-hosted-fake-pilot-browser-proof.json` is the current hosted fake-account browser screenshot manifest.

These proof artifacts stay separate from real-student pilot approval. Fake-account proof can be green while the real-student pilot remains NO-GO.

Current automation contract:

- Active automation: Functionality UX Upgrade (`functionality-ux-upgrade-hourly`).
- Verifier: `npm run verify:functionality-ux-automation`.

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

Do not add manifests for any other Senior Capstone automation unless Bryan explicitly asks for it.
