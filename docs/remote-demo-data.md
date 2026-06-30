# Remote Demo Data

Remote demo seeding is intentionally gated for Cloudflare D1:

```powershell
npm run seed:demo:remote:dry-run
npm run seed:demo:remote
npm run prove:demo:remote
```

`seed:demo:remote` expands to `--remote --write --confirm SEED_REMOTE_DEMO` and refuses remote write without `CLOUDFLARE_API_TOKEN`.

The multisite seed requires the remote D1 schema to include migration `0011_multisite_site_role_foundation.sql`. Phase 13B applied that migration gate. The current hosted sales-demo proof script reports the legacy synthetic remote demo seed is not present as a non-blocking compatibility Caveat.

Do not treat the legacy synthetic sales-demo seed as the current hosted demo-day path. Run `npm run prove:sales-demo:hosted` only when a technical reviewer asks for the deprecated compatibility check; the canonical hosted walkthrough uses fake `.test` accounts and `docs/sales/demo-day-operator-script.md`.

Current hosted fake-account click-around demo readiness is green for fake-account click-around only. The legacy synthetic sales-demo hosted proof is deprecated and does not block the current fake-account demo. Use the read-only/API gates plus the hosted browser proof:

```powershell
npm run prove:remote:migration-0011
npm run prove:sales-demo:hosted
npm run check:workspace:hosted-permissions
npm run check:workspace:hosted-dashboard
npm run check:workspace:hosted-evidence
npm run prove:hosted-fake-pilot-browser
```

Current schema/data/browser status:

```text
REMOTE_MIGRATION_0011_ALREADY_PRESENT
LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING
HOSTED_FAKE_ACCOUNT_PILOT_GREEN
GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF
SCREENSHOTS_GENERATED_SAFE
HOSTED_FAKE_ACCOUNTS_USED_FOR_BROWSER_PROOF
```

Previous hosted blocked status after migration 0011 and before remote seed:

```text
HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING
```

Previous blocked status while migration 0011 was missing:

```text
HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011
```

Current remote seed status:

```text
REMOTE_DEMO_SEED_MISSING_FOR_LEGACY_SALES_DEMO
```

Historical logs may still show `HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING`. Treat that as the old name for a missing legacy synthetic hosted sales-demo seed, not as a No-go for Hosted fake-account click-around demo readiness.

## Safety

- Demo users use only `demo-student.capstone.test` and `demo-staff.capstone.test`.
- No `nv.ccsd.net`, `gmail.com`, `thecapstoneapp.com`, or `learntechonline.com` demo users are created.
- Bryan admin accounts, real users, tenant/domain/provider rows, and Drive repository/settings rows are snapshotted and preserved.
- Cleanup deletes only demo-owned rows: `demo-` IDs, approved demo domains, `example.com/capstone-demo` evidence, or `DEMO_SEED` markers.
- No physical Google Drive files are created. Evidence uses metadata plus `https://example.com/capstone-demo/...` URLs only.
- Staff and persona credential files are written only under ignored `.secrets/demo-remote-staff-logins-*.json`; student credentials are not created.
- Hosted proof must not print, commit, paste, screenshot, or document credential values.
- The legacy synthetic sales-demo hosted API proof currently reports `LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING` when the old seed is absent.
- The 2026-06-29 browser proof uses approved fake hosted `.test` accounts for signed-out, Student, Program Teacher, Mentor, Viewer, Site Admin, Admin, misc_admin, and mobile Student surfaces. Generated remote staff credential files are not the walkthrough credential source.

## Seed Shape

- One fake organization: Desert Valley School District.
- Three fake sites: Desert Valley High School, Canyon Ridge Career Academy, and North Valley Technical High School.
- 370 fake students total: 250 at the primary site and 60 at each secondary site.
- 64 fake mentors.
- 1 primary-site fake program teacher per program plus secondary-site program teachers for mapped programs.
- 320 active mentor assignments, leaving 50 students intentionally unassigned.
- Fake platform admin, organization admin, site-administration, and viewer personas.
- All active programs are mapped to the primary site; each secondary site has five mapped programs.
- Fake submissions, evidence, comments, reviews, status history, submission versions, mentor meetings, presentation slots, and archive metadata.
- Named story buckets for model excellent, missing mentor, awaiting review, revision requested, presentation pending, archive ready, archive failed, high-risk, and rich timeline students.

Demo seeds no longer create announcements. Schools should continue using existing communication systems such as Remind, Canvas, Infinite Campus, Google Classroom, email, or district-approved tools. The legacy `announcements` table remains deprecated/schema-only until a later safe cleanup phase.

The legacy hosted sales-demo proof script verifies remote D1 counts, role scope boundaries, hosted dashboard rendering, site dashboard, student directory, student detail/timeline, review queue, mentor assignment, operations readiness API checks, example.com-only evidence, and absence of Drive ID or secret leaks in rendered API responses when the synthetic remote demo seed is present. It currently reports the remote demo seed is missing as a non-blocking compatibility Caveat. The 2026-06-29 pass separately adds hosted fake-account browser screenshots at `docs/sales/hosted-browser-proof-screenshot-index.md`.

Do not run remote reset, account reset, deploy, domain, OAuth, or Cloudflare config changes from the sales-demo proof phase.
