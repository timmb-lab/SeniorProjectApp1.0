# Hosted Proof Plan

## Current Hosted Proof Status

Hosted proof is BLOCKED until remote fake-data seed/proof is explicitly approved and run.

Do not claim hosted demo readiness today.

Phase 13B applied and proved remote D1 migration `0011_multisite_site_role_foundation.sql`. The current read-only hosted proof status is:

```text
HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING
```

The schema blocker status before Phase 13B was:

```text
HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011
```

## Why Hosted Proof Is Blocked

The local MVP depends on multisite tables, roles, and fake Desert Valley demo rows. Remote D1 now has the migration 0011 schema foundation, but the remote Desert Valley fake-data seed has not been approved or run. Site-scoped routes cannot be claimed as hosted-proven until the seed/proof/browser gates pass.

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

If remote read access is unavailable, the script reports a read-access blocker instead of mutating anything.

## Remote Migration Gate

Completed in Phase 13B:

1. Reviewed migration 0011 as additive.
2. Confirmed Wrangler listed only `0011_multisite_site_role_foundation.sql` as pending.
3. Applied `npm run db:migrate:remote`.
4. Proved `sites`, `site_users`, `site_programs`, the four new roles, sandbox site, sandbox site-program mappings, and zero foreign-key violations.
5. Did not seed remote data.

No remote migrations were run in Phase 13. Phase 13B ran only migration 0011. No further remote migration should run before a new dedicated gate.

## Remote Seed 5B Gate

Planned / future:

1. Run `npm run seed:demo:remote:dry-run`.
2. Review generated fake-data counts and protected real-account preservation.
3. Confirm fake `.test` domains only.
4. Confirm no physical Drive files are created.
5. Run remote seed write only with explicit approval.
6. Store generated fake staff credentials only in ignored `.secrets` files.

No remote seed/reset writes were run in Phase 13B; the only remote D1 change was migration 0011.

## Hosted Smoke Proof Gate

After remote fake-data seed:

1. Run `npm run prove:demo:remote`.
2. Run hosted workspace smoke checks with fake `.test` credentials only.
3. Verify `/api/auth/me`, Site Dashboard, Students, Review Queue, Mentor Assignments, Operations, and redaction.
4. Verify no announcements.
5. Verify no raw Drive IDs/storage IDs/secrets.

## Screenshots / Browser Proof Gate

Screenshots are not generated in Phase 13.

Before using screenshots as proof:

1. Capture them from a known local or hosted environment.
2. Label each screenshot with date, environment, persona, and claim status.
3. Confirm no passwords, credential files, tokens, raw Drive IDs, or private URLs are visible.
4. Store screenshot artifacts intentionally.

## Rollback / Avoidance Notes

- Do not run remote migration, seed, or deploy from this phase.
- Do not use real student data.
- Do not paste credentials into docs, slides, screenshots, chat, or issue trackers.
- If remote proof fails, keep hosted status blocked and use local fake-data demo only.

## No Remote Seed In Phase 13B

Phase 13 created docs and read-only proof gates only. No remote writes were run in Phase 13. Phase 13B applied the schema migration gate only:

- Remote migration 0011 applied.
- No remote seed/reset writes.
- No remote seed.
- No deploy.
- No Cloudflare/domain/OAuth config changes.
- No user or credential creation.
