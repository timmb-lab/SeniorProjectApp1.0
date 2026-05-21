import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

export function createSqliteD1({ migrations = [], seed = "" } = {}) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  for (const migration of migrations) {
    sqlite.exec(readFileSync(migration, "utf8"));
  }
  if (seed) sqlite.exec(seed);
  return new SqliteD1Database(sqlite);
}

export function foundationMigrations() {
  return [
    "migrations/0001_foundation.sql",
    "migrations/0004_mentor_meetings.sql",
    "migrations/0006_presentation_slots.sql",
    "migrations/0007_archive_export_artifacts.sql",
    "migrations/0010_tenant_google_sso.sql",
  ];
}

class SqliteD1Database {
  constructor(sqlite) {
    this.sqlite = sqlite;
  }

  prepare(sql) {
    return new SqliteD1PreparedStatement(this.sqlite, sql);
  }

  exec(sql) {
    this.sqlite.exec(sql);
  }
}

class SqliteD1PreparedStatement {
  constructor(sqlite, sql) {
    this.sqlite = sqlite;
    this.sql = sql;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  async first() {
    return this.sqlite.prepare(this.sql).get(...this.params) || null;
  }

  async all() {
    return {
      results: this.sqlite.prepare(this.sql).all(...this.params),
    };
  }

  async run() {
    const result = this.sqlite.prepare(this.sql).run(...this.params);
    return {
      success: true,
      meta: {
        changes: result.changes,
        last_row_id: result.lastInsertRowid,
      },
      results: [],
    };
  }
}
