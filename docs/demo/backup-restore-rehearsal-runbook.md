# Backup/Restore Rehearsal Runbook

Status: **RUNBOOK READY; backup/restore evidence still MANUAL_PROOF_REQUIRED.**

This runbook describes a non-destructive rehearsal path for Cloudflare D1 data. It does not replace `docs/progress/runs/real-student-pilot-backup-restore-rehearsal-evidence.json`.

## Evidence Boundary

- Do not run destructive restore against production real-student data.
- Do not use real student data for the first rehearsal.
- Do not commit exports, local D1 snapshots, credentials, tokens, or `.secrets` files.
- Do not claim backup/restore readiness until a named technical owner captures and reviews redacted evidence.

## Plain Definitions

- Backup: a copy of the database that can be used if the app data is damaged or changed by mistake.
- Restore: using a backup or time-travel point to bring data back in an isolated target or approved recovery process.
- Rehearsal: practicing backup and restore with non-real data before the pilot.

## Safe Rehearsal Paths

The installed Wrangler CLI exposes:

```powershell
npx wrangler d1 export senior-capstone-db --local --output .secrets\rehearsals\d1-local-export.sql
npx wrangler d1 export senior-capstone-db --remote --output .secrets\rehearsals\d1-remote-export.sql
npx wrangler d1 time-travel info senior-capstone-db
npx wrangler d1 time-travel restore senior-capstone-db
```

Use `--local` for the first rehearsal. Use `--remote` only with explicit technical-owner approval and no real student data in the target. `time-travel restore` is a recovery tool, not a demo command; do not run it during a pilot walkthrough.

## Non-Destructive Local Rehearsal

1. Confirm no real student data is present in the local target.
2. Create an ignored output folder such as `.secrets\rehearsals\`.
3. Run local migrations:

   ```powershell
   npm run db:migrate:local
   ```

4. Seed only fake/synthetic data if needed.
5. Export local D1 data:

   ```powershell
   npx wrangler d1 export senior-capstone-db --local --output .secrets\rehearsals\d1-local-export.sql
   ```

6. Create an isolated restore target before executing any restore SQL.
7. Restore into that isolated target with current Wrangler-supported local D1 tooling.
8. Run smoke checks against the restored target:

   ```powershell
   npm run check:cloudflare
   npm test
   npm run check:pilot-readiness
   ```

9. Record only redacted results in the evidence manifest.

## Remote Rehearsal Requirements

Remote rehearsal requires written approval before any command runs:

- Technical owner approves the database, date, and exact command.
- Pilot owner confirms no real student pilot data will be touched.
- Privacy/data owner confirms the exported data classification.
- Recovery target is isolated or Cloudflare-supported and approved.
- Commands, timestamps, and results are redacted before commit.
- `.sql` exports stay out of git.

## Required Smoke Checks After Restore

The rehearsal evidence must show that the restored target can support:

1. `/api/health` with `databaseReady=true`.
2. `studentRosterProfilesReady=true`.
3. Auth/session route smoke.
4. Student dashboard smoke.
5. Staff directory or review queue smoke.
6. Viewer read-only denial/mutation smoke.
7. Archive readiness smoke if archive is in pilot scope.
8. Audit event readback without raw secrets.

## Rollback/Pause Procedure

If backup or restore fails:

1. Pause imports and account provisioning.
2. Notify pilot owner, technical owner, privacy/data owner, and support owner.
3. Keep the app in fake-account demo mode only.
4. Preserve command logs in an ignored secure location.
5. Do not run another restore command until the technical owner approves the next target.
6. Keep real-student pilot at NO-GO.

## Manifest Acceptance Criteria

The eventual manifest at `docs/progress/runs/real-student-pilot-backup-restore-rehearsal-evidence.json` must include:

- Technical owner and approval date.
- Database target and proof it did not contain real student data.
- Export command or Cloudflare-supported export path.
- Restore target and isolation proof.
- Schema/migration state before and after restore.
- Smoke-check commands and results.
- Recovery owner and expected recovery time.
- Confirmation that no secrets, SQL export contents, credentials, tokens, or real student rows are committed.
- Final decision: pass, fail, or needs review.

## Current Decision

This blocker is narrowed by a safe runbook, not closed. Real-student pilot remains **NO-GO** until the backup/restore rehearsal evidence manifest exists and is reviewed.
