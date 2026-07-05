# Capstone Project

Capstone Project is the reusable, tenant-ready product for capstone workflow: the authenticated workspace, Cloudflare Pages Functions, D1 data model, role dashboards, evidence handling, and deployment/check rails.

This repo also contains the East Tech Senior Capstone Guide. That guide is school-specific public content for East Career and Technical Academy students and teachers. It is not the long-term Capstone Project product root.

## Product And Guide Boundary

Capstone Project product/app:

- Official title: Capstone Project.
- Official title is not "The Capstone Project".
- Target product/app domain: `thecapstoneproject.com`.
- Optional product alias: `www.thecapstoneproject.com`.
- Optional split app hostname only if needed later: `app.thecapstoneproject.com`.
- Canonical workspace route: `workspace.html`, currently deployed from the Cloudflare Pages project `senior-capstone-app`.
- School-agnostic product copy and behavior: school, program, cohort, student, mentor, program teacher, administrator, organization, and tenant where technical context fits.

East Tech guide:

- Source pages: `index.html`, route HTML files, `app.js`, `styles.css`, `assets/`, and `templates/`.
- Generated deploy root: `public-companion/`.
- Current guide project: `senior-capstone-public`.
- Future East Tech guide custom domain: TBD. Bryan will buy/configure it later.
- East Tech/Titans branding belongs here, not inside reusable Capstone Project app internals.

Current legacy domain state:

- `thecapstoneapp.com` and `www.thecapstoneapp.com` are legacy/current guide hostnames pending migration.
- `app.thecapstoneapp.com` remains the current legacy app hostname and current Google OAuth redirect host.
- Google Workspace SSO redirect examples must keep `https://app.thecapstoneapp.com/api/auth/google/callback` until a later Cloudflare plus Google OAuth redirect URI cutover is performed and verified.

## Production Surface Boundary

Production-surface policy lives in:

- `docs/production-deployment-policy.md`
- `docs/production-surface-registry.md`
- `docs/production-predeploy-checklist.md`

Retired stakeholder options:

- `Titan Blend` and `Back To Basics` are retired as active stakeholder options.
- The historical roots now live under `old/stakeholder-options/titan-blend/` and `old/stakeholder-options/back-to-basics/`.
- Active option dev/deploy/build scripts are intentionally removed. `check:site-options` now validates retirement and guide-output state.

Internal QA only:

- `alpha.html`
- `account.html`
- fake `.test` role accounts
- seeded alpha fixtures
- smoke/reset/report panels

Run the production-surface checker with:

```powershell
npm run check:production-surfaces
```

Regenerate the deterministic route/deploy inventory after route or deploy-script changes with:

```powershell
npm run inventory:production-routes
```

Before a pilot-facing deploy or custom-domain cutover, run the predeploy gate:

```powershell
npm run check:predeploy-gate
npm run check:production-surfaces
npm run check:route-inventory
npm run check:generated-output-drift
npm run check:custom-domain-cutover
npm run check:alpha-account-gating
npm run check:production-cutover
npm run check
```

`check:custom-domain-cutover` is the static/read-only target-domain gate. Live cutover still requires active Cloudflare Pages custom-domain association, DNS/TLS, product workspace/API health, and alpha/account exposure checks. Repo edits and git pushes do not equal Cloudflare live verification.

## East Tech Guide

Open `index.html` or the generated `public-companion/` output for the East Tech Senior Capstone Guide. The guide maps the physical `Your Senior` booklet into separate pages with:

- one page for each project stop;
- page references back to the booklet;
- official-link reminders;
- program requirement checks;
- pacing guidance;
- weak/better/strongest examples;
- vocabulary and reflection supports;
- templates for planning and evidence;
- portfolio, rubric, grade, and recognition guidance;
- Student Guide / Teacher Guide public mode controls.

Students should always follow the current directions, deadlines, and links shared through Senior Remind, the class website, and their senior project team.

Build and deploy the guide with:

```powershell
npm run build:public-site
npm run deploy:public-site
```

## Internal Alpha QA

The working MVP alpha shell is `alpha.html`. It uses seeded personas for student, program teacher, mentor, admin, and misc admin roles while production accounts are still hardening. The alpha console shows the next ready reviewer step, lets testers switch to the required persona from the walkthrough, includes reviewer checks, and can copy a concise walkthrough summary.

`alpha.html` is not production navigation and must not be used for real student records.

Run it locally with:

```powershell
npm run dev:alpha
```

Then open `http://localhost:8788/alpha.html`. This requires Node/npm plus Wrangler from the project dev dependencies. The alpha loads `/api/alpha/state` from a Cloudflare Pages Function, so run it through Pages dev or deployment when reviewing workflow state.

## Internal Account QA Smoke Test

Use `account.html` through Cloudflare Pages dev or deployment to verify fake `.test` account login, `/api/auth/me`, logout, role scopes, and protected evidence access checks. The smoke page covers student, program teacher, mentor, admin, and misc admin test accounts; compares evidence allow/deny results against the active fake account; checks the expected role scope; shows backend readiness as a checklist; and includes a one-click smoke sequence. Passwords stay only in ignored local `.secrets/` files; do not paste them into docs, screenshots, Figma, or Canva.

Initial D1-backed workflow routes now exist for `/api/site/dashboard`, `/api/site/students`, `/api/site/review-queue`, `/api/site/mentor-assignments`, `/api/site/operations-readiness`, `/api/student/dashboard`, `/api/submissions/:id/submit`, `/api/submissions/:id/evidence`, `/api/reviews/:submissionId/decision`, `/api/reviews/:submissionId/history`, `/api/teacher/review-queue`, `/api/mentor/assigned`, `/api/admin/exports/student-archive`, `/api/exports/:id/download`, `/api/reports/readiness`, and `/api/admin/audit-events` so the test-account MVP path can move beyond alpha-only state.

Announcements are removed from active MVP product surfaces. Schools should continue using existing communication systems such as Remind, Canvas, Infinite Campus, Google Classroom, email, or district-approved tools. The legacy `announcements` table remains schema-only/deprecated until a later safe cleanup phase.

## Local 1.0 Baseline

The current 1.0 setup is local accounts only with Google Workspace SSO disabled. Migration `0014_local_only_empty_test_schools.sql` leaves exactly two active empty schools for Bryan's account-building pass:

- Test High School
- East Career & Technical Academy

Create students, staff accounts, and role assignments through the authenticated workspace instead of preloading old synthetic schools. The current functional audit is `docs/full-1.0-audit.md`.

## Legacy Synthetic Demo Workspace Seed

For legacy local functional demos only, the repo still retains the synthetic workspace seed:

```powershell
npm run seed:demo:local:dry-run
npm run seed:demo:local:reset
npm run prove:local-admin-logins
npm run prove:demo:local
```

The legacy seed creates a fake Desert Valley School District with three populated synthetic sites for stress/demo proof. It is not the active 1.0 empty-school baseline. It refuses remote D1, uses only `.test` demo domains, creates no Drive files, preserves the two protected local admins, and writes demo staff/persona credentials only to ignored `.secrets/demo-staff-logins-*.json` files.

Details live in `docs/local-demo-data.md`.

The live hosted demo-day path starts at `docs/sales/demo-day-operator-script.md`. The broader internal sales demo package starts at `docs/sales/demo-runbook.md` and includes the administrator script, FAQ, one-page leave-behind, technical proof checklist, preflight checklist, data dictionary, screenshot checklist, hosted-proof plan, and hosted browser screenshot index. Remote D1 migration `0011_multisite_site_role_foundation.sql` has been applied. The legacy synthetic hosted sales-demo seed is a deprecated/non-blocking compatibility check that reports `LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING` when the old seed is absent, while the 2026-06-29 pass captured hosted fake-account browser screenshots for signed-out, Student, Program Teacher, Mentor, Viewer, Site Admin, Admin, misc_admin, and mobile Student surfaces. This remains Hosted fake-account click-around demo readiness only, not Real-student production pilot readiness. Real-pilot gap closure starts at `docs/sales/real-student-pilot-readiness-gap-analysis.md`, the operator proof plan is `docs/sales/real-student-pilot-proof-plan.md`, the role contract is `docs/security/role-access-matrix.md`, and the static preflight is `npm run check:pilot-readiness`. The operator-facing pilot packet is `docs/demo/real-student-pilot-readiness-runbook.md`, `docs/demo/real-student-pilot-go-no-go-gate.md`, `docs/demo/staff-pilot-onboarding-checklist.md`, `docs/demo/student-pilot-onboarding-checklist.md`, and `docs/demo/student-data-handling-summary.md`.

The next major product polish round is scoped by `docs/design/next-major-round-polish-and-pilot-blueprint-2026-07-04.md`. The expanded staged YUGE MAX execution plan is `docs/design/yuge-max-next-round-blueprint-2026-07-05.md`. Both preserve the Student, Staff Workspace, and Admin Console model while separating local fake-account demo readiness, hosted fake-account demo readiness, and real-student pilot readiness.

## MVP Backend Foundation

The first Cloudflare MVP foundation is scaffolded with Pages Functions, D1, hardened username/password auth endpoints, Google Workspace SSO fail-closed scaffold, and Google Drive evidence-repository metadata. Setup notes and live resource IDs are tracked in `docs/backend-setup.md`.

Cloudflare verification is split between local static proof and optional live read-only checks:

```powershell
npm run check:cloudflare
npm run check:cloudflare:live
```

Cloudflare GitHub integration may automatically deploy after pushes to `main`. That integration is Cloudflare-side and does not give the local Codex/Wrangler shell Cloudflare API credentials. Static/local gates can pass without a token, but `check:cloudflare:live` requires `CLOUDFLARE_API_TOKEN` or a repo-supported authenticated Cloudflare connector path. Git push success is not live Cloudflare verification success.

`check:cloudflare` verifies `wrangler.jsonc`, the expected Pages project name, D1 binding, migrations, and local Wrangler CLI. It is intentionally static-only. `check:cloudflare:live` requires `CLOUDFLARE_API_TOKEN` and exits nonzero when live verification cannot run. These checks do not perform login, deployment, migration, or student-data queries.

The alpha runbook is `docs/alpha-runbook.md`.

## Owner/Admin And Account Reset

The supported clean account reset path is:

```powershell
npm run reset:accounts:local:dry-run
npm run reset:accounts:local
```

Remote reset uses the matching `reset:accounts:remote:dry-run` and `reset:accounts:remote` scripts, but remote write is destructive and additionally requires `ALLOW_REMOTE_ACCOUNT_RESET=true`, `CLOUDFLARE_API_TOKEN`, `PASSWORD_PEPPER`, and the exact confirmation built into the npm script.

After the reset, the only recreated local-auth global admins are:

- Master local admin: `bryan@learntechonline.com`, Bryan Timm, global `admin`, local username/password, reset required on first use.
- Break-glass local admin: `bryan.timm89@gmail.com`, Bryan Timm, global `admin`, local username/password, reset required on first use.

One-time setup credentials and account-reset backups are written only to ignored `.secrets/` files. Do not print, commit, paste, screenshot, or move those files outside `.secrets/`. The reset clears old fake `.test` accounts and old `bryan@thecapstoneapp.com` if present; fake test accounts can be recreated later only through explicit test-account seed tooling.

Prove the two approved local admins can complete reset and log in locally with:

```powershell
npm run prove:local-admin-logins
```

The proof uses the ignored setup credential file when accounts are still pending reset, creates ignored working login credentials under `.secrets/local-admin-working-logins-*.json`, and prints only sanitized pass/fail metadata. It does not require Google Workspace SSO, does not touch remote D1, and does not seed fake `.test` users.

Bryan Timm's earlier production owner/admin verifier remains a narrow non-secret check for `bryan.timm89@gmail.com`, global `admin`. Re-run that verifier with:

```powershell
npm run ensure:owner-admin:remote
```

This path is separate from `/api/admin/users/import`, which still blocks real non-`.test` temporary-credential imports by default pending Bryan's broader credential-delivery decision.

## Hosted Workspace Proof Gates

Use fake `.test` accounts only for hosted workspace proof. The ignored credential source defaults to `.secrets/test-accounts-2026-05-18.json`; do not commit or paste those values.

```powershell
npm run check:workspace:hosted-evidence
npm run check:workspace:hosted-permissions
npm run check:workspace:hosted-dashboard
```

The canonical workspace includes role-aware admin, program teacher, mentor, student, and misc-admin behavior plus browser upload selected/progress/verifying/complete/failure states. The hosted dashboard proof strengthens the fake-account presentation/archive checks without using Bryan's real admin account.

Google Docs evidence downloads have provider-safe coverage for native Google Docs MIME classification and PDF export through the app-scoped download route. Live Google Docs export still needs a fake native Docs fixture/policy decision before it should be claimed as live-proven.

## Teacher Companion

Teacher planning notes live in `teacher-companion/implementation-guide.md`. They are not linked from the student guide.
