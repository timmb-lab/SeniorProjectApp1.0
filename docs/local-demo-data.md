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
- Demo staff credentials are written only to ignored `.secrets/demo-staff-logins-*.json` files and are never printed or committed.

## Seed Shape

- 250 fake students across all nine programs.
- 12 fake program teachers with program-scoped `program_teacher` roles.
- 25 fake mentors with active mentor roles.
- 225 active mentor assignments, leaving 25 students intentionally without mentors.
- Mixed proposal, revision, approval, build, presentation, completion, and high-risk states.
- Fake submissions, evidence metadata, comments, reviews, submission versions, mentor meetings, presentation slots, archive export metadata, and audit markers when the local schema supports those tables.

Demo seeds no longer create announcements. Schools should continue using their existing communication systems; the legacy `announcements` table is deprecated/schema-only until a later safe cleanup phase.

The seeder is deterministic and idempotent. It deletes only demo-owned rows identified by `demo-` IDs, demo `.test` domains, or explicit `DEMO_SEED` markers, then recreates the same local demo workspace shape.
