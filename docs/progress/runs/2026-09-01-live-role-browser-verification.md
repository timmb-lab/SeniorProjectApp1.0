# Live Role Browser Verification

Date: 2026-09-01
Production address: `https://thecapstoneapp.com/workspace`
Current deployment: `https://a94618d9.senior-capstone-app.pages.dev`
Data boundary: canonical fake `.test` accounts and synthetic project data only. No real user account or student record was used. Passwords are intentionally omitted.

## Result

All seven roles completed their visible primary navigation in the production browser during the role walkthrough. The current release was then rechecked with the signed-in Site Admin and its read-only student preview after the final migrations and template release. The address remained `/workspace`, school and role scopes stayed intact, and no current screen remained stuck on Loading or ended without a working next or back action.

| Role | Live sections checked | Result |
|---|---|---|
| Student | Today, My Project, Feedback, Final Checklist | Pass |
| Mentor | Today, Projects, Reviews, Reports | Pass |
| Program Teacher | Today, Projects, Reviews, Reports | Pass |
| Viewer | Today, Projects, Reports | Pass; read-only |
| School Admin | Workspace Today, Projects, Reports; Admin Overview, People, Imports, Reports | Pass |
| Site Admin | Workspace Today, Projects, Reviews, Reports; Admin Overview, People, Programs, Reports | Pass |
| Global Admin | All Workspace areas; Admin Overview, People, Students, Assignments, Programs, Imports, Reports, Audit | Pass |

## Usability and Branding

- The sign-in screen uses one simple email/password path. It does not show Google/local account or identity-provider implementation language.
- Student screens use short next-step language and keep the Google Drive folder/link workflow visible.
- Staff screens use a stable tiered navigation pattern and reveal supporting details only when needed.
- School Admin and Site Admin can reach project/program management, templates, access assignments, and scoped password-reset controls.
- East Career & Technical Academy loaded with `data-school-theme="east-tech"` in both light and dark views.
- Desert Valley loaded with `data-school-theme="desert-valley"` through the same live school switcher. Canyon Ridge and North Valley are not in the canonical hosted fixture; their palettes remain enforced by the four-theme browser/source contract.
- The live body font stack remained `Segoe UI`, Arial, Verdana, sans-serif across the theme switch.
- The refreshed hosted fake-account proof passed 10 of 10 captures: signed-out plus seven role types, with 1440-by-1000 desktop, 820-by-900 tablet, and 390-by-844 phone coverage. It rejects visible unavailable and load-failure states.

## Issues Found and Repaired During the Walkthrough

1. Presentation schedule requests could take long enough to stall the School Admin screen. The endpoint now loads effective access once and filters the bounded result set in memory.
2. Projects and Reports could call shared helpers before their lazy feature module made them available. The always-needed helpers now live in the shared workspace module.
3. Global Admin role assignments queried the retired `cohorts.name` column. The route now reads the current `cohorts.label` column.
4. Fake account repair could leave stale role rows in place. Repair now removes existing roles before inserting exactly the canonical role.
5. Client API requests could wait forever. Workspace requests now stop after 15 seconds and show the existing safe retry guidance.
6. The first starter-template release called a student-only phase-label helper from the staff Projects screen. The helper now lives in the always-loaded shared module, its asset version was advanced, and the current live Projects screen loads all seven templates with no new browser errors.

## Final Checks

- `npm test`: pass; 576 tests, 572 pass, 0 fail, 4 intentional local HTTP skips.
- `npm run prove:hosted-fake-pilot-browser`: prior all-role pass; 10 of 10 production captures. The current release was rechecked live through Site Admin, Projects, one project, Reviews, and the read-only student Today/My Project/reflection paths.
- `npm run typecheck`: pass.
- `npm run build:app`: pass; 31 production root assets.
- Current live Projects proof: 251 projects, 251 with both required adults confirmed, seven checked starter templates, stable `/workspace` address, and zero browser errors from the current `release13` assets.

## Real-User Boundary

This proves fake-data usability and role behavior. It does not approve a real-student launch. Google Workspace SSO remains intentionally disabled. Staff TOTP MFA with one-use recovery codes is now enforced, and the local backup/restore rehearsal passes. The production import gate remains closed until the named privacy, support, retention, incident, data-owner, roster, and managed credential-delivery approvals are recorded.
