# Student-Facing Copy Audit - 2026-07-05

Purpose: track student-facing wording risks for ESL students and lower-reading-level students. This audit focuses on normal student screens in `workspace.js`: Today, My Work, Feedback, Final Checklist, Proof Files, Presentation, Final Files, empty states, error/recovery states, and staff View as Student preview.

The target pattern is:

1. What happened?
2. What should I do next?
3. Who can help?

## Summary

- Student navigation remains: Today, My Work, Feedback, Final Checklist.
- Staff/Admin terms remain allowed in staff/admin screens, tests, and docs where they name real operating concepts.
- Student screens now use student-only status labels through `studentStatusText()` and `studentStatusPill()` instead of the global staff/admin labels.
- Real-student readiness wording remains outside normal student UI; fake/pilot/proof-script language must not appear in student screens.

## Inventory

| Current phrase | File | Screen | Classification | Problem | Replacement or decision | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Submitted | `workspace.js` | Student status pills, current step, sent work, proof rows | Needs simpler wording | Students read this as a database status, not a next step. | `Turned in` for student status labels; `Waiting for review` where the Program Teacher owns the next decision. | Fixed |
| Submitted Work | `workspace.js` | My Work | Needs simpler wording | Sounds formal and staff-centered. | `Work You Turned In`. | Fixed |
| Needs revision | `workspace.js` | Student filters, feedback, status cards | Needs simpler wording | "Revision" is harder than needed and can feel formal. | `Needs changes`, `work to fix`, or `send your updated work`. | Fixed for student surfaces |
| Send revision | `workspace.js` | Student action buttons and send-path cards | Needs simpler wording | Short but jargon-like for ESL/lower-reading-level students. | `Send updated work`. | Fixed |
| Evidence / Files | `workspace.js` | My Work proof section | Needs simpler wording | "Evidence" can be school vocabulary, but "Proof files" is clearer in the app UI. | `Proof Files`; keep "evidence" only in staff/admin or API/source contexts. | Fixed |
| No evidence has been uploaded yet | `workspace.js` | Final Checklist | Needs simpler wording | Uses passive voice and "evidence." | `No proof files have been uploaded yet.` | Fixed |
| Pending / pending review | `workspace.js` | Student status pills | Needs simpler wording | Vague for students. | `Waiting for review` or `Not confirmed yet`, depending on context. | Fixed through student status helper |
| Complete | `workspace.js` | Final Checklist | Needs simpler wording | "Complete" can overclaim if the app only has partial proof. | `Done` only when the row is actually complete; unknown remains `Not confirmed yet`. | Fixed through checklist display helper |
| Staff Workspace / Admin Console | `workspace.js` and tests | Student navigation and denied states | Staff-only wording in student UI | Students should not see staff/admin surface names in normal My Capstone. | Test guard rejects these in rendered student surfaces. | Guarded |
| RBAC, mutation, hydration, manifest, fake pilot, proof script | Tests/source policy | Student surfaces | Technical/debug wording | These terms expose implementation or proof language. | New test helper rejects them from rendered student surfaces. | Guarded |
| View as Student | `workspace.js` | Staff preview banner | Staff-only wording in staff UI | Needed for staff only; must not appear for student accounts. | Retained in staff preview; existing tests keep student accounts from seeing or activating it. | OK |
| Program Teacher | `workspace.js` | Student screens | School term that needs consistency | This is a role students may know; replacing it with "teacher" could reduce precision. | Retained consistently; copy uses short sentences around it. | OK |
| Proof | `workspace.js` | Student screens | School term that needs consistency | Students need a clear term for files, links, photos, and notes. | Retained as the student term; nearby copy explains proof as links/files tied to checklist items. | OK |
| Pilot, fake account, hosted proof, no-go | Docs/proof files | Readiness docs only | Policy/readiness wording | Must stay out of normal student UI but remain explicit in operator docs. | Retained in readiness docs; rejected from rendered student surfaces by tests where relevant. | OK |

## Fixed Code Paths

- Added `STUDENT_STATUS_LABELS`, `studentStatusText()`, and `studentStatusPill()` in `workspace.js`.
- Updated student Today, My Work, Feedback, Final Checklist, Proof Files, Final Files, and legacy student row renderers to use student-specific labels.
- Updated student send/review/recovery language from "revision" phrasing to "needs changes," "work to fix," and "updated work."
- Updated final checklist proof wording to avoid "evidence" in student-facing status text.
- Added `assertStudentPlainLanguageSurface()` in `tests/workspace-app.test.mjs`.

## Remaining Intentional Uses

The following terms remain outside normal student UI because they are staff/admin/source vocabulary:

- `Needs Revision` in staff dashboard, review queue, mentor dashboard, and admin/report contexts.
- `Submitted` in staff review queue and report/export contexts.
- `Evidence` in backend/API/source contexts and staff/admin labels.
- `revision` in staff queue filters, staff tests, and historical review data.

These are not student-facing copy defects unless they render inside normal student My Capstone screens.

## Regression Coverage

Updated tests cover:

- Student Today renders `Needs changes` and `send your updated work`.
- Student My Work renders `Work You Turned In`, `Proof Files`, and `Send updated work`.
- Student Feedback renders `Needs changes` and avoids the old "send the revision" wording.
- Student Final Checklist renders `No proof files have been uploaded yet`.
- Rendered student surfaces reject `RBAC`, `mutation`, `hydration`, `manifest`, `fake pilot`, `proof script`, `Forbidden`, `Unauthorized`, `Admin Console`, `Staff Workspace`, `Submitted Work`, `Evidence / Files`, and `Needs Revision`.

## Next Copy Risks

- Continue reviewing student Presentation and Final Files screens after screenshot proof.
- Review student onboarding docs under `docs/demo/` for the same wording rules.
- Decide whether the school wants to keep the term Evidence in any student-facing handbook text; if yes, define it once as "proof of your work, like a file, photo, link, or note."
