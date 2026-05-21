# Senior Capstone Project Guide

Public companion site for the East Career and Technical Academy Senior Capstone Project.

The site is written for students. It maps the physical `Your Senior` booklet into separate pages with:

- one page for each project stop;
- page references back to the booklet;
- official-link reminders;
- program requirement checks;
- pacing guidance;
- weak/better/strongest examples;
- vocabulary and reflection supports;
- templates for planning and evidence;
- portfolio, rubric, grade, and recognition guidance.

Students should always follow the current directions, deadlines, and links shared through Senior Remind, the class website, and their senior project team.

## Public Website

Open `index.html` or the Cloudflare/GitHub Pages URL for the public ECTA Senior Capstone website. The root page links into program requirements, the phase menu, focused student supports, templates, and the clearly labeled app workflow preview.

## Production Surface Boundary

Production-surface policy lives in:

- `docs/production-deployment-policy.md`
- `docs/production-surface-registry.md`
- `docs/production-predeploy-checklist.md`

Canonical production targets:

- `thecapstoneapp.com` and `www.thecapstoneapp.com`: public guide on `senior-capstone-public`, deployed by `npm run deploy:public-site`.
- `app.thecapstoneapp.com`: secure app/backend on `senior-capstone-app`, deployed by `npm run deploy`.

Review-only targets:

- `senior-capstone-option-titan`: generated Titan Blend stakeholder option.
- `senior-capstone-option-primary`: generated Back To Basics stakeholder option.

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

`check:custom-domain-cutover` is the static/read-only domain mapping gate. Live cutover still requires active Cloudflare Pages custom-domain association, DNS/TLS, public guide health, and `app.thecapstoneapp.com` app/API health.

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

Initial D1-backed workflow routes now exist for `/api/student/dashboard`, `/api/submissions/:id/submit`, `/api/submissions/:id/evidence`, `/api/reviews/:submissionId/decision`, `/api/reviews/:submissionId/history`, `/api/teacher/review-queue`, `/api/mentor/assigned`, `/api/admin/announcements`, `/api/announcements`, `/api/admin/exports/student-archive`, `/api/exports/:id/download`, `/api/reports/readiness`, and `/api/admin/audit-events` so the test-account MVP path can move beyond alpha-only state.

## MVP Backend Foundation

The first Cloudflare MVP foundation is scaffolded with Pages Functions, D1, hardened username/password auth endpoints, and Google Drive evidence-repository metadata. Setup notes and live resource IDs are tracked in `docs/backend-setup.md`.

Cloudflare verification is split between local static proof and optional live read-only checks:

```powershell
npm run check:cloudflare
npm run check:cloudflare:live
```

Cloudflare GitHub integration may automatically deploy after pushes to `main`. That integration is Cloudflare-side and does not give the local Codex/Wrangler shell Cloudflare API credentials. Static/local gates can pass without a token, but `check:cloudflare:live` requires `CLOUDFLARE_API_TOKEN` or a repo-supported authenticated Cloudflare connector path. Git push success is not live Cloudflare verification success.

`check:cloudflare` verifies `wrangler.jsonc`, the expected Pages project name, D1 binding, migrations, and local Wrangler CLI. It is intentionally static-only. `check:cloudflare:live` requires `CLOUDFLARE_API_TOKEN` and exits nonzero when live verification cannot run. These checks do not perform login, deployment, migration, or student-data queries.

The alpha runbook is `docs/alpha-runbook.md`.

## Owner/Admin Verification

Bryan Timm's production owner/admin account is a narrow real-account exception only: `bryan.timm89@gmail.com`, global `admin`. Re-run the non-secret verifier with:

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

The canonical workspace now includes browser upload selected/progress/verifying/complete/failure states with a retry action for retryable upload failures. The hosted dashboard proof strengthens the fake-account presentation/archive checks without using Bryan's real admin account.

Google Docs evidence downloads have provider-safe coverage for native Google Docs MIME classification and PDF export through the app-scoped download route. Live Google Docs export still needs a fake native Docs fixture/policy decision before it should be claimed as live-proven.

## Teacher Companion

Teacher planning notes live in `teacher-companion/implementation-guide.md`. They are not linked from the student guide.
