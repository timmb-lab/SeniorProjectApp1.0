# Demo Role Readiness

This scorecard records what is proven for demo roles and what still needs hosted click-through. It should be updated from tests, local proof, and safe hosted proof only.

## 1. Run Snapshot

- Last updated: `2026-05-31T22:05:51-07:00`
- Starting branch/SHA: `main` at `ee68cbe6964740e91608f2cfb42b8967b8e60fca`
- Ending branch/SHA: pending closeout commit; final SHA is reported after commit and push.
- Baseline push first: no. `main...origin/main` was clean and synced at the start.
- Hosted click-through this run: not completed.

## 4. Current Role Readiness Table

| Role | Current evidence | Remaining gap |
| --- | --- | --- |
| Global Admin | Local proof continues to allow Global Admin on `/api/site/programs`, including opening another demo site. Global Admin still sees the broader admin and site surfaces already covered by existing local route proof. | Needs a full role refresh that checks current click-throughs, global-versus-site boundaries, and cross-site Programs behavior together. |
| Site Admin | Site Admin Programs now has a local first-load add path from real demo seed data. Local tests and proof cover viewing active programs, seeing an available active program, adding it, removing it, restoring it, and preserving the older remove-then-restore proof for an already attached program. | Hosted click-through remains pending. |
| Administration | Local proof confirms Administration can use read-only monitoring routes where already allowed and is denied from `/api/site/programs`; the workspace nav keeps Programs hidden. | Needs hosted click-through across Site Dashboard, Students, Operations, Presentation, and Readiness. |
| Program Teacher | Local proof keeps Program Teacher denied from `/api/site/programs` while preserving existing scoped dashboard, directory, review, and operations behavior. | Needs a full queue-depth readiness refresh for missing-submission, intervention, and review workflows. |
| Mentor | Local proof keeps Mentor denied from `/api/site/programs` while preserving assigned-student mentor dashboard paths. | Needs hosted/live proof and a broader mentor-support workflow review. |
| Viewer | Local proof keeps Viewer denied from `/api/site/programs`; workspace navigation keeps Programs hidden and the default monitoring path uses supported Student Directory filters. | Needs hosted click-through for the read-only landing, assigned student list, and detail paths. |
| Student | Local proof keeps Student denied from `/api/site/programs` while preserving own-student dashboard coverage. | Needs a full student refresh for requirement drill-downs, evidence states, feedback flows, and archive/presentation visibility. |

## 6. Role-By-Role Loaded API Routes

- Global Admin: locally proven on `/api/site/programs` and existing admin/site route surfaces; full current click-through refresh remains open.
- Site Admin: locally proven on `/api/site/programs`, including first-load add, remove, restore, and active-program restore behavior.
- Administration: locally proven denied from `/api/site/programs`; existing read-only monitoring routes remain local-only evidence until hosted click-through.
- Program Teacher: locally proven denied from `/api/site/programs`; existing scoped program routes remain covered by prior local proof.
- Mentor: locally proven denied from `/api/site/programs`; assigned-student mentor routes remain covered by prior local proof.
- Viewer: locally proven denied from `/api/site/programs`; read-only Student Directory/detail routes still need hosted click-through.
- Student: locally proven denied from `/api/site/programs`; own-student routes still need a full current refresh.

## 8. Role-By-Role Forbidden Or Hidden Actions

- Global Admin: should not be collapsed into Site Admin or reduced to mentor/program-teacher scope.
- Site Admin: cannot manage another school and cannot use fake/unbacked program controls.
- Administration: cannot access Site Programs, security controls, account reset, or mutation controls.
- Program Teacher: cannot access Site Programs, global security, user management, or off-program student data.
- Mentor: cannot access Site Programs, self-assign students, or see unrelated student records.
- Viewer: cannot access Site Programs, review mutations, mentor-assignment mutations, or denied workspace sections.
- Student: cannot access Site Programs, staff-only notes, other-student data, or staff/admin controls.

## 9. Site Admin Programs Evidence

- First-load add path: verified locally. The local demo seed creates one active demo-owned catalog program, `Biotechnology`, that is not attached to the primary site, so it appears under Programs you can add on first load.
- Add/remove/restore: verified locally through `tests/site-programs.integration.test.mjs` and `scripts/prove-local-demo-workspace.mjs`.
- Visibility guard: verified locally through `tests/workspace-app.test.mjs` and `npm run verify:workspace-navigation`; Programs remains visible only for Global Admin and Site Admin.
- API denial guard: verified locally for Administration, Program Teacher, Mentor, Viewer, and Student through `tests/site-programs.integration.test.mjs` and local demo proof.
- Hosted status: pending. Do not claim hosted Programs proof until a hosted click-through is actually run.

## 10. Demo Data Notes

- The primary demo site still has all nine canonical CTE programs attached.
- The active `Biotechnology` catalog program is demo-owned by id and intentionally left unattached to the primary site so the add path is honest on first load.
- The proof cleans up its temporary addable-program mapping after route-level add/remove/restore checks so future first-load demos still start with an addable option.

## 13. Validation Results

- Passed before closeout: `node --test tests/site-programs.integration.test.mjs`, `node --test tests/local-demo-workspace-seed.test.mjs`, `node --test tests/remote-demo-workspace-seed.test.mjs`, `node --test tests/workspace-app.test.mjs`, `node --test tests/access-v5-effective.test.mjs`, `npm run verify:dashboard-actions`, `npm run verify:review-queue-deeplinks`, `npm run verify:workspace-navigation`, `npm run verify:functionality-language`, `npm run verify:functionality-ux-automation`, `npm run inventory:production-routes`, `npm run check:route-inventory`, `node --test tests/functionality-language-audit.test.mjs`, `node scripts/prove-local-demo-workspace.mjs`, `npm run test`, `npm run typecheck`, `npm run check`, and `git diff --check`.
