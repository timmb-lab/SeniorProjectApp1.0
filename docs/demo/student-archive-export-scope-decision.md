# Student Archive Export Scope Decision

Status: **FUTURE PILOT ITEM for first real-student pilot unless explicitly approved.**

Decision: exclude student archive manifest download from the first real-student pilot by default. The app can keep final-file/archive readiness visible, but `student_archive_manifest_download` is not required for the first pilot unless the pilot owner and privacy/retention owner put archive handoff in scope.

## Why This Is Deferred

- Archive/export touches retention, handoff, storage ownership, and download permissions.
- The first pilot can test daily capstone workflow without archive handoff.
- The hosted proof currently treats `student_archive_manifest_download` as skipped/not-ready and `FUTURE_PILOT_ITEM`.
- A real archive handoff needs policy approval, retention rules, and hosted proof that the download is scoped and redacted.

## Current Workaround

For the first pilot, use one of these approved alternatives:

1. Exclude archive/download entirely and keep final-file status as informational.
2. Use the school's existing approved records process outside the app.
3. Keep staff-only final-file checks in the app while deferring student archive download.

Do not claim archive download is ready unless the evidence manifest exists.

## If Archive Is Added To Pilot Scope

Before changing the decision, complete:

1. Privacy/retention owner approval.
2. Pilot owner approval that archive handoff is in scope.
3. Hosted proof that `student_archive_manifest_download` passes.
4. Role-scope proof for student-own and staff-scoped archive access.
5. No raw Drive IDs, storage IDs, tokens, private URLs, setup passwords, or credentials in manifest/download responses.
6. Audit proof for generated, denied, missing, expired, provider-unavailable, and downloaded paths.
7. Support instructions for missing/expired archive artifacts.
8. Evidence manifest at `docs/progress/runs/real-student-pilot-archive-download-evidence.json`.

## Required Tests If Implemented

- Student can download only their own archive manifest.
- Assigned staff/admin access respects the role matrix.
- Unauthorized users receive safe denial.
- Manifest fields are allowlisted.
- Storage identifiers and secrets are redacted.
- Audit events are written without leaking private data.

## Current Readiness Gate

`npm run check:pilot-readiness` should continue to report archive/download as `FUTURE_PILOT_ITEM` unless the first pilot includes archive handoff and the evidence manifest exists.

## Current Recommendation

Keep archive/download out of the first real-student pilot. Revisit after the school approves retention, archive handoff, support ownership, and scoped hosted proof.
