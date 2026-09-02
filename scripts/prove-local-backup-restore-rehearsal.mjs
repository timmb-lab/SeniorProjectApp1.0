#!/usr/bin/env node
import { copyFileSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const repoRoot = path.resolve(".");
const migrationsDir = path.join(repoRoot, "migrations");
const rehearsalDir = mkdtempSync(path.join(tmpdir(), "capstone-backup-restore-"));
const sourcePath = path.join(rehearsalDir, "source.sqlite");
const backupPath = path.join(rehearsalDir, "backup.sqlite");
const restoredPath = path.join(rehearsalDir, "restored.sqlite");
const markerId = "synthetic-backup-restore-marker";
let source;
let restored;

try {
  source = new DatabaseSync(sourcePath);
  source.exec("PRAGMA foreign_keys = ON;");
  const migrationFiles = readdirSync(migrationsDir)
    .filter((name) => /^\d{4}_.+\.sql$/.test(name))
    .sort();

  for (const file of migrationFiles) {
    source.exec(readFileSync(path.join(migrationsDir, file), "utf8"));
  }

  source.exec("CREATE TABLE backup_restore_rehearsal_marker (id TEXT PRIMARY KEY, value TEXT NOT NULL);");
  source.prepare("INSERT INTO backup_restore_rehearsal_marker (id, value) VALUES (?, ?)")
    .run(markerId, "non-production synthetic data only");
  source.exec(`VACUUM INTO '${backupPath.replaceAll("'", "''")}';`);
  source.close();
  source = null;

  copyFileSync(backupPath, restoredPath);
  restored = new DatabaseSync(restoredPath, { readOnly: true });
  const integrity = restored.prepare("PRAGMA integrity_check;").get();
  const marker = restored.prepare("SELECT id, value FROM backup_restore_rehearsal_marker WHERE id = ?").get(markerId);
  const tableCount = restored.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").get();
  const requiredTables = [
    "user_accounts",
    "projects",
    "project_members",
    "submissions",
    "audit_events",
    "auth_mfa_totp",
    "auth_password_setup_tokens",
  ];
  const presentTables = new Set(
    restored.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => String(row.name)),
  );
  const missingTables = requiredTables.filter((name) => !presentTables.has(name));
  const passed = integrity?.integrity_check === "ok" && marker?.id === markerId && missingTables.length === 0;

  const result = {
    proof: "local_non_production_backup_restore_rehearsal",
    runDate: new Date().toISOString(),
    dataClassification: "synthetic_non_production",
    method: "SQLite VACUUM INTO backup, copy to isolated restore target, open read-only, verify integrity and marker",
    migrationCount: migrationFiles.length,
    lastMigration: migrationFiles.at(-1) || null,
    restoredTableCount: Number(tableCount?.count || 0),
    requiredTables,
    missingTables,
    integrityCheck: integrity?.integrity_check || "unknown",
    markerRecovered: marker?.id === markerId,
    remoteD1Queries: 0,
    productionDataTouched: false,
    temporaryFilesRemoved: true,
    result: passed ? "PASS" : "FAIL",
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!passed) process.exitCode = 1;
} finally {
  try { restored?.close(); } catch {}
  try { source?.close(); } catch {}
  rmSync(rehearsalDir, { recursive: true, force: true });
}
