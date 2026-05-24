# Hosted Proof Plan

## Current Hosted Proof Status

Hosted fake-data proof is ready at the data/API gate, with browser and screenshot proof still pending.

Do not claim browser walkthrough readiness, screenshot proof, real pilot readiness, FERPA certification, or production readiness.

Phase 13C applied the approved remote fake-data demo seed and proved the seeded shape through remote D1 plus hosted read-only API checks. The current read-only hosted proof status is:

```text
HOSTED_PROOF_READY_FAKE_DATA_BROWSER_PROOF_PENDING
```

Phase-level status:

```text
REMOTE_DEMO_SEED_APPLIED_HOSTED_BROWSER_PROOF_PENDING
```

Next gate: `14_hosted_browser_proof_and_screenshot_gate.txt`.

The remote seed blocker status before Phase 13C was:

```text
HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING
```

The schema blocker status before Phase 13B was:

```text
HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011
```

## Remaining Hosted Blocker

The local MVP depends on multisite tables, roles, and fake Desert Valley demo rows. Remote D1 now has the migration 0011 schema foundation and the Phase 13C fake-data seed. The remaining blocker is visual/browser evidence: screenshots and a persona walkthrough were not generated in Phase 13C.

## Remote D1 Migration 0011 Gate

Required migration, applied in Phase 13B:

- `migrations/0011_multisite_site_role_foundation.sql`

Required remote tables:

- `sites`
- `site_users`
- `site_programs`

Required remote roles:

- `platform_admin`
- `org_admin`
- `site_admin`
- `viewer`

Read-only schema gate:

```powershell
npm run prove:remote:migration-0011
```

Expected status after Phase 13B:

```text
REMOTE_MIGRATION_0011_APPLIED_REMOTE_DEMO_SEED_NOT_RUN
REMOTE_MIGRATION_0011_ALREADY_PRESENT
REMOTE_DEMO_SEED_NOT_RUN
```

Expected status after Phase 13C:

```text
REMOTE_MIGRATION_0011_ALREADY_PRESENT
REMOTE_DEMO_SEED_PRESENT
HOSTED_PROOF_READY_FAKE_DATA_BROWSER_PROOF_PENDING
```

If remote read access is unavailable, the script reports a read-access blocker instead of mutating anything.

## Remote Migration Gate

Completed in Phase 13B:

1. Reviewed migration 0011 as additive.
2. Confirmed Wrangler listed only `0011_multisite_site_role_foundation.sql` as pending.
3. Applied `npm run db:migrate:remote`.
4. Proved `sites`, `site_users`, `site_programs`, the four new roles, sandbox site, sandbox site-program mappings, and zero foreign-key violations.
5. Did not seed remote data.

No additional remote migrations were run in Phase 13C. Phase 13B ran only migration 0011. No further remote migration should run before a new dedicated gate.

## Remote Seed 5B Gate

Completed in Phase 13C:

1. Run `npm run seed:demo:remote:dry-run`.
2. Review generated fake-data counts and protected real-account preservation.
3. Confirm fake `.test` domains only.
4. Confirm no physical Drive files are created.
5. Run remote seed write only with explicit approval.
6. Store generated fake staff credentials only in ignored `.secrets` files.

Phase 13C used the existing `seed:demo:remote` alias, which expands to `--remote --write --confirm SEED_REMOTE_DEMO`. No remote reset, deploy, migration, domain, OAuth, or Cloudflare config command was run.

The seed wrote 3 fake sites, 370 fake students, 460 fake demo user records, 320 mentor assignments, 345 submissions, 938 example.com evidence metadata rows, 367 comments, 268 reviews, 200 mentor meetings, 67 presentation slots, 29 export rows, and 0 announcements. Student credentials remain 0.

## Hosted Smoke Proof Gate

Phase 13C ran:

1. Run `npm run prove:demo:remote`.
2. Run `npm run prove:sales-demo:hosted`.
3. Verify `/api/auth/me`, Site Dashboard, Students, Student Detail/Timeline, Review Queue, Mentor Assignments, Operations, and redaction through hosted read-only API checks where supported.
4. Verify no announcements.
5. Verify no raw Drive IDs/storage IDs/secrets.

The hosted API proof used existing fake hosted credentials after the newly generated remote demo staff credentials were rejected by hosted login as invalid credentials. D1 proof still verified the generated fake staff/persona rows and role shape. Do not use the generated remote staff credential file for a browser walkthrough until Phase 14 resolves persona login proof or chooses an approved credential path.

## Screenshots / Browser Proof Gate

Screenshots were not generated in Phase 13C.

Before using screenshots as proof:

1. Capture them from a known local or hosted environment.
2. Label each screenshot with date, environment, persona, and claim status.
3. Confirm no passwords, credential files, tokens, raw Drive IDs, or private URLs are visible.
4. Store screenshot artifacts intentionally.

## Rollback / Avoidance Notes

- Do not run remote migration, reset, or deploy from this phase.
- Do not use real student data.
- Do not paste credentials into docs, slides, screenshots, chat, or issue trackers.
- If browser proof fails, keep hosted browser proof pending and use the local fake-data demo or the proven hosted API gate only.

## No Remote Seed In Phase 13B

Phase 13 created docs and read-only proof gates only. No remote writes were run in Phase 13. Phase 13B applied the schema migration gate only:

- Remote migration 0011 applied.
- No remote seed/reset writes.
- No remote seed.
- No deploy.
- No Cloudflare/domain/OAuth config changes.
- No user or credential creation.
