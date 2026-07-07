# 2026-07-07 V6 Until-3PM Start

## Run Boundary

- Repository: `C:\SeniorProjectApp1.0`
- Branch: `main`
- Starting SHA: `1ffd87d851dd473861e1892f7d7dfccbb94792e9`
- Origin alignment at start: `0 0`
- START_TIME_LOCAL: `2026-07-07 07:20:40 -07:00`
- START_TIME_PHOENIX: `2026-07-07 07:20:40 America/Phoenix`
- TARGET_NOT_BEFORE_TIME_LOCAL: `2026-07-07 15:00 America/Phoenix`
- Minutes until 3PM at start: `459`
- Prompt: V6 real GUI polish / product hardening run.
- Scope boundary: work only in `C:\SeniorProjectApp1.0`; do not touch `C:\Curriculum`.

## Baseline

- V5 final proof: `docs/progress/runs/2026-07-07-6h-v5-real-gui-overhaul-final-proof.md`
- V5 browser manifest: `docs/progress/runs/2026-07-07-v5-real-gui-overhaul-browser-proof.json`
- V5 screenshot index: `docs/sales/v5-real-gui-overhaul-screenshot-index.md`
- V5 screenshot folder: `docs/sales/screenshots/2026-07-07-v5-real-gui-overhaul/`
- V5 final SHA: `1ffd87d851dd473861e1892f7d7dfccbb94792e9`
- V5 proof boundary preserved: local fake-account proof only; real-student pilot remains `NO_GO_REAL_STUDENT_PILOT` / `NOT_CLAIMED_READY`.

## V6 Rule Interpretation

Before `2026-07-07 15:00 America/Phoenix`, keep doing real implementation/proof work. Do not finalize, claim done, or stop after docs, tests, screenshots, or one phase. If interrupted before 3PM, produce a `PARTIAL CHECKPOINT` and update the continuation packet.

After 3PM, finalization is allowed only if there is stable implementation work, refreshed proof/screenshots, honest final proof, clean git status, and origin alignment after push.

## Initial Backlog

- Review V5 screenshots and identify at least 25 remaining polish opportunities.
- Improve student first-action and mobile/half-width friction.
- Improve mentor assigned-student support clarity.
- Improve Program Teacher review decision speed and missing-proof guidance.
- Improve Viewer read-only usefulness.
- Improve Admin/Site Admin setup, CSV/import, assignments, reports, and audit separation.
- Improve reports/demo path clarity.
- Sweep remaining primary UI jargon where safe.
- Add safe cleanup or regression-hardening.
- Refresh V6 browser proof and screenshot index.

## Guardrails

- Preserve all RBAC and server authorization.
- Preserve Viewer read-only behavior.
- Preserve Student self-only behavior.
- Preserve Mentor assigned-student access.
- Preserve Program Teacher program access.
- Preserve Administration, Site Admin, and Global Admin boundaries.
- Preserve staff-only View as Student.
- Do not claim hosted readiness unless hosted proof is actually rerun.
- Do not claim real-student pilot readiness unless required manual/policy evidence is complete.
- Do not delete security, data, migration, or permission logic.
