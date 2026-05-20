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

- `senior-capstone-app`: root app/backend host, deployed by `npm run deploy`.
- `senior-capstone-public`: generated public companion guide, deployed by `npm run deploy:public-site`.

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
npm run check:production-surfaces
npm run check:route-inventory
npm run check:generated-output-drift
npm run check
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

Initial D1-backed workflow routes now exist for `/api/student/dashboard`, `/api/submissions/:id/submit`, `/api/submissions/:id/evidence`, `/api/reviews/:submissionId/decision`, `/api/reviews/:submissionId/history`, `/api/teacher/review-queue`, `/api/mentor/assigned`, `/api/admin/announcements`, `/api/announcements`, `/api/admin/exports/student-archive`, `/api/exports/:id/download`, `/api/reports/readiness`, and `/api/admin/audit-events` so the test-account MVP path can move beyond alpha-only state.

## MVP Backend Foundation

The first Cloudflare MVP foundation is scaffolded with Pages Functions, D1, hardened username/password auth endpoints, and Google Drive evidence-repository metadata. Setup notes and live resource IDs are tracked in `docs/backend-setup.md`.

Cloudflare verification is split between local static proof and optional live read-only checks:

```powershell
npm run check:cloudflare
npm run check:cloudflare:live
```

`check:cloudflare` verifies `wrangler.jsonc`, the expected Pages project name, D1 binding, migrations, and local Wrangler CLI. If `CLOUDFLARE_API_TOKEN` is absent, it reports live Pages/D1 verification as blocked rather than passed. `check:cloudflare:live` requires `CLOUDFLARE_API_TOKEN` and exits nonzero when live verification cannot run. These checks do not perform login, deployment, migration, or student-data queries.

The alpha runbook is `docs/alpha-runbook.md`.

## Teacher Companion

Teacher planning notes live in `teacher-companion/implementation-guide.md`. They are not linked from the student guide.
