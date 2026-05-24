# Remote Demo Data

Remote demo seeding is intentionally gated for Cloudflare D1:

```powershell
npm run seed:demo:remote:dry-run
npm run seed:demo:remote
npm run prove:demo:remote
```

`seed:demo:remote` expands to `--remote --write --confirm SEED_REMOTE_DEMO` and refuses remote write without `CLOUDFLARE_API_TOKEN`.

The multisite seed requires the remote D1 schema to include migration `0011_multisite_site_role_foundation.sql`. Phase 13B applied that migration gate. Phase 13C applied the approved fake-data remote demo seed through the existing confirmation-gated npm alias.

No remote demo seed was run in Phase 13B; the seed was applied later in Phase 13C.

Current hosted sales proof status is fake-data/API ready, with browser and screenshot proof ready with caveats. Use the read-only gates:

```powershell
npm run prove:remote:migration-0011
npm run prove:sales-demo:hosted
```

Expected Phase 13C schema/data status:

```text
REMOTE_MIGRATION_0011_ALREADY_PRESENT
REMOTE_DEMO_SEED_PRESENT
HOSTED_PROOF_READY_FAKE_DATA_BROWSER_PROOF_PENDING
```

Expected Phase 14 browser status:

```text
HOSTED_BROWSER_PROOF_READY_WITH_CAVEATS
SCREENSHOTS_GENERATED_SAFE
EXISTING_FAKE_HOSTED_CREDENTIALS_USED_FOR_BROWSER_PROOF
```

Previous hosted blocked status after migration 0011 and before remote seed:

```text
HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING
```

Previous blocked status while migration 0011 was missing:

```text
HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011
```

Phase 13C remote seed status:

```text
REMOTE_DEMO_SEED_APPLIED_HOSTED_BROWSER_PROOF_PENDING
```

## Safety

- Demo users use only `demo-student.capstone.test` and `demo-staff.capstone.test`.
- No `nv.ccsd.net`, `gmail.com`, `thecapstoneapp.com`, or `learntechonline.com` demo users are created.
- Bryan admin accounts, real users, tenant/domain/provider rows, and Drive repository/settings rows are snapshotted and preserved.
- Cleanup deletes only demo-owned rows: `demo-` IDs, approved demo domains, `example.com/capstone-demo` evidence, or `DEMO_SEED` markers.
- No physical Google Drive files are created. Evidence uses metadata plus `https://example.com/capstone-demo/...` URLs only.
- Staff and persona credential files are written only under ignored `.secrets/demo-remote-staff-logins-*.json`; student credentials are not created.
- Phase 13C did not print, commit, paste, screenshot, or document credential values. The generated staff credential file was written under ignored `.secrets`.
- Phase 13C hosted API proof used existing fake hosted credentials after the generated remote demo staff credentials were rejected by hosted login.
- Phase 14 browser proof used the existing fake hosted admin, program teacher, and mentor credential path. Generated remote staff credentials still fail hosted login and were not repaired. Viewer browser proof is blocked because the safe existing fake hosted credential file does not include a viewer account.

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

The Phase 13C proof script verifies remote D1 counts, role scope boundaries, hosted dashboard rendering, site dashboard, student directory, student detail/timeline, review queue, mentor assignment, operations readiness API checks, example.com-only evidence, and absence of Drive ID or secret leaks in rendered API responses. Phase 14 adds hosted browser screenshots with caveats at `docs/sales/hosted-browser-proof-screenshot-index.md`.

Do not run remote reset, account reset, deploy, domain, OAuth, or Cloudflare config changes from the sales-demo proof phase.
