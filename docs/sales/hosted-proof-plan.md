# Hosted Proof Plan

## Current Hosted Proof Status

Hosted proof is BLOCKED until remote D1 has migration `0011_multisite_site_role_foundation.sql` and remote fake-data seed/proof is explicitly approved and run.

Do not claim hosted demo readiness today.

## Why Hosted Proof Is Blocked

The local MVP depends on multisite tables and roles introduced by migration 0011. The current hosted/remote D1 state is documented as missing that migration, so site-scoped routes cannot be claimed as hosted-proven.

## Remote D1 Migration 0011 Blocker

Required migration:

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
npm run prove:sales-demo:hosted
```

Expected blocked status until migration is present:

```text
HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011
```

If remote read access is unavailable, the script reports a read-access blocker instead of mutating anything.

## Remote Migration Gate

Planned / future:

1. Create a dedicated remote migration phase.
2. Confirm backup/rollback expectations.
3. Apply migration 0011 with explicit approval.
4. Run read-only schema proof.
5. Do not seed remote data until schema proof passes.

No remote migrations are allowed in Phase 13.

## Remote Seed 5B Gate

Planned / future:

1. Run `npm run seed:demo:remote:dry-run`.
2. Review generated fake-data counts and protected real-account preservation.
3. Confirm fake `.test` domains only.
4. Confirm no physical Drive files are created.
5. Run remote seed write only with explicit approval.
6. Store generated fake staff credentials only in ignored `.secrets` files.

No remote writes or remote seed are allowed in Phase 13.

## Hosted Smoke Proof Gate

After migration and remote fake-data seed:

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

## No Remote Writes In Phase 13

Phase 13 creates docs and read-only proof gates only:

- No remote migrations.
- No remote writes.
- No remote seed.
- No deploy.
- No Cloudflare/domain/OAuth config changes.
- No user or credential creation.
