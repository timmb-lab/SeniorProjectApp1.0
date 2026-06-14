# Full 1.0 Functional Audit And Goal Matrix

Date: 2026-06-13
Repo: `C:\SeniorProjectApp1.0`
Branch: `main`
HEAD audited: `f7118a5b1eda3acd7f3566ab79f34eb880af7b2e`

This audit is about functionality: whether the app works, whether protected workflows are route-backed, whether the live deployment can be trusted, and what still blocks a fully functioning app by Saturday, June 20, 2026.

## Executive Verdict

The app is strong locally. The protected workspace, role-specific dashboards, review queue, student workflow, mentor flow, operations worklists, presentation schedule, archive/final-file states, public guide, route inventory, Cloudflare config, target-domain mapping, TypeScript, and the full local test suite are all passing.

The app is not yet a full production-cutover green light because hosted fake `.test` credential proof is currently broken. The live app and target domain respond, but `check:production-cutover`, hosted permission proof, hosted evidence proof, and Drive live proof fail when the hosted fake student login returns `401 invalid_credentials`. That blocks final hosted role proof and hosted upload/download proof until the remote fake credential/seed path is repaired.

The fastest path to a full functioning app this week is not a broad rebuild. It is to repair hosted fake-account proof, rerun the live gates, then do one role-by-role click-through hardening pass against the target domain.

## Audit Fixes Made Today

The first verifier pass found two current regressions:

- `workspace.js` still used the visible phrase `Assigned access`, which violated the protected-language guard. It now uses `Workspace assignments`.
- `scripts/verify-dashboard-actions.mjs` still expected older `Evidence` / `Archive` labels even though the workspace had moved to student-facing `Proof` and `Final files` language. The verifier now checks the current labels while still proving the same route-backed filters.

Both failing verifiers passed after the fix.

The usability pass added a clearer phase workflow without adding unbacked controls:

- Student home now has a numbered Stage Guide that says what to do first, what to do next, and when to wait.
- The Stage Guide explicitly says students should start the next phase only after Program Teacher approval is recorded.
- Teacher Review Queue selected rows now explain that approving submitted work is the manual next-step checkpoint; requesting revision keeps the student in the current phase.
- The backend review decision route already records approved work as "Approved for the next capstone phase." Mentors remain support/check-in context unless a separate mentor-approval record is added later by policy decision.

## Verification Results

### Local Functionality: Passed

| Command | Result |
| --- | --- |
| `node --check workspace.js` | Passed |
| `npm run verify:functionality-language` | Passed |
| `node --test tests/functionality-language-audit.test.mjs` | Passed, 6 tests |
| `npm run verify:dashboard-actions` | Passed |
| `npm run verify:review-queue-deeplinks` | Passed |
| `npm run verify:workspace-navigation` | Passed |
| `npm run verify:workspace-density` | Passed |
| `npm run verify:functionality-ux-automation` | Passed, 7 tests |
| `npm run check:production-surfaces` | Passed, 89 production text surfaces scanned |
| `npm run check:route-inventory` | Passed |
| `npm run check:generated-output-drift` | Passed |
| `npm run check:site-options` | Passed |
| `npm run check:cloudflare` | Passed static Cloudflare/Wrangler/D1 config |
| `npm run check:custom-domain-cutover` | Passed, target Pages custom-domain associations active |
| `npm run check:alpha-account-gating` | Passed with internal-QA direct-URL warning |
| `npm run check:predeploy-gate` | Passed |
| `npm run check:cloudflare:live` | Passed read-only Pages/D1 live verification |
| `npm run typecheck` | Passed inside production-cutover run |
| `npm run test` | Passed inside production-cutover run |
| `npm run check` | Passed inside production-cutover run: 408 pass, 4 expected local HTTP skips |

### Live Cutover: Blocked

| Command | Current result | Blocker |
| --- | --- | --- |
| `npm run check:production-cutover` | Failed | Hosted fake `.test` student login returns `401 invalid_credentials` |
| `npm run check:workspace:hosted-permissions` | Failed | Same hosted fake `.test` credential failure |
| `npm run check:workspace:hosted-evidence` | Failed inside cutover | Same hosted fake `.test` credential failure before upload proof |
| `npm run check:drive:live` | Failed inside cutover | Same hosted fake `.test` credential failure before Drive upload/download proof |

Important distinction: Cloudflare live verification and target-domain HTTPS checks pass. The live blocker is the hosted proof account path, not Pages/D1 existence or target-domain routing.

## Goal And Functionality Matrix

Status values:

- `green`: works and is verified for the stated scope.
- `yellow`: implemented, but missing hosted proof, policy, or one important edge.
- `red`: blocking a full functioning app.

| Goal | What should work | Current status | Evidence | Remaining gap |
| --- | --- | --- | --- | --- |
| Canonical app route | Product app loads through the protected `workspace.html` route, not alpha/persona pages. | `green` | Route inventory marks `workspace.html` production/conditional; target-domain live check returns 200 and redirects root/workspace safely. | Keep alpha/account unlinked or decide a stronger gate before real pilot users. |
| Product domain | `thecapstoneproject.com` reaches the app and app API safely. | `green` | `check:custom-domain-cutover --live-required --live-http` passed inside cutover for root, workspace, `/api/health`, and signed-out `/api/auth/me`. | Optional `app.thecapstoneproject.com` is not configured, but it is explicitly optional. |
| Cloudflare/Pages/D1 foundation | Pages project, D1 binding, migrations, and live D1 identity are valid. | `green` | `check:cloudflare`, `check:cloudflare:live` passed. | None for static/read-only platform existence. |
| Public Student/Teacher guide | Public guide pages render from source, generated mirror is current, retired options are not active deploy targets. | `green` | `check:generated-output-drift`, `check:site-options`, `check:production-surfaces` passed. | Browser/mobile visual QA remains useful, but no source drift is present. |
| Local auth and account lifecycle | Local username/password auth, reset-required state, self password change, admin import, account removal, and session behavior work. | `green locally` | Full test suite and auth/admin account tests pass; local-only 1.0 decisions are encoded. | Hosted fake credentials are stale/invalid, so live credential proof is `red` until repaired. |
| Hosted role proof | Fake `.test` student, teacher, mentor, misc admin, and admin accounts can log in and prove permissions on hosted app. | `red` | `check:workspace:hosted-permissions` fails at student login with `401 invalid_credentials`. | Recreate or repair hosted fake `.test` proof accounts and ignored credential file, then rerun hosted permission proof. |
| Role-based workspace routing | Each role lands on the correct workspace with only allowed sections/actions. | `green locally, yellow live` | `workspace-app.test.mjs`, permission tests, dashboard-action verifier, navigation verifier all pass. | Hosted role click-through blocked by fake credential failure. |
| Student dashboard and progress | Student sees own requirements, deadlines, feedback, submissions, proof files, final-file readiness, and inline requirement timeline. | `green locally, yellow live` | Student dashboard integration and workspace tests pass, including requirement detail, file handoff, feedback/submission timelines, and final-file states. | Hosted student login and hosted evidence path are blocked. |
| Student usability and stage clarity | Student can tell: do this work, add proof, send for review, then wait for Program Teacher approval before next phase. | `green locally, yellow live` | Stage Guide and approval-checkpoint copy are now rendered on the student dashboard and covered by workspace tests. | Hosted student click-through is still blocked by fake credential failure; separate mentor approval is future policy/product scope. |
| Student evidence upload/download | Students can upload proof, metadata stays private, downloads use app-scoped routes. | `green in tests, red hosted proof` | Upload/download route tests pass; Drive health reports provider configured. | Hosted Drive live proof cannot reach upload because fake student login fails. |
| Review Queue | Staff can filter submitted/revision/risk/proof states, open review work, preserve shared URLs, and avoid read-only mutation leaks. | `green locally` | Review Queue deep-link verifier and workspace tests pass. | Hosted program-teacher/site-admin click-through blocked by fake credential failure. |
| Review decisions and history | Authorized teachers/admins can request revision, approve, add comments, and keep student-visible/staff-only history separated. | `green locally` | Review loop integration tests and note-visibility workspace tests pass. | Hosted role proof still needed. |
| Manual phase advancement | Phase progress advances only through approved/archived required work, not because a student merely opens the next phase. | `green locally, yellow for mentor policy` | Student dashboard summary uses approved/archived required work for phase completion; Review Queue approval is the existing auditable manual gate. | If the program wants mentors to record an independent "approved for next steps" decision, add a durable mentor approval model instead of only copy. |
| Mentor dashboard | Mentors see assigned students, focus filters, recent activity, meeting/presentation cues, and assigned-student detail only. | `green locally, yellow live` | Mentor dashboard tests and workspace tests pass. | Hosted mentor click-through blocked by fake credential failure. |
| Mentor assignments | Authorized school operations roles can inspect and manage mentor assignment coverage with audit protection. | `green locally` | Site mentor assignment integration tests pass, including default site fallback and denial paths. | Hosted site-admin proof still needed. |
| Programs management | Global Admin/Site Admin can manage school program mappings where scoped; other roles are denied. | `green locally` | Site Programs route tests and workspace proof pass. | Hosted admin/site-admin proof still needed. |
| Users and access | Admins can review role assignments, site access, school-choice handoffs, and scoped access changes. | `green locally` | Admin role assignment, site access assignment, and workspace tests pass. | Hosted click-through blocked by fake credential failure. |
| Operations readiness | Staff can use route-backed worklists for presentation, archive, stale activity, missing proof, and exact student filters. | `green locally` | Dashboard-action verifier and operations tests pass after today's verifier fix. | Hosted click-through blocked by fake credential failure. |
| Presentation schedule | Scoped users can filter schedule states, use check-in/out where allowed, and preserve URL focus. | `green locally` | Presentation integration and workspace URL-state tests pass. | Hosted click-through still needed. |
| Archive/final files | Archive readiness, package rows, expired/expiring states, and final-file download language are implemented safely. | `green locally, red hosted proof` | Archive/export tests pass; local UI avoids fake retry controls and storage leaks. | Hosted Drive/evidence proof is blocked by fake student login. |
| Auditability | Protected reads/mutations are audited and redacted; Global Admin audit filters restore from URL state. | `green locally` | Route tests and workspace tests pass. | Filtered Audit cross-school proof remains a future deepening item, not a current cutover blocker. |
| Production-surface safety | Production files avoid fake/test/internal/developer copy and storage/secret leaks. | `green` | `check:production-surfaces` passed. | Keep running this after every UI/doc route change. |
| Internal alpha/account QA exposure | Internal QA routes are labeled and unlinked from production nav. | `yellow` | `check:alpha-account-gating` passed but warns Option A direct URL exposure is only internal-QA acceptable. | Decide whether to keep unlinked, add extra gate, or remove before real pilot records. |
| Real pilot account import | Authorized admins can create local real accounts in local-only 1.0 mode. | `yellow` | Admin import tests pass and local-only decision is documented. | Bryan still needs a durable credential delivery policy before broad real user import. |
| Google Workspace SSO | SSO scaffold exists and fails closed while disabled. | `yellow/future` | Google SSO tests and auth config pass; local-only 1.0 uses username/password. | Do not re-enable until tenant/OAuth/env decisions are made and tested. |

## What Must Happen Next

P0 for today and tomorrow:

1. Repair hosted fake `.test` proof accounts.
   - Current symptom: hosted fake student login returns `401 invalid_credentials`.
   - Likely cause: the ignored `.secrets/test-accounts-2026-05-18.json` credential file no longer matches remote D1 after the later local-only/remote account reset work.
   - Safe next action: recreate hosted fake proof accounts through the approved fake-account/test-account path, update ignored credentials only, then rerun `check:workspace:hosted-permissions`.

2. Rerun hosted evidence and Drive live gates.
   - Required commands after hosted fake login is repaired: `npm run check:workspace:hosted-evidence`, `npm run check:drive:live`, and `npm run check:production-cutover`.
   - Do not accept real student file bytes until these pass.

3. Run a target-domain role walkthrough.
   - Use fake `.test` accounts only.
   - Cover Student, Program Teacher, Mentor, Site Admin/Global Admin, Administration/Viewer if available.
   - Confirm visible sections, loaded routes, allowed actions, forbidden actions, stage-guide clarity, approval checkpoint clarity, and logout/reset behavior.

4. Decide internal QA exposure and credential delivery policy.
   - `alpha.html` and `account.html` are currently unlinked and labeled, but still directly reachable.
   - Real user imports need Bryan's credential delivery procedure before broad rollout.

## Seven-Day Functionality Plan

Target: full functioning app by Saturday, June 20, 2026.

| Date | Focus | Exit criteria |
| --- | --- | --- |
| Sat Jun 13 | Hosted proof account repair | Hosted fake `.test` role logins pass; hosted permission proof passes. |
| Sun Jun 14 | Hosted evidence/Drive proof | Hosted evidence, Drive live, and production cutover pass without real student data. |
| Mon Jun 15 | Role walkthrough hardening | Every role has a target-domain click-through scorecard: visible sections, API routes loaded, allowed actions, forbidden actions. |
| Tue Jun 16 | Student path end-to-end | Student can sign in, inspect requirements, add/upload proof, submit, see review feedback, presentation state, and final-file state in hosted fake proof. |
| Wed Jun 17 | Staff operations end-to-end | Teacher review, mentor meeting context, mentor assignment, programs, users/access, operations readiness, and presentation check-in/out are walked through with fake accounts. |
| Thu Jun 18 | Account and policy gate | Admin import/reset flow is rehearsed with non-real or approved test users; credential handoff and internal QA exposure decisions are resolved. |
| Fri Jun 19 | Freeze and regression | Full local ladder, hosted live gates, production cutover, browser smoke, and runbook all pass. No broad feature work after this unless blocking. |
| Sat Jun 20 | Go/no-go | Only accept real pilot records if production cutover, hosted permissions, hosted evidence/Drive, auth/account lifecycle, and policy gates are green. |

## No-Go Conditions For Real Student Records

Do not put real student records or real student files into the app until all of these are true:

- `npm run check:production-cutover` passes.
- `npm run check:workspace:hosted-permissions` passes with fake `.test` accounts.
- `npm run check:workspace:hosted-evidence` and `npm run check:drive:live` pass.
- Real-user credential delivery is explicitly accepted.
- Internal alpha/account exposure is accepted, gated, or removed.
- Archive retention policy is accepted or the app continues to show policy-review-required language.

## Bottom Line

Local functionality is in good shape. The app is not fake; the role surfaces and routes are real and heavily tested. The current blocker is live proof integrity: the hosted fake proof credentials are invalid, which prevents final hosted permission, evidence, Drive, and production-cutover verification. Fix that first, then use the rest of the week for role-by-role hosted walkthroughs and policy closure, not broad feature churn.
