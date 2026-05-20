# Production Surface Registry

Date: 2026-05-20

Classification values: `production`, `internal-alpha`, `internal-smoke`, `stakeholder-review`, `generated-output`, `legacy`, `unknown`.

Production-safe means the surface is safe to present in its intended context. A review artifact can be production-safe for review while still not being canonical production.

## Deploy Targets

| Surface | Path | Deploy project | Classification | Audience | Production-safe | Reason | Action needed | Owner lane | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Root app/backend host | `.` | `senior-capstone-app` | `production` | Students, staff, mentors, admins, stakeholders | Yes, with internal QA routes fenced | Canonical app/backend project with Cloudflare Pages Functions and D1 binding. | Keep `alpha.html` and `account.html` out of normal public navigation; keep production checker passing. | deployment-qa | `npm run check:production-surfaces`; `npm run check:cloudflare` |
| Public companion output | `public-companion/` | `senior-capstone-public` | `generated-output` | Students, families, staff, mentors | Yes | Generated public guide output, safe only as a static guide. | Rebuild only from root source; do not proxy internal alpha/account/API routes. | requirements-audit | `npm run build:public-site`; `npm run check:site-options`; `npm run check:production-surfaces` |
| Titan Blend option | `stakeholder-options/titan-blend/` | `senior-capstone-option-titan` | `stakeholder-review` | Bryan, leadership, stakeholders reviewing visual direction | Yes for review, no as canonical production | Generated visual direction artifact. | Keep review banner and internal alpha labels; do not promote without Bryan decision. | design-assets-handoff | `npm run build:stakeholder-sites`; `npm run check:site-options` |
| Back To Basics option | `stakeholder-options/back-to-basics/` | `senior-capstone-option-primary` | `stakeholder-review` | Bryan, leadership, stakeholders reviewing visual direction | Yes for review, no as canonical production | Generated visual direction artifact. | Keep review banner and internal alpha labels; do not promote without Bryan decision. | design-assets-handoff | `npm run build:stakeholder-sites`; `npm run check:site-options` |
| Root alpha page | `alpha.html` | `senior-capstone-app` | `internal-alpha` | Bryan and QA testers | No for public production navigation | Internal seeded alpha walkthrough. | Keep internal QA labels; no real student records; no passwords. | student-workflow-evidence | `npm run check:alpha-contract`; `npm run test` |
| Root account page | `account.html` | `senior-capstone-app` | `internal-smoke` | Bryan and QA testers | No for public production navigation | Internal account/session/evidence smoke workflow for fake `.test` accounts. | Keep internal QA labels; do not expose passwords; do not link from public nav. | backend-security-data | `npm run test`; `npm run check:production-surfaces` |
| App workflow preview | `app-preview.html` | `senior-capstone-app`, copied to `public-companion/`, generated into stakeholder options | `production` | Public stakeholders and staff | Yes if labeled as non-production preview | Public app-boundary preview, not the live student-record system. | Avoid finished-app claims; keep internal QA links out of normal flow. | requirements-audit | `npm run check:production-surfaces` |
| Preview branch deploy | `npm run deploy:preview` | `senior-capstone-app` branch `alpha` | `internal-alpha` | Bryan and QA testers | No as canonical production | Preview/alpha deploy branch only. | Do not describe as production; verify live only when auth/token is available. | deployment-qa | `npm run check:cloudflare` |

## Root Public HTML Entry Points

| Path | Deploy project | Classification | Intended audience | Production-safe | Reason | Action needed | Owner lane | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `index.html` | `senior-capstone-app` | `production` | Students, families, staff, mentors | Yes | Canonical public guide home on the app host. | Keep nav free of internal QA links. | requirements-audit | `npm run check:production-surfaces` |
| `program.html` | `senior-capstone-app` | `production` | Students and staff | Yes | Program requirement guide page. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `sponsorship-support.html` | `senior-capstone-app` | `production` | Students, families, sponsors | Yes | Public support guidance. | None beyond checker. | requirements-audit | `npm run check:production-surfaces` |
| `calendar.html` | `senior-capstone-app` | `production` | Students, families, staff | Yes | Public milestone guide. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `process.html` | `senior-capstone-app` | `production` | Students | Yes | Public phase overview. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `phase-1.html` | `senior-capstone-app` | `production` | Students | Yes | Public phase route. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `phase-2a.html` | `senior-capstone-app` | `production` | Students | Yes | Public phase route. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `gathering-supplies.html` | `senior-capstone-app` | `production` | Students | Yes | Public support page. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `managing-your-vision.html` | `senior-capstone-app` | `production` | Students | Yes | Public support page. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `mentor-meeting-1.html` | `senior-capstone-app` | `production` | Students and mentors | Yes | Public mentor prep page. | None beyond checker. | staff-review-mentor | `npm run check:production-surfaces` |
| `phase-2b.html` | `senior-capstone-app` | `production` | Students | Yes | Public phase route. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `sprint-to-finish.html` | `senior-capstone-app` | `production` | Students | Yes | Public support page. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `mentor-meeting-2.html` | `senior-capstone-app` | `production` | Students and mentors | Yes | Public mentor prep page. | None beyond checker. | staff-review-mentor | `npm run check:production-surfaces` |
| `present.html` | `senior-capstone-app` | `production` | Students and staff | Yes | Public presentation guide. | None beyond checker. | staff-review-mentor | `npm run check:production-surfaces` |
| `project-showcase.html` | `senior-capstone-app` | `production` | Students, families, staff | Yes | Public showcase guide. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `celebrate.html` | `senior-capstone-app` | `production` | Students, families, staff | Yes | Public celebration guide. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `launch.html` | `senior-capstone-app` | `production` | Students | Yes | Public launch/portfolio route. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `finish.html` | `senior-capstone-app` | `production` | Students | Yes | Public finish route. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `pacing.html` | `senior-capstone-app` | `production` | Students | Yes | Public pacing guide. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `examples.html` | `senior-capstone-app` | `production` | Students | Yes | Public examples/support page. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `links.html` | `senior-capstone-app` | `production` | Students and staff | Yes | Public official-link reminder page. | None beyond checker. | requirements-audit | `npm run check:production-surfaces` |
| `templates.html` | `senior-capstone-app` | `production` | Students | Yes | Public starter template page. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `portfolio.html` | `senior-capstone-app` | `production` | Students | Yes | Public portfolio guide. | None beyond checker. | student-workflow-evidence | `npm run check:production-surfaces` |
| `rubrics.html` | `senior-capstone-app` | `production` | Students and staff | Yes | Public rubric guide. | None beyond checker. | staff-review-mentor | `npm run check:production-surfaces` |
| `grades.html` | `senior-capstone-app` | `production` | Students and staff | Yes | Public grading/recognition guide. | None beyond checker. | requirements-audit | `npm run check:production-surfaces` |
| `start.html` | `senior-capstone-app` | `production` | Students | Yes | Root alias to the purpose phase. | Keep as alias or retire later if analytics show no use. | requirements-audit | `npm run check:production-surfaces` |
| `audit.html` | `senior-capstone-app` | `legacy` | Existing bookmarks | Yes | Redirects to `index.html`. | Keep only as legacy redirect or remove after decision. | requirements-audit | `npm run check:production-surfaces` |
| `roadmap.html` | `senior-capstone-app` | `legacy` | Existing bookmarks | Yes | Redirects to `index.html`. | Keep only as legacy redirect or remove after decision. | requirements-audit | `npm run check:production-surfaces` |

## Generated Output

| Path | Deploy project | Classification | Intended audience | Production-safe | Reason | Action needed | Owner lane | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `public-companion/*.html` | `senior-capstone-public` | `generated-output` | Students, families, staff, mentors | Yes | Generated public guide mirror. | Rebuild from root source only; keep production checker passing. | requirements-audit | `npm run build:public-site`; `npm run check:site-options`; `npm run check:production-surfaces` |
| `public-companion/app.js` | `senior-capstone-public` | `generated-output` | Browser asset for public guide | Yes | Generated JS mirror of public guide logic. | Do not add internal QA labels or fake/test account copy. | requirements-audit | `npm run check:production-surfaces` |
| `public-companion/styles.css` | `senior-capstone-public` | `generated-output` | Browser asset for public guide | Yes | Generated CSS mirror. | Rebuild from source. | requirements-audit | `npm run check:site-options` |
| `public-companion/templates/**` | `senior-capstone-public` | `generated-output` | Students | Yes | Generated starter files. | Rebuild from source templates. | student-workflow-evidence | `npm run check:site-options` |
| `stakeholder-options/titan-blend/*.html` | `senior-capstone-option-titan` | `stakeholder-review` | Stakeholder reviewers | Yes for review | Generated Option 2 direction pages. | Keep review-only banner. | design-assets-handoff | `npm run check:site-options` |
| `stakeholder-options/back-to-basics/*.html` | `senior-capstone-option-primary` | `stakeholder-review` | Stakeholder reviewers | Yes for review | Generated Option 3 direction pages. | Keep review-only banner. | design-assets-handoff | `npm run check:site-options` |

## API Routes

| Route | Source path | Deploy project | Classification | Intended audience | Production-safe | Reason | Action needed | Owner lane | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/api/health` | `functions/api/health.ts` | `senior-capstone-app` | `production` | Ops and health checks | Yes | Readiness status without secrets. | Keep secret values redacted. | deployment-qa | `npm run check:cloudflare`; `npm run test` |
| `/api/auth/bootstrap` | `functions/api/auth/bootstrap.ts` | `senior-capstone-app` | `production` | Bryan/admin setup | Yes when setup key absent | First-admin setup route, gated by setup key and disabled after setup. | Keep live setup key removed. | backend-security-data | `npm run test` |
| `/api/auth/login` | `functions/api/auth/login.ts` | `senior-capstone-app` | `production` | Future app users and QA accounts | Yes | Hardened pilot auth endpoint. | Complete account lifecycle before pilot. | backend-security-data | `npm run test` |
| `/api/auth/logout` | `functions/api/auth/logout.ts` | `senior-capstone-app` | `production` | Future app users and QA accounts | Yes | Session revocation endpoint. | Keep audit/session tests passing. | backend-security-data | `npm run test` |
| `/api/auth/me` | `functions/api/auth/me.ts` | `senior-capstone-app` | `production` | Future app users and QA accounts | Yes | Current session endpoint. | Keep role/scope redaction safe. | backend-security-data | `npm run test` |
| `/api/alpha/state` | `functions/api/alpha/state.js` | `senior-capstone-app` | `internal-alpha` | Bryan and QA testers | No for public production users | Server-owned alpha walkthrough state. | Keep internal labels and no real records. | student-workflow-evidence | `npm run check:alpha-contract`; `npm run test` |
| `/api/admin/test-accounts` | `functions/api/admin/test-accounts.ts` | `senior-capstone-app` | `internal-smoke` | Bryan/admin QA | No for public production users | Seeds fake QA role accounts and fixtures. | Keep passwords out of responses/docs. | backend-security-data | `npm run test` |
| `/api/student/dashboard` | `functions/api/student/dashboard.ts` | `senior-capstone-app` | `production` | Signed-in students | Yes after auth hardening | Student dashboard data route. | Broaden permission tests before real records. | student-workflow-evidence | `npm run test` |
| `/api/submissions/:id/submit` | `functions/api/submissions/[id]/submit.ts` | `senior-capstone-app` | `production` | Signed-in students | Yes after auth hardening | Submission status route. | Keep evidence gate and audit tests. | student-workflow-evidence | `npm run test` |
| `/api/submissions/:id/evidence` | `functions/api/submissions/[id]/evidence.ts` | `senior-capstone-app` | `production` | Signed-in students | Yes after auth hardening | Evidence-link metadata route. | Complete Drive credentials before real uploads. | student-workflow-evidence | `npm run test` |
| `/api/submissions/:id/evidence/upload` | `functions/api/submissions/[id]/evidence/upload.ts` | `senior-capstone-app` | `production` | Signed-in students | No until Drive secrets are verified live | Drive file-byte upload route. | Verify real upload/download before pilot. | student-workflow-evidence | `npm run test` |
| `/api/evidence/repository` | `functions/api/evidence/repository.ts` | `senior-capstone-app` | `production` | Signed-in users | Yes | Evidence repository metadata route. | Keep storage IDs scoped/redacted. | backend-security-data | `npm run test` |
| `/api/evidence/drive-probe` | `functions/api/evidence/drive-probe.ts` | `senior-capstone-app` | `production` | Admin/QA | No until Drive secrets verified | Drive credential probe. | Verify real credentials through health/probe. | deployment-qa | `npm run test` |
| `/api/evidence/:id/check-access` | `functions/api/evidence/[id]/check-access.ts` | `senior-capstone-app` | `production` | Signed-in scoped users | Yes after permission hardening | Protected evidence authorization route. | Keep denial/audit tests broad. | backend-security-data | `npm run test` |
| `/api/evidence/:id/download` | `functions/api/evidence/[id]/download.ts` | `senior-capstone-app` | `production` | Signed-in scoped users | No until Drive secrets verified | Protected Drive download route. | Verify real download and no storage-id leaks. | backend-security-data | `npm run test` |
| `/api/teacher/review-queue` | `functions/api/teacher/review-queue.ts` | `senior-capstone-app` | `production` | Program teachers/admins | Yes after permission hardening | Teacher review queue route. | Add broader dashboard/queue tests. | staff-review-mentor | `npm run test` |
| `/api/reviews/:submissionId/decision` | `functions/api/reviews/[submissionId]/decision.ts` | `senior-capstone-app` | `production` | Program teachers/admins | Yes after permission hardening | Review/comment/revision/approval route. | Keep immutable history tests. | staff-review-mentor | `npm run test` |
| `/api/reviews/:submissionId/history` | `functions/api/reviews/[submissionId]/history.ts` | `senior-capstone-app` | `production` | Scoped users | Yes after permission hardening | Review history route. | Keep storage identifiers out of responses. | staff-review-mentor | `npm run test` |
| `/api/mentor/assigned` | `functions/api/mentor/assigned.ts` | `senior-capstone-app` | `production` | Mentors | Yes after permission hardening | Assigned-student route. | Add presentation-slot workflow. | staff-review-mentor | `npm run test` |
| `/api/mentor/meetings` | `functions/api/mentor/meetings.ts` | `senior-capstone-app` | `production` | Mentors | Yes after permission hardening | Mentor meeting route. | Add conflict/attendance depth. | staff-review-mentor | `npm run test` |
| `/api/admin/announcements` | `functions/api/admin/announcements.ts` | `senior-capstone-app` | `production` | Admins | Yes after admin hardening | Admin announcement create route. | Keep no student messaging. | admin-ops-reporting | `npm run test` |
| `/api/announcements` | `functions/api/announcements.ts` | `senior-capstone-app` | `production` | Signed-in users | Yes after auth hardening | Scoped announcement list route. | Keep scope tests. | admin-ops-reporting | `npm run test` |
| `/api/admin/exports/student-archive` | `functions/api/admin/exports/student-archive.ts` | `senior-capstone-app` | `production` | Admins | No until signed artifact generation exists | Archive queue route. | Implement artifact generation and retention. | admin-ops-reporting | `npm run test` |
| `/api/exports/:id/download` | `functions/api/exports/[id]/download.ts` | `senior-capstone-app` | `production` | Admins/scoped students | No until signed downloads exist | Export download placeholder route. | Implement signed download behavior. | admin-ops-reporting | `npm run test` |
| `/api/reports/readiness` | `functions/api/reports/readiness.ts` | `senior-capstone-app` | `production` | Admin/misc admin | Yes after misc-admin hardening | Aggregate-only readiness report route. | Keep student-level data out. | admin-ops-reporting | `npm run test` |
| `/api/admin/audit-events` | `functions/api/admin/audit-events.ts` | `senior-capstone-app` | `production` | Admins | Yes after audit hardening | Redacted audit-event route. | Keep sensitive metadata redacted. | admin-ops-reporting | `npm run test` |
| `/api/admin/mentor-assignments` | `functions/api/admin/mentor-assignments.ts` | `senior-capstone-app` | `production` | Admins | Yes after admin hardening | Mentor assignment management route. | Keep role guards/audit tests. | admin-ops-reporting | `npm run test` |
| `/api/admin/role-assignments` | `functions/api/admin/role-assignments.ts` | `senior-capstone-app` | `production` | Admins | Yes after admin hardening | Role assignment management route. | Keep scope validation/audit tests. | admin-ops-reporting | `npm run test` |

## Generated Source Of Truth

| Output | Source of truth | Classification | Production-safe | Validation |
| --- | --- | --- | --- | --- |
| `public-companion/` | `scripts/build-public-site.mjs`, root public pages, `app.js`, `styles.css`, `assets/`, `templates/` | `generated-output` | Yes for public guide | `npm run build:public-site`; `npm run check:site-options`; `npm run check:production-surfaces` |
| `stakeholder-options/titan-blend/` | `scripts/build-stakeholder-sites.mjs` | `stakeholder-review` | Yes for review only | `npm run build:stakeholder-sites`; `npm run check:site-options` |
| `stakeholder-options/back-to-basics/` | `scripts/build-stakeholder-sites.mjs` | `stakeholder-review` | Yes for review only | `npm run build:stakeholder-sites`; `npm run check:site-options` |
