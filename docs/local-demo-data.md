# Local Demo Data

The local demo workspace seed creates a synthetic Capstone Project operating environment for functional demos while real student onboarding remains blocked pending legal/district approval and SSO policy.

Run the dry run first:

```powershell
npm run seed:demo:local:dry-run
```

Then reset only demo-owned rows and reseed:

```powershell
npm run seed:demo:local:reset
```

Prove the API dashboard paths can see the data:

```powershell
npm run prove:local-admin-logins
npm run prove:demo:local
npm run prove:sales-demo:local
```

## Safety

- Local-only; the seeder refuses remote D1.
- Synthetic `.test` accounts only.
- Student emails use `demo-student.capstone.test`.
- Staff and mentor emails use `demo-staff.capstone.test`.
- No `nv.ccsd.net` accounts are created.
- No real student records, parent records, phone numbers, addresses, or school usernames are used.
- No physical Google Drive files are uploaded or created.
- Demo evidence is metadata-only and uses `https://example.com/capstone-demo/...` links.
- The protected local admins `bryan@learntechonline.com` and `bryan.timm89@gmail.com` are verified and preserved.
- Demo staff and persona credentials are written only to ignored `.secrets/demo-staff-logins-*.json` files and are never printed or committed.

## Seed Shape

- One fake organization: Desert Valley School District.
- Three fake sites: Desert Valley High School, Canyon Ridge Career Academy, and North Valley Technical High School.
- 370 fake students total: 250 at the primary site and 60 at each secondary site.
- 22 fake program teachers with program-scoped `program_teacher` roles and site memberships.
- 41 fake mentors with active mentor roles and site memberships.
- 320 active mentor assignments, leaving 50 students intentionally without active mentors.
- Fake platform admin, organization admin, site-administration, and viewer personas.
- All active programs are mapped to the primary site; each secondary site has five mapped programs.
- Mixed proposal, revision, approval, build, presentation, completion, and high-risk states.
- Fake submissions, evidence metadata, comments, reviews, submission versions, mentor meetings, presentation slots, archive export metadata, and audit markers when the local schema supports those tables.
- Named story buckets for model excellent, missing mentor, awaiting review, revision requested, presentation pending, archive ready, archive failed, high-risk, and rich timeline students.

Demo seeds no longer create announcements. Schools should continue using their existing communication systems; the legacy `announcements` table is deprecated/schema-only until a later safe cleanup phase.

The seeder is deterministic and idempotent. It deletes only demo-owned rows identified by `demo-` IDs, demo `.test` domains, or explicit `DEMO_SEED` markers, then recreates the same local demo workspace shape.

Sales demo docs live in `docs/sales/`. The local sales proof is a non-mutating wrapper around the current local demo proof; it summarizes the screens, route surfaces, role proof, story buckets, and redaction checks without printing credential values.
