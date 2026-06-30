# Hosted Proof Plan

## Current Hosted Proof Status

Hosted fake-account click-around demo readiness is green for fake-account click-around only. The 2026-06-29 pass added a repeatable hosted browser proof script plus screenshots for signed-out, Student, Program Teacher, Mentor, Viewer, Site Admin, Admin, misc_admin, and mobile Student surfaces. The demo-day operator order lives in `docs/sales/demo-day-operator-script.md`.

Do not claim Real-student production pilot readiness, FERPA certification, or production readiness.

The current fake-account hosted pilot does not depend on the legacy synthetic sales-demo remote seed. `npm run prove:sales-demo:hosted` is now a deprecated/non-blocking compatibility check for the legacy synthetic hosted sales-demo seed. When that old seed is absent, the current status is:

```text
LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING
```

Historical reports may still show `HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING`; read that as "the old synthetic seed is absent," not as a blocker for Hosted fake-account click-around demo readiness.

The current fake-account hosted proof status is:

```text
HOSTED_FAKE_ACCOUNT_PILOT_GREEN
```

Phase-level status:

```text
GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF
```

Current browser proof command:

```powershell
npm run prove:hosted-fake-pilot-browser
```

Current hosted health expectation:

```text
databaseReady=true
studentRosterProfilesReady=true
```

If `studentRosterProfilesReady=false`, pause Add Student and CSV roster profile demos until the migration gate is repaired. Treat migration `0016_student_roster_profiles.sql` as an already-applied Health signal to verify through `/api/health`, not as a live-demo migration step. Do not apply migrations from a live demo unless a separate approved migration plan exists.

The legacy remote seed blocker status before Phase 13C was:

```text
HOSTED_PROOF_BLOCKED_REMOTE_DEMO_SEED_MISSING
```

The schema blocker status before Phase 13B was:

```text
HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0011
```

The roster profile schema blocker introduced for the 2026-06-30 closure pass is:

```text
HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0016
```

## Remaining Hosted Limits

The local MVP depends on multisite tables, roles, and fake Desert Valley demo rows. Remote D1 has the migration 0011 schema foundation, but the legacy synthetic sales-demo seed is not currently present according to `npm run prove:sales-demo:hosted`. The 2026-06-29 browser pass captured hosted screenshots through the approved fake `.test` account path.

Remaining fake-account limits:

- `student_archive_manifest_download` remains a Future pilot item and is `skipped_not_ready` in the hosted dashboard gate unless a scoped student manifest download is actually available.
- The browser proof covers first-load click-around surfaces and role boundaries; destructive or mutation-heavy workflow actions stay covered by API/integration tests.
- Generated remote staff credential files are not the walkthrough credential source; use only approved fake hosted `.test` accounts for browser proof.
- Real-student onboarding still needs SSO, support, retention, data ownership, and policy approval work.

## Future Pilot Item: Archive Manifest Download

Owner-style description: finish real archive-manifest download readiness for a fake student before claiming it in any pilot-facing proof. This is not required for hosted fake-account demo day, and it is not a hidden failure while the hosted dashboard proof reports `student_archive_manifest_download` as `skipped_not_ready`.

Acceptance criteria:

- A fake student reaches an archive/export state with a scoped app download URL.
- The manifest download returns the redacted JSON body through the app route.
- Hosted dashboard proof marks `student_archive_manifest_download` as `passed`.
- Proof checks confirm no raw Drive IDs, storage IDs, tokens, private URLs, or credential values leak.
- Screenshot/docs are updated to show the workflow honestly.
- Real-student production pilot policy for retention, storage ownership, and support is approved before any real student data is used.

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

Current observed hosted status:

```text
REMOTE_MIGRATION_0011_ALREADY_PRESENT
LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING
HOSTED_FAKE_ACCOUNT_PILOT_GREEN
```

If remote read access is unavailable, the script reports a read-access blocker instead of mutating anything.

## Remote Migration Gate

Completed in Phase 13B:

1. Reviewed migration 0011 as additive.
2. Confirmed Wrangler listed only `0011_multisite_site_role_foundation.sql` as pending.
3. Applied `npm run db:migrate:remote`.
4. Proved `sites`, `site_users`, `site_programs`, the four new roles, sandbox site, sandbox site-program mappings, and zero foreign-key violations.
5. Did not seed remote data.

Phase 13B ran only migration 0011. Migration `0016_student_roster_profiles.sql` is now treated as an already-applied hosted Health signal for student create/import roster profile fields. The current hosted proof expects `/api/health` to report `studentRosterProfilesReady=true`.

```powershell
npm run db:migrate:remote
```

This command remains the normal migration repair path, not a live-demo step. Do not run remote migration, seed/reset, deploy, domain, OAuth, or credential commands during a live demo without a separate approval gate.

## Remote Seed 5B Gate

Historical/approved process for synthetic sales-demo seed refresh:

1. Run `npm run seed:demo:remote:dry-run`.
2. Review generated fake-data counts and protected real-account preservation.
3. Confirm fake `.test` domains only.
4. Confirm no physical Drive files are created.
5. Run remote seed write only with explicit approval.
6. Store generated fake staff credentials only in ignored `.secrets` files.

The gated seed alias expands to `--remote --write --confirm SEED_REMOTE_DEMO`. No remote reset, deploy, migration, domain, OAuth, or Cloudflare config command should run without a new dedicated approval gate.

When present, the synthetic sales-demo seed shape is 3 fake sites, 370 fake students, 460 fake demo user records, 320 mentor assignments, 345 submissions, 938 example.com evidence metadata rows, 367 comments, 268 reviews, 200 mentor meetings, 67 presentation slots, 29 export rows, and 0 announcements. Student credentials remain 0. The current hosted proof reports this synthetic seed is missing remotely.

## Hosted Smoke Proof Gate

Legacy synthetic sales-demo hosted smoke gate:

1. Run `npm run prove:demo:remote`.
2. Run `npm run prove:sales-demo:hosted`.
3. Verify `/api/auth/me`, Site Dashboard, Students, Student Detail/Timeline, Review Queue, Mentor Assignments, Operations, and redaction through hosted read-only API checks where supported.
4. Verify no announcements.
5. Verify no raw Drive IDs/storage IDs/secrets.

Current `npm run prove:sales-demo:hosted` result for a missing legacy synthetic seed is `LEGACY_SYNTHETIC_HOSTED_SEED_UNAVAILABLE_NON_BLOCKING`. The 2026-06-29 fake-account pilot browser proof uses approved fake hosted credentials and is separate from generated remote staff credential files.

## Screenshots / Browser Proof Gate

Screenshots were generated in Phase 14 and indexed at `docs/sales/hosted-browser-proof-screenshot-index.md`.

Current hosted browser status:

```text
GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF
SCREENSHOTS_GENERATED_SAFE
HOSTED_FAKE_ACCOUNTS_USED_FOR_BROWSER_PROOF
```

The screenshots prove hosted browser rendering for the signed-out workspace route, Student workspace, Program Teacher dashboard, Mentor dashboard, Viewer read-only directory, Site Admin dashboard, Admin command center, misc_admin limited readiness surface, and mobile Student workspace. They do not prove Real-student production pilot readiness, production readiness, or destructive workflow mutations.

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
