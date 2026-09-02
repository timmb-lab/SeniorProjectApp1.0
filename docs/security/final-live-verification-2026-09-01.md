# Final Live Verification Record

Date: 2026-09-01
Scope: authorized production deployment, D1 migration, fake `.test` account repair, public HTTPS, Cloudflare read-only security inspection, hosted permission checks, and signed-out browser checks.
Safety boundary: no real student or staff account exists or was used. Google Workspace SSO was not enabled. No WAF setting was changed.

## Completed

- Applied remote migration `0024_project_request_safety.sql`; Wrangler now reports no pending migrations.
- Built and deployed the reviewed app to Cloudflare Pages. Latest verified production deployment: `7db8559c-0f52-458b-b200-b6e99854adf0` (`https://7db8559c.senior-capstone-app.pages.dev`).
- Confirmed `https://thecapstoneapp.com/api/health` returns only `{ "ok": true }` to signed-out callers.
- Confirmed the deployed auth configuration keeps hardened local login enabled and Google Workspace SSO disabled and unconfigured.
- Confirmed production uses `link_only` evidence storage. Direct file upload is retired before multipart parsing and directs students to save a Google Drive link.
- Recreated the seven canonical fake `.test` role accounts with active credentials, current role/site memberships, a one-to-five-student project fixture, mentor/viewer assignment fixtures, and project-scoped student work.
- Repaired the fake accounts to hold exactly one intended role each. Existing role rows are removed before the canonical role is inserted, preventing stale higher-role access from surviving a repair.
- Passed the hosted permission matrix for Student, Program Teacher, Mentor, Viewer, Misc Admin, Site Admin, and Global Admin. The only skip was a future student archive download whose fixture is not yet archive-ready.
- Passed the hosted Drive-link contract: fake student login, seeded project work, upload retirement, and Save/Open Drive-link actions.
- Confirmed CSP, HSTS, MIME-sniffing protection, frame denial, and no-store headers on the live site.
- Confirmed the canonical workspace route and static assets load from the production hostname.
- Verified the signed-out sign-in experience in light and dark views. The corrected notice contrast is live, the sign-in card no longer has a nested scrollbar, and the 390-by-844 phone check has no horizontal overflow.
- Read both Cloudflare product zones and their deployed rulesets. `thecapstoneapp.com` and `thecapstoneproject.com` are active and each has Cloudflare normalization, the Managed Free WAF ruleset, and the DDoS L7 ruleset.
- Recorded decision `HD-2026-09-01-001`: Google Workspace SSO is not approved for this launch. Local hardened login remains enabled; app-native MFA/passkeys remain future work.
- Completed authenticated live browser walkthroughs for Student, Mentor, Program Teacher, Viewer, School Admin, Site Admin, and Global Admin. Each role reached every visible main section without a dead end, a stuck loading state, or a changing browser address.
- Verified the live East Career & Technical Academy theme in both light and dark views and the live Desert Valley theme through the school switcher. The `east-tech` school theme remains active across the light/dark switch, with the intended Segoe UI/Arial/Verdana body font stack. Canyon Ridge and North Valley remain covered by the enforced four-theme source/browser contract because those sites are not present in the current canonical hosted fake-account fixture.
- Fixed three issues found during the walkthrough: slow presentation schedule loading, broken Projects/Reports helpers after module splitting, and the Global Admin assignment list querying the retired `cohorts.name` field.
- Confirmed Site Admin and School Admin surfaces expose project/program management, student templates, access assignments, and scoped password-reset controls without exposing authentication implementation details to users.
- Passed the refreshed hosted fake-account browser proof: 10 of 10 captures passed across signed-out, seven role types, 1440-pixel desktop, 820-pixel tablet, and 390-pixel phone views. The proof now rejects visible unavailable/load-failure states instead of accepting headings alone.
- Passed the full repository check after the live repairs: 560 tests discovered, 556 passed, 0 failed, and 4 credential-backed local HTTP checks skipped by design. Type checking, production build, and diff validation also passed.

## Authenticated Browser Walkthrough Result

- Student: Today, My Project, Feedback, and Final Checklist opened successfully with the Drive-folder/link workflow visible.
- Mentor: Today, Projects, Reviews, and Reports opened successfully and remained limited to assigned students.
- Program Teacher: Today, Projects, Reviews, and Reports opened successfully; the school choice appears only when the teacher has more than one valid school scope.
- Viewer: Today, Projects, and Reports opened successfully as read-only views.
- School Admin: Workspace Today, Projects, and Reports plus Admin Console Overview, People, Imports, and Reports opened successfully.
- Site Admin: Workspace Today, Projects, Reviews, and Reports plus Admin Console Overview, People, Programs, and Reports opened successfully.
- Global Admin: all Workspace areas and Admin Console Overview, People, Students, Assignments, Programs, Imports, Reports, and Audit opened successfully.
- The visible address stayed `https://thecapstoneapp.com/workspace` throughout navigation and school/theme changes.
- The refreshed credential-backed hosted proof passed desktop, tablet, and phone captures without a visible unavailable or load-failure state.
- Full details are recorded in `docs/progress/runs/2026-09-01-live-role-browser-verification.md`.

## Remaining Risks Before Real Users

- Local staff accounts do not yet have app-native MFA or passkeys. Google Workspace SSO is intentionally disabled by decision.
- Managed Cloudflare WAF and DDoS rules are active, but no custom auth- or API-specific edge rate-limit rule was proven during this read-only inspection.
- Real-user credential delivery, district privacy approval, incident ownership, retention, and support procedures still need named owners before any real student record is entered.

The reviewed deployment is usable for fake-data testing. It must not be described as approved for real students until the remaining organizational controls and staff MFA path are accepted or completed.
