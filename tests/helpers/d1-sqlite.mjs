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
    "migrations/0011_multisite_site_role_foundation.sql",
    "migrations/0012_users_access_v5.sql",
    "migrations/0014_local_only_empty_test_schools.sql",
    "migrations/0015_remove_org_admin_role.sql",
    "migrations/0016_student_roster_profiles.sql",
    "migrations/0017_guided_student_writing.sql",
    "migrations/0018_project_workspaces.sql",
    "migrations/0019_project_requests.sql",
    "migrations/0020_missing_student_projects.sql",
    "migrations/0021_project_drive_folder_links.sql",
    "migrations/0022_project_drive_templates.sql",
    "migrations/0023_security_rate_limit_indexes.sql",
    "migrations/0024_project_request_safety.sql",
    "migrations/0025_required_project_adults.sql",
    "migrations/0026_drive_link_checks.sql",
    "migrations/0027_starter_guidance_templates.sql",
    "migrations/0028_staff_mfa.sql",
    "migrations/0029_password_setup_codes.sql",
    "migrations/0030_site_branding.sql",
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

  async batch(statements) {
    this.sqlite.exec("BEGIN IMMEDIATE;");
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      this.sqlite.exec("COMMIT;");
      return results;
    } catch (error) {
      this.sqlite.exec("ROLLBACK;");
      throw error;
    }
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
