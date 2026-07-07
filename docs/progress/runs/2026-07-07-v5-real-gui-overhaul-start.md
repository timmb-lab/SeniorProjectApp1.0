# 2026-07-07 V5 Real GUI Overhaul Start

## Run Boundary

- Repository: `C:\SeniorProjectApp1.0`
- Branch: `main`
- Starting SHA: `8eeeff404ad982d06c1ea93af8a2c51fe4397671`
- `origin/main` at start: `8eeeff404ad982d06c1ea93af8a2c51fe4397671`
- START_TIME_LOCAL: `2026-07-06 20:22:33 -07:00`
- Prompt: V5 real GUI overhaul, hours-long no-abort execution prompt.
- Scope boundary: work only in `C:\SeniorProjectApp1.0`; do not touch `C:\Curriculum`.

## V5 Rule Interpretation

The run must start and continue through stable implementation slices. It may not abort just because the future runtime cannot be guaranteed.

The run may be called complete only if the final proof can honestly show:

- elapsed wall-clock minutes of at least 360,
- at least 8 meaningful implementation commits,
- at least 10 total commits including docs/proof,
- at least 18 distinct changed user-facing screens or states,
- at least 75 screenshots and at least 18 mobile screenshots,
- visible role-specific work for Student, Mentor, Program Teacher, Viewer, Administration/Site Admin, and Reports,
- required checks run or substitutions documented,
- clean git status and `HEAD...origin/main` alignment after push.

If those gates are not met when the session must stop, the correct closeout is `PARTIAL CHECKPOINT`, not a completion claim.

## Current V3 Diagnosis

V3 added a shared first-viewport start-state band and proof expectations. That is useful but too shallow for V5 because it does not substantially rebuild individual role flows.

V5 must go beyond inherited shared guidance by changing role-specific layout, hierarchy, state handling, and mobile behavior.

## Initial Backlog

- Shared shell: make role identity and flow switching more directional without a left rail.
- Student: rebuild next-step, work, feedback, final checklist, empty/caught-up, and mobile states around one action.
- Mentor: prioritize one assigned student, preview safety, assigned list, empty/all-caught-up, and mobile.
- Program Teacher: rebuild queue to work to decision flow.
- Viewer: make view-only status useful and remove edit-looking affordances.
- Administration/Site Admin: setup issue to guided fix to confirmation, including students, people, assignments, imports.
- Reports: simplify chart/report paths into readable summaries tied to actions.
- Microcopy: remove technical terms from primary UI where safe.
- Mobile/accessibility: keep first action visible, labels readable, and charts/text equivalents clear.

## Guardrails

- Preserve RBAC and server-side authorization.
- Do not claim hosted readiness unless hosted proof is rerun.
- Do not claim real-student pilot readiness unless manual/policy evidence is complete.
- Do not fake screenshots, tests, time, or proof.
- Do not delete security, data, migration, or permission logic.
