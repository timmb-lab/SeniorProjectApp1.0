# Demo Role Readiness

This scorecard records what is proven for demo roles and what still needs hosted click-through. It should be updated from tests, local proof, and safe hosted proof only.

## 1. Run Snapshot

- Last updated: `2026-06-02T10:32:22-07:00`
- Starting branch/SHA: `main` at `e451d0e6cc99af59615387c5849dee4c6849edbf`
- Ending branch/SHA: pending closeout commit; final SHA is reported after commit and push.
- Baseline push first: no. `main` started three local automation commits ahead of `origin/main`, with a clean worktree and no new remote commits to fast-forward.
- Hosted click-through this run: not completed; this was a local Site Dashboard `Recent Activity` depth pass plus focused dashboard/workspace verifier coverage.

## 4. Current Role Readiness Table

| Role | Current evidence | Remaining gap |
| --- | --- | --- |
| Global Admin | Local proof continues to allow Global Admin on `/api/site/programs`, including opening another demo site. Global Admin still sees the broader admin and site surfaces already covered by existing local route proof. | Needs a full role refresh that checks current click-throughs, global-versus-site boundaries, and cross-site Programs behavior together. |
| Site Admin | Site Admin Programs still has local first-load add proof. The Site Dashboard and Users & Access first load are now calmer: dashboard snapshots, access history, and long guidance are disclosed while route-backed metrics and current access summary stay visible. Site Dashboard follow-up and protected-access summaries now use school-facing `Teacher follow-up` and protected-and-reviewed language, the top-risk list now explains why each student is highlighted, the `Needs Attention` rows now open the existing missing-mentor Student Directory filter plus the existing revision-requested and presentation/archive Operations worklists, the `Next Actions` card now opens the all-students list, the review queue, and archive/presentation follow-up through existing presets, the disclosed `Recent Activity` card now lists recent submissions, evidence, and teacher feedback without sensitive private details, Operations uses school follow-up language instead of viewer-style read-only monitoring copy, and the mentor-assignment POST route now keeps working for multi-site site admins when the current school is implied instead of explicitly posted. | Hosted click-through remains pending. |
| Administration | Local proof confirms Administration can use read-only monitoring routes where already allowed and is denied from `/api/site/programs`; the workspace nav keeps Programs hidden, Site Dashboard now uses leadership monitoring labels instead of viewer wording, site-backed Readiness now uses leadership-readiness copy, Operations keeps explicit read-only monitoring language, the `Needs Attention` card keeps only the role-safe Student Directory and Operations drill-downs visible instead of exposing Review Queue actions, the disclosed `Next Actions` card now routes follow-up only through existing Student Directory and Operations presets while unavailable Review Queue destinations stay summary-only, and the disclosed `Recent Activity` card now shows redacted recent student/workflow updates without opening a Global Admin audit path. | Needs hosted click-through across Site Dashboard, Students, Operations, Presentation, and Readiness. |
| Program Teacher | Local proof keeps Program Teacher denied from `/api/site/programs` while preserving existing scoped dashboard, directory, review, and operations behavior. The Program Dashboard first load now keeps route-backed metrics visible and moves repeated detail panels behind dashboard disclosure, Operations now frames follow-up as assigned-student program work, and the Review Queue now distinguishes submitted `Open review` rows from revision-only follow-up rows while also explaining the active risk reasons on each row. | Needs a full queue-depth readiness refresh for missing-submission, broader review follow-up, and workflow depth. |
| Mentor | Local proof keeps Mentor denied from `/api/site/programs` while preserving assigned-student mentor dashboard paths. Mentor Dashboard rows now render as compact assigned-student summaries with secondary meeting/presentation/activity details disclosed per row. | Needs hosted/live proof and a broader mentor-support workflow review. |
| Viewer | Local proof keeps Viewer denied from `/api/site/programs`; workspace navigation keeps Programs hidden and the default monitoring path uses supported Student Directory filters. | Needs hosted click-through for the read-only landing, assigned student list, and detail paths. |
| Student | Local proof keeps Student denied from `/api/site/programs` while preserving own-student dashboard coverage. Student first load now prioritizes progress, one current action, short next steps, and deadlines, with requirements, feedback, progress/support, evidence, submitted work, and files behind disclosure. | Needs a full student refresh for hosted requirement drill-downs, evidence states, feedback flows, and archive/presentation visibility. |

## 6. Role-By-Role Loaded API Routes

- Global Admin: locally proven on `/api/site/programs` and existing admin/site route surfaces; full current click-through refresh remains open.
- Site Admin: locally proven on `/api/site/programs`, including first-load add, remove, restore, and active-program restore behavior, plus `/api/site/mentor-assignments` POST fallback when a multi-site site admin omits `siteId`; current local dashboard evidence also keeps follow-up and protected-access copy school-facing, explains top-risk rows directly, opens `Needs Attention` rows through the existing Students, Review Queue, and Operations filters, opens the disclosed `Next Actions` card through the existing Students, Review Queue, and Operations presets, and shows a redacted in-dashboard `Recent Activity` list backed by the site dashboard route.
- Administration: locally proven denied from `/api/site/programs`; Site Dashboard, Operations, and site-backed Readiness now keep leadership monitoring copy, the `Needs Attention` card keeps only role-safe Students and Operations drill-downs visible, the disclosed `Next Actions` card uses only Student Directory and Operations presets while unavailable Review Queue destinations stay summary-only, and the disclosed `Recent Activity` card stays in-dashboard and read-only without exposing Audit navigation, but the full read-only path remains local-only evidence until hosted click-through.
- Program Teacher: locally proven denied from `/api/site/programs`; existing scoped program routes remain covered by prior local proof, and the Review Queue now has clearer row-level review versus follow-up guidance plus row-level risk explanation copy without intervention wording.
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

- Latest Site Dashboard `Recent Activity` closeout: `node --check workspace.js`, `node --test tests/site-dashboard.integration.test.mjs`, `node --test tests/workspace-app.test.mjs`, `npm run verify:functionality-language`, `npm run verify:functionality-ux-automation`, `npm run check:production-surfaces`, `npm run typecheck`, `npm run test`, and `npm run check`.
- This closeout also passed `node -e "JSON.parse(require('fs').readFileSync('automation/state/functionality-ux-growth-state.json','utf8')); JSON.parse(require('fs').readFileSync('docs/progress/runs/2026-06-02-1009-site-dashboard-next-actions.json','utf8')); console.log('json ok')"` and `git diff --check` with CRLF normalization warnings only.
