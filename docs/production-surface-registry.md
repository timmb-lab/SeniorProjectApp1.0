# Production Surface Registry

Date: 2026-05-21

Classification values: `production`, `internal-alpha`, `internal-smoke`, `generated-output`, `retired-stakeholder-option`, `preview`, `legacy`, `unknown`.

Production-safe means the surface is safe to present in its intended context. A retired historical artifact can remain readable without being an active production or deploy target.

## Naming And Domain State

| Item | Current state | Target state | Validation |
| --- | --- | --- | --- |
| Official product title | Capstone Project | Capstone Project | Search must not treat "The Capstone Project" as official title |
| Product/app target | Cloudflare association in progress when live tooling permits | `thecapstoneproject.com` on `senior-capstone-app` | `npm run check:custom-domain-cutover` |
| Product alias | Optional | `www.thecapstoneproject.com` on `senior-capstone-app` if configured | `npm run check:custom-domain-cutover -- --live-required --live-http` |
| Optional app split | Not required by this pass | `app.thecapstoneproject.com` only if deployment/SSO split requires it later | Manual Cloudflare plus Google OAuth redirect URI cutover |
| Current legacy guide hostnames | `thecapstoneapp.com`, `www.thecapstoneapp.com` | Legacy/current pending migration | Historical/live checks only |
| Current legacy app/SSO hostname | `app.thecapstoneapp.com` | Keep as current Google OAuth redirect host until later SSO cutover | Google SSO tests and docs |
| East Tech guide future domain | `TBD` | `TBD` until Bryan buys/configures it | Search for invented guide domains |

Repo edits do not equal Cloudflare custom-domain changes. Live state is verified only when the Pages Domains API and HTTPS checks pass.

## P0 Production Experience Targets

| Surface | Path | Deploy project | Classification | Audience | Production-safe | Reason | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Capstone Project product app | `workspace.html`, `workspace.js`, `workspace.css`; product root redirects to `workspace.html` | `senior-capstone-app` | `production` | Authenticated students, mentors, program teachers, admins, misc admins | Partial | Canonical protected workspace route with role-aware dashboards, auth/session APIs, D1-backed data, evidence workflows, and school-agnostic copy. | `npm run test`; `npm run check:production-surfaces`; hosted workspace checks when credentials exist |
| East Tech guide source | `index.html`, public route pages, `app.js`, `styles.css`, `assets/`, `templates/` | `senior-capstone-app` source and `senior-capstone-public` generated mirror | `production` / `generated-output` | East Tech students, families, staff, mentors | Yes as public guide | School-specific Student Guide / Teacher Guide content with East Tech/Titans branding. Not the long-term product root. | `npm run build:public-site`; `npm run check:generated-output-drift`; `npm run check:production-surfaces` |
| Internal alpha page | `alpha.html` | `senior-capstone-app` | `internal-alpha` | Bryan and QA testers | No for public navigation | Internal seeded alpha walkthrough. | `npm run check:alpha-contract`; `npm run check:alpha-account-gating`; `npm run test` |
| Internal account page | `account.html` | `senior-capstone-app` | `internal-smoke` | Bryan and QA testers | No for public navigation | Fake `.test` account/session/evidence smoke workflow. | `npm run check:alpha-account-gating`; `npm run test` |
| App workflow preview | `app-preview.html` | `senior-capstone-app`, copied to `public-companion/` | `preview` | Public stakeholders and staff | No as canonical app | Clearly labeled workflow preview only. | `npm run check:production-surfaces` |
| Retired Titan Blend option | `stakeholder-options/titan-blend/` | `senior-capstone-option-titan` historical project | `retired-stakeholder-option` | Historical review only | No active deploy target | Titan direction absorbed into East Tech guide. | `npm run check:site-options` |
| Retired Back To Basics option | `stakeholder-options/back-to-basics/` | `senior-capstone-option-primary` historical project | `retired-stakeholder-option` | Historical review only | No active deploy target | Stakeholder comparison is over. | `npm run check:site-options` |

## Deploy Targets

| Surface | Deploy command | Project | Current role | Notes |
| --- | --- | --- | --- | --- |
| Capstone Project app/backend | `npm run deploy` | `senior-capstone-app` | Canonical product app/backend | Cloudflare project name remains a legacy technical identifier. |
| East Tech guide | `npm run deploy:public-site` | `senior-capstone-public` | Temporary/current guide deployment | Future custom guide domain remains TBD. |
| Preview branch | `npm run deploy:preview` | `senior-capstone-app` branch `alpha` | Internal preview | Not canonical production. |

Removed active scripts:

- `build:stakeholder-sites`
- `build:site-options`
- `dev:option:titan`
- `dev:option:primary`
- `deploy:option:titan`
- `deploy:option:primary`

## Normal Production Navigation Rule

Normal production navigation must not link to `alpha.html`, `account.html`, internal smoke/fake account pages, alpha reset/report tools, seeded walkthroughs, or retired stakeholder option pages. Such surfaces may remain in the repo only as clearly labeled internal QA/smoke/preview/historical artifacts and must not be presented as the normal student, family, mentor, teacher, or admin path.

## Generated Output

| Path | Deploy project | Classification | Intended audience | Production-safe | Reason | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| `public-companion/*.html` | `senior-capstone-public` | `generated-output` | East Tech students, families, staff, mentors | Yes for public guide | Generated mirror includes the source Student/Teacher guide mode through `public-companion/app.js`. | `npm run build:public-site`; `npm run check:generated-output-drift`; `npm run check:site-options` |
| `public-companion/app.js` | `senior-capstone-public` | `generated-output` | Browser asset for public guide | Yes | Generated JS mirror of public guide logic. | `npm run check:generated-output-drift`; `npm run check:production-surfaces` |
| `public-companion/styles.css` | `senior-capstone-public` | `generated-output` | Browser asset for public guide | Yes | Generated CSS mirror with Titan/East Tech tokens. | `npm run check:generated-output-drift`; `npm run check:site-options` |
| `stakeholder-options/**` | Historical retired Pages projects | `retired-stakeholder-option` | Historical review only | No active deploy target | Kept temporarily only as archived context. | `npm run check:site-options` |

## API Routes

Canonical app APIs deploy from `functions/api/**` on `senior-capstone-app`. Protected tenant/SSO/dashboard baseline routes are production functionality and must not be removed or weakened by naming/domain work:

- `/api/admin/dashboard`
- `/api/site/dashboard`
- `/api/site/students`
- `/api/site/students/:studentId`
- `/api/site/students/:studentId/timeline`
- `/api/site/review-queue`
- `/api/site/mentor-assignments`
- `/api/site/operations-readiness`
- `/api/program-teacher/dashboard`
- `/api/mentor/dashboard`
- `/api/auth/config`
- `/api/auth/google/start`
- `/api/auth/google/callback`
- `/api/auth/login`
- `/api/auth/me`
- `/api/student/dashboard`
- `/api/reviews/:submissionId/decision`
- `/api/reviews/:submissionId/history`
- `/api/submissions/:id/evidence`
- `/api/evidence/:id/download`

Announcement routes are removed from the active MVP product surface. The app should not replace school communication systems such as Remind, Canvas, Infinite Campus, Google Classroom, email, or district-approved tools. The legacy `announcements` database table remains deprecated/schema-only until a later safe cleanup phase.

Full route inventory is generated in `docs/generated/production-route-inventory.md` by:

```powershell
npm run inventory:production-routes
```

## Validation Commands

```powershell
npm run check:production-surfaces
npm run check:route-inventory
npm run check:generated-output-drift
npm run check:site-options
npm run check:custom-domain-cutover
npm run check:alpha-account-gating
npm run check:production-cutover
npm run check
```
