# Senior Project App closeout

Date: 2026-09-02

## Release result

- Runtime commit: `66252982` (`Complete project-first capstone workflow and hardening`)
- Cloudflare Pages deployment: `https://f9a67a3e.senior-capstone-app.pages.dev`
- Primary address: `https://thecapstoneapp.com/` (`/workspace` redirects to this one app address)
- Database: migration `0030_site_branding.sql` applied; Wrangler now reports no pending migrations.
- Data boundary: fake `.test` accounts and synthetic data only. No real student or staff record was created or used.

## What is now complete

- The app is project-first. Students, Mentor, Program Teacher, links, writing, reviews, status, and next steps stay centered on the selected project.
- A project can have one to five students. Students can propose a project and tag teammates, a Mentor, and a Program Teacher.
- Active projects require one accepted Mentor and one accepted Program Teacher. Draft/setup work remains available before activation.
- Students can write guided reflections, save work for future phases, use school templates, and submit Google Drive links. The app does not take control of student Drive folders.
- Teacher, Mentor, student, viewer, School Admin, Site Admin, and global admin surfaces are role-specific and use plain next-step language.
- School admins can manage projects, groups, template links, school branding, and allowed password resets within their scope.
- Light and dark views, responsive phone/tablet/desktop layouts, East Tech typography, and data-driven school themes are implemented.
- The visible browser address stays on the one app address while in-app state is kept in bounded browser history.
- Local sign-in remains the approved identity model. Normal users are not shown Google/local implementation language.
- Production security includes MFA for Program Teachers and viewers, scoped authorization, mutation-origin checks, rate limiting, redacted audits, strict response headers, content-versioned assets, and a CSP that blocks inline style attributes. Administrative roles are exempt from MFA by owner decision `HD-2026-09-02-002`.
- The primary domain and both `www` aliases are active. The secondary domain redirects to the primary domain, and the retired `app.` hostname check passes.

## Evidence

- Full repository gate: 584 tests, 580 passed, 4 credential-dependent local-browser tests skipped, 0 failed.
- Rendered UI sweep: 100 of 100 screens passed across roles, school brands, light/dark views, desktop, tablet, Chromebook, half-screen, and phone layouts. Evidence: `docs/progress/runs/2026-06-30-workspace-ui-polish-browser-proof.json`.
- Hosted role walkthrough: 10 of 10 screens passed with 0 failures for signed-out, student, Program Teacher, Mentor, viewer, School Admin, Site Admin, and admin flows. Evidence: `docs/progress/runs/2026-06-29-hosted-fake-pilot-browser-proof.json`.
- Hosted permission checks passed for student, Program Teacher, Mentor, viewer, Misc Admin, Site Admin, and admin. Viewer mutation denials and school/admin privilege boundaries passed.
- Hosted Google Drive evidence check passed: link-only storage, retired direct upload, minimal signed-out health response, and student save/open link behavior.
- Cloudflare live checks passed for the Pages project, D1 database identity, custom domain associations, HTTPS behavior, and the retired hostname.

## External items that cannot be self-approved

The fake-account app and hosted walkthrough are green. A real-student pilot remains `NO_GO` until the school or district supplies these four approvals:

1. Approved pilot-shaped accounts and a redacted role-scope proof.
2. Roster-owner validation of the real import file.
3. Privacy, support, retention, and data-ownership approval.
4. Approval for secure managed-local credential delivery. Google Workspace SSO remains intentionally unapproved and disabled.

Cloudflare firewall/ruleset contents could not be read. The configured token can verify Pages and D1, but it returns no zones and receives `403` for zone rulesets. A Cloudflare owner must grant zone read plus ruleset read access before WAF and zone-level rate-limit coverage can be verified. No firewall setting was changed or claimed.

## Operating note

The Admin Overview Sheet is at `docs/admin/Senior-Project-Admin-Overview.docx`. Test passwords and MFA secrets remain only in ignored local credential files and are not included in this report or Git history.
