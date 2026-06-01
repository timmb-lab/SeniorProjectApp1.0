#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash, pbkdf2Sync } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const EXPECTED_ROOT = path.resolve("C:/SeniorProjectApp1.0");
const EXPECTED_BRANCH = "main";
const EXPECTED_REMOTE = "https://github.com/timmb-lab/SeniorProjectApp1.0.git";
const EXPECTED_PACKAGE_NAME = "senior-capstone-app";
const DATABASE_NAME = "senior-capstone-db";
const WRANGLER_JS = path.join(REPO_ROOT, "node_modules", "wrangler", "bin", "wrangler.js");
const DEMO_MARKER = "DEMO_SEED";
const DEFAULT_SEED = "capstone-local-demo-2026-v1";
const STUDENT_DOMAIN = "demo-student.capstone.test";
const STAFF_DOMAIN = "demo-staff.capstone.test";
const DEMO_TENANT_ID = "tenant-desert-valley";
const DEMO_TENANT = Object.freeze({
  id: DEMO_TENANT_ID,
  name: "Desert Valley School District",
  slug: "desert-valley",
  status: "active",
  subscription_status: "trial",
  storage_mode: "app_managed_google_drive",
});
const PRIMARY_SITE_ID = "site-desert-valley-high";
const DEMO_SITES = Object.freeze([
  {
    id: PRIMARY_SITE_ID,
    tenantId: DEMO_TENANT_ID,
    name: "Desert Valley High School",
    slug: "desert-valley-high",
    schoolYear: "2026-2027",
    studentCount: 250,
    programIds: "all",
    mentorPrefix: "demo-mentor-",
    primary: true,
  },
  {
    id: "site-canyon-ridge-career",
    tenantId: DEMO_TENANT_ID,
    name: "Canyon Ridge Career Academy",
    slug: "canyon-ridge-career",
    schoolYear: "2026-2027",
    studentCount: 60,
    programIds: ["it", "culinary", "construction", "sports-medicine", "medical-professions"],
    mentorPrefix: "demo-mentor-canyon-ridge-career-",
    primary: false,
  },
  {
    id: "site-north-valley-tech",
    tenantId: DEMO_TENANT_ID,
    name: "North Valley Technical High School",
    slug: "north-valley-tech",
    schoolYear: "2026-2027",
    studentCount: 60,
    programIds: ["it", "hospitality-marketing", "mechanical-technology", "teaching-training", "early-childhood-education"],
    mentorPrefix: "demo-mentor-north-valley-tech-",
    primary: false,
  },
]);
const SECONDARY_SITE_MENTOR_COUNT = 8;
const PROTECTED_ADMIN_EMAILS = Object.freeze([
  "bryan@learntechonline.com",
  "bryan.timm89@gmail.com",
]);

const PROGRAMS = Object.freeze([
  {
    id: "it",
    name: "IT",
    count: 45,
    teacherCount: 2,
    teacherSlug: "it",
    titles: [
      "Help Desk Automation Toolkit",
      "Small Business Network Upgrade",
      "Cyber Safety Training Lab",
      "Student Device Intake Tracker",
      "Classroom Cable Map",
    ],
  },
  {
    id: "culinary",
    name: "Culinary",
    count: 35,
    teacherCount: 2,
    teacherSlug: "culinary",
    titles: [
      "Allergy-Safe Menu Prototype",
      "Community Meal Prep Plan",
      "Food Cost Calculator",
      "Knife Safety Training Station",
      "Budget Meal Kit",
    ],
  },
  {
    id: "hospitality-marketing",
    name: "Hospitality & Marketing",
    count: 25,
    teacherCount: 1,
    teacherSlug: "hospitality-marketing",
    titles: [
      "Event Check-In Plan",
      "School Store Promo Campaign",
      "Guest Service Toolkit",
      "Social Media Campaign Calendar",
    ],
  },
  {
    id: "mechanical-technology",
    name: "Mechanical Technology",
    count: 25,
    teacherCount: 1,
    teacherSlug: "mechanical-technology",
    titles: [
      "Brake Inspection Trainer",
      "Small Engine Troubleshooting Guide",
      "Shop Safety Workflow",
      "Tool Calibration Checklist",
    ],
  },
  {
    id: "construction",
    name: "Construction",
    count: 25,
    teacherCount: 1,
    teacherSlug: "construction",
    titles: [
      "Shed Framing Demonstration",
      "Tool Safety Training Station",
      "Material Estimate Workbook",
      "Jobsite Safety Board",
    ],
  },
  {
    id: "sports-medicine",
    name: "Sports Medicine",
    count: 35,
    teacherCount: 2,
    teacherSlug: "sports-medicine",
    titles: [
      "Injury Prevention Workshop",
      "Athlete Recovery Tracker",
      "Hydration Education Campaign",
      "Stretching Routine Guide",
    ],
  },
  {
    id: "teaching-training",
    name: "Teaching & Training",
    count: 20,
    teacherCount: 1,
    teacherSlug: "teaching-training",
    titles: [
      "Peer Tutoring Lesson Series",
      "Classroom Routine Visual Guide",
      "Reading Intervention Game",
      "Student Feedback Toolkit",
    ],
  },
  {
    id: "early-childhood-education",
    name: "Early Childhood Education",
    count: 20,
    teacherCount: 1,
    teacherSlug: "early-childhood-education",
    titles: [
      "Fine Motor Skills Activity Kit",
      "Story Time Lesson Set",
      "Parent Communication Folder",
      "Safe Play Station",
    ],
  },
  {
    id: "medical-professions",
    name: "Medical Professions",
    count: 20,
    teacherCount: 1,
    teacherSlug: "medical-professions",
    titles: [
      "Patient Intake Simulation",
      "Blood Pressure Education Station",
      "PPE Training Checklist",
      "Vital Signs Practice Lab",
    ],
  },
]);

const DEMO_ADDABLE_PROGRAMS = Object.freeze([
  {
    id: "demo-biotechnology-pilot",
    name: "Biotechnology",
    active: 1,
  },
]);

const STAGE_COUNTS = Object.freeze({
  not_started: 20,
  draft: 35,
  submitted: 40,
  revision_requested: 40,
  approved: 45,
  building: 35,
  presentation: 20,
  completed: 10,
  high_risk: 5,
});

const STORY_BUCKETS = Object.freeze([
  {
    id: "model_excellent",
    label: "Model excellent students",
    prefix: "Model Excellent",
    count: 3,
    stage: "completed",
    mentor: "required",
  },
  {
    id: "missing_mentor",
    label: "Missing mentor students",
    prefix: "Missing Mentor",
    count: 10,
    stage: "submitted",
    mentor: "none",
  },
  {
    id: "awaiting_review",
    label: "Submitted awaiting review",
    prefix: "Awaiting Review",
    count: 10,
    stage: "submitted",
    mentor: "required",
  },
  {
    id: "revision_requested",
    label: "Revision requested",
    prefix: "Revision Loop",
    count: 10,
    stage: "revision_requested",
    mentor: "required",
  },
  {
    id: "presentation_pending",
    label: "Presentation pending",
    prefix: "Presentation Pending",
    count: 10,
    stage: "presentation",
    mentor: "required",
  },
  {
    id: "archive_ready",
    label: "Archive ready",
    prefix: "Archive Ready",
    count: 10,
    stage: "completed",
    mentor: "required",
  },
  {
    id: "archive_failed",
    label: "Archive/export failed",
    prefix: "Archive Failed",
    count: 5,
    stage: "completed",
    mentor: "required",
  },
  {
    id: "high_risk",
    label: "Stale/high-risk students",
    prefix: "High Risk",
    count: 5,
    stage: "high_risk",
    mentor: "none",
  },
  {
    id: "rich_timeline",
    label: "Rich timeline students",
    prefix: "Rich Timeline",
    count: 3,
    stage: "building",
    mentor: "required",
  },
]);

const FIRST_NAMES = Object.freeze([
  "Aven", "Bexley", "Corin", "Dalen", "Ember", "Fintan", "Greer", "Halen", "Ivara", "Joss",
  "Kellan", "Liora", "Maren", "Niko", "Orin", "Perrin", "Quinlan", "Riven", "Sable", "Taren",
  "Uma", "Vail", "Wynn", "Xara", "Yarden", "Zerin", "Arden", "Briar", "Cale", "Dara",
  "Elian", "Faye", "Galen", "Hollis", "Indra", "Jalen", "Kael", "Larkin", "Mika", "Nerys",
  "Olen", "Prairie", "Reya", "Solan", "Tova", "Uri", "Vale", "Willa", "Xeno", "Yara",
]);

const LAST_NAMES = Object.freeze([
  "Northvale", "Quillstone", "Marblefield", "Larkspur", "Windmere", "Solridge", "Brindle", "Ashford", "Kestrel", "Morrow",
  "Silvers", "Dunewood", "Fairbank", "Rookwood", "Halecrest", "Brighton", "Mossley", "Farrow", "Stonebrook", "Calder",
  "Merriton", "Oakwell", "Pinehart", "Starling", "Redwick", "Valewood", "Clearwater", "Hawthorne", "Elmstead", "Ridgemont",
  "Briarcliff", "Westhaven", "Cedarfall", "Hearthwell", "Riverton", "Meadoway", "Frostvale", "Goldmere", "Summerset", "Bellweather",
  "Crossfield", "Linden", "Baystone", "Rainford", "Harborly", "Crestline", "Willowby", "Southwick", "Everden", "Claremont",
]);

const TEACHER_FIRST_NAMES = Object.freeze(["Arlen", "Bryn", "Camden", "Devon", "Ellis", "Finley", "Gray", "Harper", "Ivory", "Jules", "Kier", "Lennox"]);
const TEACHER_LAST_NAMES = Object.freeze(["Vale", "Stone", "Marin", "Rowe", "Lane", "Parker", "Quinn", "Reed", "Sloan", "Tate", "Voss", "Wells"]);
const MENTOR_FIRST_NAMES = Object.freeze(["Ari", "Blair", "Case", "Drew", "Eden", "Flynn", "Hale", "Ira", "Jude", "Kai", "Lux", "Merritt", "Noel", "Onyx", "Pax", "Quill", "Rory", "Sage", "Tate", "Uma", "Vega", "Winter", "Yael", "Zion", "Aster"]);
const MENTOR_LAST_NAMES = Object.freeze(["Arbor", "Beacon", "Cairn", "Drift", "Emery", "Field", "Grove", "Harbor", "Ives", "Juniper", "Keaton", "Lake", "Mason", "Noble", "Oak", "Pierce", "Quest", "River", "Shore", "Timber", "Upland", "Vesper", "Wilder", "Yardley", "Zephyr"]);

const EVIDENCE_TEMPLATES = Object.freeze([
  { slug: "core-concept-proposal", title: "Core Concept Proposal", artifactType: "planning_document", mimeType: "text/html" },
  { slug: "research-notes", title: "Research Notes", artifactType: "research_notes", mimeType: "text/html" },
  { slug: "photo-log", title: "Build Progress Photo Log", artifactType: "progress_photo_log", mimeType: "text/html" },
  { slug: "mentor-meeting-notes", title: "Mentor Meeting Notes", artifactType: "mentor_notes", mimeType: "text/html" },
  { slug: "presentation-outline", title: "Presentation Outline", artifactType: "presentation_outline", mimeType: "text/html" },
  { slug: "final-portfolio", title: "Final Portfolio Draft", artifactType: "portfolio_draft", mimeType: "text/html" },
  { slug: "reflection", title: "Reflection Draft", artifactType: "reflection_draft", mimeType: "text/html" },
  { slug: "thank-you-letter", title: "Thank You Letter Draft", artifactType: "thank_you_letter", mimeType: "text/html" },
]);

const OPTIONAL_TABLES = Object.freeze([
  "submission_versions",
  "mentor_meetings",
  "presentation_slots",
  "exports",
  "export_artifacts",
]);

const REQUIRED_TABLE_COLUMNS = Object.freeze({
  user_accounts: ["id", "email", "email_norm", "display_name", "status"],
  password_credentials: ["user_id", "password_hash", "password_salt", "algorithm", "iterations", "requires_reset"],
  sessions: ["id", "user_id", "token_hash", "expires_at"],
  roles: ["id"],
  user_roles: ["user_id", "role_id", "scope_type", "scope_id"],
  programs: ["id", "name", "active"],
  cohorts: ["id", "label", "school_year", "active"],
  groups: ["id", "name", "group_type", "program_id", "cohort_id"],
  group_memberships: ["group_id", "user_id", "membership_role"],
  mentor_assignments: ["id", "mentor_user_id", "student_user_id", "active"],
  viewer_student_assignments: ["id", "viewer_user_id", "student_user_id", "active"],
  requirements: ["id", "phase", "title"],
  progress_records: ["id", "student_id", "requirement_id", "phase", "status", "updated_by"],
  status_history: ["id", "student_id", "entity_type", "entity_id", "from_status", "to_status", "changed_by", "reason"],
  submissions: ["id", "student_id", "requirement_id", "status", "version", "submitted_at", "created_at", "updated_at"],
  reviews: ["id", "submission_id", "reviewer_user_id", "decision", "feedback"],
  comments: ["id", "entity_type", "entity_id", "author_user_id", "visibility", "body"],
  evidence_repositories: ["id"],
  evidence_artifacts: ["id", "repository_id", "student_id", "submission_id", "artifact_type", "source_kind", "drive_file_id", "drive_parent_folder_id", "external_url", "title", "review_status", "created_by"],
  audit_events: ["id", "actor_user_id", "action", "entity_type", "entity_id", "metadata_json"],
  tenants: ["id", "name", "slug", "status", "subscription_status", "storage_mode"],
  tenant_users: ["tenant_id", "user_id", "membership_status"],
  sites: ["id", "tenant_id", "name", "slug", "status", "school_year"],
  site_users: ["site_id", "user_id", "membership_status"],
  site_programs: ["site_id", "program_id", "active"],
});

const OPTIONAL_TABLE_COLUMNS = Object.freeze({
  submission_versions: ["id", "submission_id", "student_id", "requirement_id", "version", "status", "submitted_by", "submitted_at", "evidence_snapshot_json", "notes"],
  mentor_meetings: ["id", "mentor_user_id", "student_user_id", "submission_id", "status", "scheduled_for", "held_at", "notes", "created_by"],
  presentation_slots: ["id", "student_user_id", "submission_id", "requirement_id", "scheduled_for", "duration_minutes", "location", "status", "outline_status", "checked_out_at", "checked_in_at", "notes", "created_by"],
  exports: ["id", "export_type", "requested_by", "target_user_id", "drive_file_id", "status", "completed_at"],
  export_artifacts: ["id", "export_id", "artifact_type", "title", "mime_type", "byte_length", "content_sha256", "body_json"],
});

class DemoSeedError extends Error {
  constructor(classification, message, details = {}) {
    super(message);
    this.name = "DemoSeedError";
    this.classification = classification;
    this.details = details;
  }
}

class WranglerD1Adapter {
  constructor({ repoRoot = REPO_ROOT, target = "local" } = {}) {
    this.repoRoot = repoRoot;
    this.target = target;
  }

  targetFlag() {
    if (this.target !== "local") {
      throw new DemoSeedError("REMOTE_REFUSED", "The demo seeder is local-only and refuses remote D1 targets.");
    }
    return "--local";
  }

  assertWrangler() {
    if (!existsSync(WRANGLER_JS)) {
      throw new DemoSeedError("WRANGLER_NOT_FOUND", "Local Wrangler CLI is missing. Run npm install before seeding local D1.");
    }
  }

  async query(sql) {
    const [rows] = await this.queryBatch([sql]);
    return rows || [];
  }

  async queryBatch(statements) {
    this.assertWrangler();
    const result = spawnSync(process.execPath, [WRANGLER_JS, "d1", "execute", DATABASE_NAME, this.targetFlag(), "--json", "--command", statements.join("\n")], {
      cwd: this.repoRoot,
      encoding: "utf8",
      env: { ...process.env, CI: "1" },
      windowsHide: true,
    });
    if (result.status !== 0) {
      throw new DemoSeedError("D1_QUERY_FAILED", "Local D1 query failed.", {
        status: result.status,
        statements,
        output: redact(`${result.stdout || ""}\n${result.stderr || ""}`),
      });
    }
    return normalizeBatchResultRows(extractJson(`${result.stdout || ""}\n${result.stderr || ""}`));
  }

  async executeScript(sqlText, { label = "local-demo-workspace-seed", repoRoot = this.repoRoot } = {}) {
    this.assertWrangler();
    const tempFile = path.join(repoRoot, ".secrets", `${label}-${Date.now()}.sql`);
    assertSecretPath(repoRoot, tempFile);
    assertGitIgnored(repoRoot, ".secrets/");
    assertGitIgnored(repoRoot, path.relative(repoRoot, tempFile));
    mkdirSync(path.dirname(tempFile), { recursive: true });
    writeFileSync(tempFile, sqlText, "utf8");
    try {
      const result = spawnSync(process.execPath, [WRANGLER_JS, "d1", "execute", DATABASE_NAME, this.targetFlag(), "--file", tempFile], {
        cwd: repoRoot,
        encoding: "utf8",
        env: { ...process.env, CI: "1" },
        windowsHide: true,
      });
      if (result.status !== 0) {
        throw new DemoSeedError("D1_WRITE_FAILED", "Local D1 write failed.", {
          status: result.status,
          output: redact(`${result.stdout || ""}\n${result.stderr || ""}`),
        });
      }
    } finally {
      rmSync(tempFile, { force: true });
    }
  }
}

class DirectD1Adapter {
  constructor(db) {
    this.db = db;
  }

  async query(sql) {
    const rows = await this.db.prepare(sql).all();
    return rows.results || [];
  }

  async queryBatch(statements) {
    const output = [];
    for (const statement of statements) {
      output.push(await this.query(statement));
    }
    return output;
  }

  async executeScript(sqlText) {
    if (typeof this.db.exec === "function") {
      this.db.exec(sqlText);
      return;
    }
    for (const statement of splitSqlStatements(sqlText)) {
      await this.db.prepare(statement).run();
    }
  }
}

function parseArgs(values = process.argv.slice(2)) {
  const parsed = {
    target: "",
    mode: "",
    reset: false,
    seed: DEFAULT_SEED,
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--local") {
      if (parsed.target) throw new DemoSeedError("INVALID_ARGUMENTS", "Choose exactly one target: --local.");
      parsed.target = "local";
    } else if (value === "--remote") {
      throw new DemoSeedError("REMOTE_REFUSED", "The demo seeder is local-only and refuses --remote.");
    } else if (value === "--dry-run" || value === "--write") {
      if (parsed.mode) throw new DemoSeedError("INVALID_ARGUMENTS", "Choose exactly one mode: --dry-run or --write.");
      parsed.mode = value === "--dry-run" ? "dryrun" : "write";
    } else if (value === "--reset") {
      parsed.reset = true;
    } else if (value === "--seed") {
      parsed.seed = values[index + 1] || "";
      index += 1;
    } else if (value === "--help" || value === "-h") {
      console.log("Usage: node scripts/seed-local-demo-workspace.mjs --local --dry-run|--write [--reset] [--seed value]");
      process.exit(0);
    } else {
      throw new DemoSeedError("INVALID_ARGUMENTS", `Unknown argument: ${value}`);
    }
  }
  if (!parsed.target) throw new DemoSeedError("INVALID_ARGUMENTS", "Choose --local.");
  if (!parsed.mode) throw new DemoSeedError("INVALID_ARGUMENTS", "Choose --dry-run or --write.");
  if (!parsed.seed) throw new DemoSeedError("INVALID_ARGUMENTS", "--seed cannot be empty.");
  return parsed;
}

function runGit(args, repoRoot = REPO_ROOT) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new DemoSeedError("GIT_COMMAND_FAILED", `git ${args.join(" ")} failed.`, { status: result.status });
  }
  return String(result.stdout || "").trim();
}

function normalizePathForCompare(value) {
  return path.resolve(value).replaceAll("\\", "/").toLowerCase();
}

function assertRepoIdentity(repoRoot = REPO_ROOT) {
  const root = runGit(["rev-parse", "--show-toplevel"], repoRoot);
  const branch = runGit(["branch", "--show-current"], repoRoot);
  const remotes = runGit(["remote", "-v"], repoRoot);
  const head = runGit(["rev-parse", "HEAD"], repoRoot);
  const status = runGit(["status", "--short", "--branch"], repoRoot);
  const originFetch = remotes.split(/\r?\n/).find((line) => line.startsWith("origin") && line.includes("(fetch)"));
  const remote = originFetch?.split(/\s+/)[1] || "";

  if (normalizePathForCompare(root) !== normalizePathForCompare(EXPECTED_ROOT)) {
    throw new DemoSeedError("REPO_IDENTITY_FAILED", "Demo seeder is restricted to C:\\SeniorProjectApp1.0.", { root });
  }
  if (branch !== EXPECTED_BRANCH) {
    throw new DemoSeedError("REPO_IDENTITY_FAILED", "Demo seeder must run from main.", { branch });
  }
  if (remote !== EXPECTED_REMOTE) {
    throw new DemoSeedError("REPO_IDENTITY_FAILED", "Unexpected origin remote.", { remote });
  }
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  if (pkg.name !== EXPECTED_PACKAGE_NAME) {
    throw new DemoSeedError("REPO_IDENTITY_FAILED", "Unexpected package name.", { packageName: pkg.name });
  }
  return { root, branch, remote, head, status };
}

async function introspectSchema(adapter) {
  const tableRows = await adapter.query(
    "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name;",
  );
  const tables = new Map();
  for (const row of tableRows) {
    const name = row.name;
    const columns = await adapter.query(`PRAGMA table_info(${quoteIdent(name)});`);
    tables.set(name, {
      name,
      sql: row.sql || "",
      columns: new Set(columns.map((column) => column.name)),
    });
  }
  return {
    tables,
    tableNames: new Set(tableRows.map((row) => row.name)),
  };
}

function validateSchemaCapabilities(schema) {
  const skippedSlices = [];
  for (const [table, columns] of Object.entries(REQUIRED_TABLE_COLUMNS)) {
    assertTableColumns(schema, table, columns, false);
  }
  for (const [table, columns] of Object.entries(OPTIONAL_TABLE_COLUMNS)) {
    if (!schema.tableNames.has(table)) {
      skippedSlices.push({ table, reason: "optional table missing" });
      continue;
    }
    assertTableColumns(schema, table, columns, true);
  }

  const capabilities = {
    submissionVersions: schema.tableNames.has("submission_versions"),
    mentorMeetings: schema.tableNames.has("mentor_meetings"),
    presentationSlots: schema.tableNames.has("presentation_slots"),
    exports: schema.tableNames.has("exports"),
    exportArtifacts: schema.tableNames.has("export_artifacts"),
    mentorMeetingStatuses: enumValues(schema, "mentor_meetings", "status", ["scheduled", "held", "missed", "makeup_required"]),
    presentationSlotStatuses: enumValues(schema, "presentation_slots", "status", ["scheduled", "checked_out", "checked_in", "completed", "cancelled"]),
    presentationOutlineStatuses: enumValues(schema, "presentation_slots", "outline_status", ["pending", "approved", "revision_needed"]),
  };
  for (const table of ["mentor_meetings", "presentation_slots", "exports"]) {
    if (!schema.tableNames.has(table)) {
      throw new DemoSeedError("DASHBOARD_SCHEMA_BLOCKER", `Dashboard routes query ${table} unconditionally, but the table is missing.`);
    }
  }
  return { capabilities, skippedSlices };
}

function assertTableColumns(schema, table, columns, optional) {
  const entry = schema.tables.get(table);
  if (!entry) {
    if (optional) return;
    throw new DemoSeedError("SCHEMA_TABLE_MISSING", `Required local D1 table is missing: ${table}.`);
  }
  const missing = columns.filter((column) => !entry.columns.has(column));
  if (missing.length > 0) {
    throw new DemoSeedError("SCHEMA_COLUMN_MISSING", `${table} is missing required column(s): ${missing.join(", ")}.`, {
      table,
      missing,
    });
  }
}

function enumValues(schema, table, column, fallback) {
  const entry = schema.tables.get(table);
  if (!entry) return [];
  const values = extractEnumValues(entry.sql, column);
  if (!values.length) return fallback;
  for (const expected of fallback) {
    if (!values.includes(expected)) {
      throw new DemoSeedError("SCHEMA_ENUM_UNEXPECTED", `${table}.${column} does not include expected demo-safe value ${expected}.`, {
        table,
        column,
        values,
      });
    }
  }
  return values;
}

function extractEnumValues(createSql, column) {
  const pattern = new RegExp(`${column}\\s+TEXT[\\s\\S]*?CHECK\\s*\\([^)]*?IN\\s*\\(([^)]+)\\)`, "i");
  const match = String(createSql || "").match(pattern);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
}

async function loadLookups(adapter) {
  const [programs, requirements] = await adapter.queryBatch([
    "SELECT id, name, active FROM programs WHERE active = 1 ORDER BY id;",
    "SELECT id, phase, title, program_id, sort_order FROM requirements ORDER BY sort_order, id;",
  ]);
  const programIds = new Set(programs.map((program) => program.id));
  const missingPrograms = PROGRAMS.map((program) => program.id).filter((programId) => !programIds.has(programId));
  if (missingPrograms.length > 0) {
    throw new DemoSeedError("PROGRAM_LOOKUP_MISSING", "Local D1 is missing one or more expected program lookup rows.", {
      missingPrograms,
    });
  }
  const proposal = requirements.find((requirement) => requirement.id === "req-proposal-draft")
    || requirements.find((requirement) => /proposal/i.test(requirement.title || ""))
    || requirements[0]
    || null;
  const presentation = requirements.find((requirement) => requirement.id === "req-presentation-day")
    || requirements.find((requirement) => /presentation/i.test(requirement.title || ""))
    || proposal;
  return {
    programs,
    requirements,
    proposalRequirementId: proposal?.id || null,
    proposalPhase: proposal?.phase || "proposal-and-research",
    presentationRequirementId: presentation?.id || null,
  };
}

async function verifyProtectedAdmins(adapter) {
  const rows = await adapter.query(
    `SELECT
       u.id,
       u.email,
       u.email_norm,
       u.display_name,
       u.status,
       c.user_id IS NOT NULL AS has_password_credential,
       c.requires_reset,
       ur.role_id,
       ur.scope_type,
       ur.scope_id
     FROM user_accounts u
     LEFT JOIN password_credentials c ON c.user_id = u.id
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     WHERE u.email_norm IN (${PROTECTED_ADMIN_EMAILS.map(sqlString).join(", ")})
     ORDER BY u.email_norm, ur.role_id;`,
  );
  const byEmail = new Map();
  for (const row of rows) {
    const email = normalizeEmail(row.email_norm || row.email || "");
    const account = byEmail.get(email) || {
      id: row.id,
      email,
      displayName: row.display_name,
      status: row.status,
      hasPasswordCredential: Number(row.has_password_credential || 0) === 1,
      requiresReset: Number(row.requires_reset || 0),
      roles: [],
    };
    if (row.role_id) {
      account.roles.push({
        roleId: row.role_id,
        scopeType: row.scope_type,
        scopeId: row.scope_id || "",
      });
    }
    byEmail.set(email, account);
  }
  const accounts = PROTECTED_ADMIN_EMAILS.map((email) => byEmail.get(email)).filter(Boolean);
  const ok = accounts.length === 2
    && accounts.every((account) => (
      account.displayName === "Bryan Timm"
      && account.status === "active"
      && account.hasPasswordCredential
      && account.requiresReset === 0
      && account.roles.some((role) => ["global_admin", "admin", "platform_admin"].includes(role.roleId) && role.scopeType === "global" && role.scopeId === "")
    ));
  if (!ok) {
    throw new DemoSeedError("PROTECTED_ADMIN_VERIFY_FAILED", "The two protected local admins must exist as active local-auth global admins before seeding demo data.", {
      foundEmails: accounts.map((account) => account.email),
      requiredEmails: PROTECTED_ADMIN_EMAILS,
    });
  }
  return {
    ok: true,
    preserved: true,
    accounts: accounts.map((account) => ({
      email: account.email,
      displayName: account.displayName,
      status: account.status,
      globalAdmin: true,
      localPasswordCredentialExists: true,
      requiresReset: account.requiresReset,
    })),
  };
}

async function buildDeletePlan(adapter, schema) {
  const specs = deleteSpecs(schema);
  const countsRows = await adapter.queryBatch(specs.map((spec) => `SELECT COUNT(*) AS count FROM ${quoteIdent(spec.table)} WHERE ${spec.where};`));
  const counts = {};
  for (let index = 0; index < specs.length; index += 1) {
    counts[specs[index].table] = Number(countsRows[index]?.[0]?.count || 0);
  }
  return {
    counts,
    total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    tables: specs.map((spec) => spec.table),
  };
}

function deleteSpecs(schema) {
  const demoUsers = "(id LIKE 'demo-%' OR email_norm LIKE '%@demo-student.capstone.test' OR email_norm LIKE '%@demo-staff.capstone.test')";
  const demoUserSubquery = `SELECT id FROM user_accounts WHERE ${demoUsers}`;
  const demoSubmissions = "SELECT id FROM submissions WHERE id LIKE 'demo-%' OR student_id IN (SELECT id FROM user_accounts WHERE id LIKE 'demo-%' OR email_norm LIKE '%@demo-student.capstone.test' OR email_norm LIKE '%@demo-staff.capstone.test')";
  const demoSites = DEMO_SITES.map((site) => sqlString(site.id)).join(", ");
  const specs = [
    ["export_artifacts", "id LIKE 'demo-%' OR export_id IN (SELECT id FROM exports WHERE id LIKE 'demo-%' OR requested_by IN (__DEMO_USERS__) OR target_user_id IN (__DEMO_USERS__)) OR title LIKE '%DEMO_SEED%' OR body_json LIKE '%DEMO_SEED%'"],
    ["exports", "id LIKE 'demo-%' OR requested_by IN (__DEMO_USERS__) OR target_user_id IN (__DEMO_USERS__)"],
    ["comments", "id LIKE 'demo-%' OR entity_id LIKE 'demo-%' OR author_user_id IN (__DEMO_USERS__) OR body LIKE '%DEMO_SEED%'"],
    ["reviews", "id LIKE 'demo-%' OR reviewer_user_id IN (__DEMO_USERS__) OR submission_id IN (__DEMO_SUBMISSIONS__)"],
    ["submission_versions", "id LIKE 'demo-%' OR student_id IN (__DEMO_USERS__) OR submitted_by IN (__DEMO_USERS__) OR submission_id IN (__DEMO_SUBMISSIONS__) OR notes LIKE '%DEMO_SEED%'"],
    ["evidence_artifacts", "id LIKE 'demo-%' OR student_id IN (__DEMO_USERS__) OR created_by IN (__DEMO_USERS__) OR external_url LIKE 'https://example.com/capstone-demo/%' OR title LIKE '%DEMO_SEED%'"],
    ["mentor_meetings", "id LIKE 'demo-%' OR mentor_user_id IN (__DEMO_USERS__) OR student_user_id IN (__DEMO_USERS__) OR created_by IN (__DEMO_USERS__) OR notes LIKE '%DEMO_SEED%'"],
    ["presentation_slots", "id LIKE 'demo-%' OR student_user_id IN (__DEMO_USERS__) OR created_by IN (__DEMO_USERS__) OR notes LIKE '%DEMO_SEED%'"],
    ["status_history", "id LIKE 'demo-%' OR student_id IN (__DEMO_USERS__) OR entity_id LIKE 'demo-%' OR changed_by IN (__DEMO_USERS__) OR reason LIKE '%DEMO_SEED%'"],
    ["progress_records", "id LIKE 'demo-%' OR student_id IN (__DEMO_USERS__) OR updated_by IN (__DEMO_USERS__)"],
    ["submissions", "id LIKE 'demo-%' OR student_id IN (__DEMO_USERS__)"],
    ["mentor_assignments", "id LIKE 'demo-%' OR mentor_user_id IN (__DEMO_USERS__) OR student_user_id IN (__DEMO_USERS__) OR assigned_by IN (__DEMO_USERS__)"],
    ["viewer_student_assignments", "id LIKE 'demo-%' OR viewer_user_id IN (__DEMO_USERS__) OR student_user_id IN (__DEMO_USERS__) OR assigned_by IN (__DEMO_USERS__)"],
    ["group_memberships", "group_id LIKE 'demo-%' OR user_id IN (__DEMO_USERS__)"],
    ["announcements", "id LIKE 'demo-%' OR title LIKE '%DEMO_SEED%' OR body LIKE '%DEMO_SEED%' OR created_by IN (__DEMO_USERS__)"],
    ["audit_events", "id LIKE 'demo-%' OR actor_user_id IN (__DEMO_USERS__) OR entity_id LIKE 'demo-%' OR metadata_json LIKE '%DEMO_SEED%'"],
    ["site_users", `site_id IN (${demoSites}) OR user_id IN (__DEMO_USERS__)`],
    ["site_programs", `site_id IN (${demoSites})`],
    ["tenant_users", `tenant_id = ${sqlString(DEMO_TENANT_ID)} OR user_id IN (__DEMO_USERS__)`],
    ["auth_identities", "user_id IN (__DEMO_USERS__) OR email_norm LIKE '%@demo-student.capstone.test' OR email_norm LIKE '%@demo-staff.capstone.test'"],
    ["sessions", "user_id IN (__DEMO_USERS__)"],
    ["password_credentials", "user_id IN (__DEMO_USERS__)"],
    ["user_roles", "user_id IN (__DEMO_USERS__)"],
    ["user_accounts", demoUsers],
    ["groups", "id LIKE 'demo-%'"],
    ["cohorts", "id LIKE 'demo-%' OR label LIKE '%DEMO_SEED%'"],
    ["programs", `id IN (${DEMO_ADDABLE_PROGRAMS.map((program) => sqlString(program.id)).join(", ")})`],
    ["sites", `tenant_id = ${sqlString(DEMO_TENANT_ID)} OR id IN (${demoSites})`],
    ["tenants", `id = ${sqlString(DEMO_TENANT_ID)}`],
  ];
  return specs
    .filter(([table]) => schema.tableNames.has(table))
    .map(([table, where]) => ({
      table,
      where: where
        .replaceAll("__DEMO_USERS__", demoUserSubquery)
        .replaceAll("__DEMO_SUBMISSIONS__", demoSubmissions),
    }));
}

async function buildDemoDataset({
  capabilities,
  lookups,
  seed = DEFAULT_SEED,
  passwordPepper = process.env.PASSWORD_PEPPER || "",
  programTeacherCountOverride = null,
  mentorCount = 25,
  credentialTeacherProgramIds = ["it", "culinary", "sports-medicine"],
  credentialMentorCount = 3,
  suggestedDemoUrl = "http://127.0.0.1:8788/workspace.html",
  includeDemoAdmin = false,
  demoAdminId = "demo-admin-001",
  demoAdminEmail = `admin001@${STAFF_DOMAIN}`,
  demoAdminDisplayName = "Demo Admin",
  passwordPrefix = "DemoLocal!",
  demoLocationLabel = "local",
} = {}) {
  const rows = emptyRows();
  const credentials = {
    adminLogins: [],
    personaLogins: [],
    programTeacherLogins: [],
    mentorLogins: [],
    sampleStudentLogins: [],
  };
  const credentialTeacherPrograms = new Set(credentialTeacherProgramIds);
  const resolvedMentorCount = positiveInteger(mentorCount, 25);
  const resolvedCredentialMentorCount = Math.min(positiveInteger(credentialMentorCount, 0), resolvedMentorCount);
  const stagePool = deterministicShuffle(expandStagePool(), `${seed}:stages`);
  const students = [];
  const teachersByProgram = new Map();
  const mentorIdsBySite = new Map();

  rows.tenants.push({ ...DEMO_TENANT });
  for (const program of DEMO_ADDABLE_PROGRAMS) {
    rows.programs.push({ ...program });
  }
  for (const site of DEMO_SITES) {
    rows.sites.push({
      id: site.id,
      tenant_id: site.tenantId,
      name: site.name,
      slug: site.slug,
      status: "active",
      timezone: "America/Los_Angeles",
      school_year: site.schoolYear,
    });
    for (const program of programsForSite(site)) {
      rows.sitePrograms.push({
        site_id: site.id,
        program_id: program.id,
        active: 1,
      });
    }
  }

  function addTenantMembership(userId) {
    rows.tenantUsers.push({
      tenant_id: DEMO_TENANT_ID,
      user_id: userId,
      membership_status: "active",
    });
  }

  function addSiteMembership(siteId, userId) {
    rows.siteUsers.push({
      site_id: siteId,
      user_id: userId,
      membership_status: "active",
    });
  }

  async function addStaffPersona({ id, email, displayName, roleId, scopeType, scopeId, siteIds = [], credentialGroup = "personaLogins" }) {
    rows.userAccounts.push({
      id,
      email,
      email_norm: normalizeEmail(email),
      display_name: displayName,
      status: "active",
    });
    rows.userRoles.push({
      user_id: id,
      role_id: roleId,
      scope_type: scopeType,
      scope_id: scopeId,
      assigned_by: null,
    });
    addTenantMembership(id);
    for (const siteId of siteIds) addSiteMembership(siteId, id);
    const password = passwordFor(id, email, displayName, seed, passwordPrefix);
    rows.passwordCredentials.push(await credentialRow(id, password, passwordPepper, seed));
    credentials[credentialGroup].push({
      email,
      displayName,
      role: roleId,
      scope: scopeType === "global" ? "global" : `${scopeType}:${scopeId}`,
      suggestedDemoUrl,
      password,
    });
  }

  await addStaffPersona({
    id: "demo-platform-admin-001",
    email: `platform.admin@${STAFF_DOMAIN}`,
    displayName: "Priya Global",
    roleId: "global_admin",
    scopeType: "global",
    scopeId: "",
    siteIds: DEMO_SITES.map((site) => site.id),
  });
  await addStaffPersona({
    id: "demo-administration-desert-valley-high",
    email: `administration.desert-valley-high@${STAFF_DOMAIN}`,
    displayName: "Avery Administration",
    roleId: "administration",
    scopeType: "site",
    scopeId: PRIMARY_SITE_ID,
    siteIds: [PRIMARY_SITE_ID],
  });
  await addStaffPersona({
    id: "demo-site-admin-desert-valley-high",
    email: `admin.desert-valley-high@${STAFF_DOMAIN}`,
    displayName: "Sam Site Admin",
    roleId: "site_admin",
    scopeType: "site",
    scopeId: PRIMARY_SITE_ID,
    siteIds: [PRIMARY_SITE_ID],
  });
  await addStaffPersona({
    id: "demo-site-admin-canyon-ridge-career",
    email: `admin.canyon-ridge-career@${STAFF_DOMAIN}`,
    displayName: "Camden Career",
    roleId: "site_admin",
    scopeType: "site",
    scopeId: "site-canyon-ridge-career",
    siteIds: ["site-canyon-ridge-career"],
  });
  await addStaffPersona({
    id: "demo-site-admin-north-valley-tech",
    email: `admin.north-valley-tech@${STAFF_DOMAIN}`,
    displayName: "Nia Technical",
    roleId: "site_admin",
    scopeType: "site",
    scopeId: "site-north-valley-tech",
    siteIds: ["site-north-valley-tech"],
  });
  await addStaffPersona({
    id: "demo-viewer-desert-valley-high",
    email: `viewer.desert-valley-high@${STAFF_DOMAIN}`,
    displayName: "Valeria Viewer",
    roleId: "viewer",
    scopeType: "site",
    scopeId: PRIMARY_SITE_ID,
    siteIds: [PRIMARY_SITE_ID],
  });

  rows.cohorts.push({
    id: "demo-cohort-desert-valley-high-2027",
    label: "DEMO_SEED Desert Valley High School Class of 2027",
    school_year: "2026-2027",
    active: 1,
  });
  rows.groups.push({
    id: "demo-group-desert-valley-high-cohort-2027",
    name: "DEMO_SEED Desert Valley High School Class of 2027",
    group_type: "cohort",
    program_id: null,
    cohort_id: "demo-cohort-desert-valley-high-2027",
  });
  for (const program of PROGRAMS) {
    rows.groups.push({
      id: `demo-group-desert-valley-high-program-${program.id}`,
      name: `DEMO_SEED Desert Valley High School ${program.name}`,
      group_type: "program",
      program_id: program.id,
      cohort_id: null,
    });
  }
  for (const site of DEMO_SITES.filter((item) => !item.primary)) {
    rows.cohorts.push({
      id: `demo-cohort-${site.slug}-2027`,
      label: `DEMO_SEED ${site.name} Class of 2027`,
      school_year: site.schoolYear,
      active: 1,
    });
    rows.groups.push({
      id: `demo-group-${site.slug}-cohort-2027`,
      name: `DEMO_SEED ${site.name} Class of 2027`,
      group_type: "cohort",
      program_id: null,
      cohort_id: `demo-cohort-${site.slug}-2027`,
    });
    for (const program of programsForSite(site)) {
      rows.groups.push({
        id: `demo-group-${site.slug}-program-${program.id}`,
        name: `DEMO_SEED ${site.name} ${program.name}`,
        group_type: "program",
        program_id: program.id,
        cohort_id: null,
      });
    }
  }

  for (const program of PROGRAMS) {
    const teachers = [];
    const teacherCount = positiveInteger(programTeacherCountOverride ?? program.teacherCount, program.teacherCount);
    for (let offset = 1; offset <= teacherCount; offset += 1) {
      const id = `demo-teacher-${program.teacherSlug}-${pad(offset, 2)}`;
      const email = `teacher-${program.teacherSlug}-${pad(offset, 2)}@${STAFF_DOMAIN}`;
      const displayName = `${TEACHER_FIRST_NAMES[(teachers.length + rows.userAccounts.length) % TEACHER_FIRST_NAMES.length]} ${TEACHER_LAST_NAMES[(teachers.length * 3 + rows.userAccounts.length) % TEACHER_LAST_NAMES.length]}`;
      rows.userAccounts.push({
        id,
        email,
        email_norm: normalizeEmail(email),
        display_name: displayName,
        status: "active",
      });
      rows.userRoles.push({
        user_id: id,
        role_id: "program_teacher",
        scope_type: "program",
        scope_id: program.id,
        assigned_by: null,
      });
      addTenantMembership(id);
      addSiteMembership(PRIMARY_SITE_ID, id);
      teachers.push(id);
      if (credentialTeacherPrograms.has(program.id) && offset === 1) {
        const password = passwordFor(id, email, displayName, seed, passwordPrefix);
        rows.passwordCredentials.push(await credentialRow(id, password, passwordPepper, seed));
        credentials.programTeacherLogins.push({
          email,
          displayName,
          role: "program_teacher",
          scope: `program:${program.id}`,
          suggestedDemoUrl,
          password,
        });
      }
    }
    teachersByProgram.set(program.id, teachers);
  }

  for (const site of DEMO_SITES.filter((item) => !item.primary)) {
    for (const program of programsForSite(site).slice(0, 5)) {
      const id = `demo-teacher-${site.slug}-${program.teacherSlug}-01`;
      const email = `teacher-${site.slug}-${program.teacherSlug}-01@${STAFF_DOMAIN}`;
      const displayName = `${TEACHER_FIRST_NAMES[(rows.userAccounts.length + program.id.length) % TEACHER_FIRST_NAMES.length]} ${TEACHER_LAST_NAMES[(rows.userAccounts.length + site.slug.length) % TEACHER_LAST_NAMES.length]}`;
      rows.userAccounts.push({
        id,
        email,
        email_norm: normalizeEmail(email),
        display_name: displayName,
        status: "active",
      });
      rows.userRoles.push({
        user_id: id,
        role_id: "program_teacher",
        scope_type: "program",
        scope_id: program.id,
        assigned_by: null,
      });
      addTenantMembership(id);
      addSiteMembership(site.id, id);
      const teachers = teachersByProgram.get(program.id) || [];
      teachers.push(id);
      teachersByProgram.set(program.id, teachers);
    }
  }

  if (includeDemoAdmin) {
    const email = demoAdminEmail;
    const displayName = demoAdminDisplayName;
    rows.userAccounts.push({
      id: demoAdminId,
      email,
      email_norm: normalizeEmail(email),
      display_name: displayName,
      status: "active",
    });
    rows.userRoles.push({
      user_id: demoAdminId,
      role_id: "global_admin",
      scope_type: "global",
      scope_id: "",
      assigned_by: null,
    });
    addTenantMembership(demoAdminId);
    for (const site of DEMO_SITES) addSiteMembership(site.id, demoAdminId);
    const password = passwordFor(demoAdminId, email, displayName, seed, passwordPrefix);
    rows.passwordCredentials.push(await credentialRow(demoAdminId, password, passwordPepper, seed));
    credentials.adminLogins.push({
      email,
      displayName,
      role: "global_admin",
      scope: "global",
      suggestedDemoUrl,
      password,
    });
  }

  for (let mentorIndex = 1; mentorIndex <= resolvedMentorCount; mentorIndex += 1) {
    const id = `demo-mentor-${pad(mentorIndex, 3)}`;
    const email = `mentor${pad(mentorIndex, 3)}@${STAFF_DOMAIN}`;
    const displayName = `${MENTOR_FIRST_NAMES[(mentorIndex - 1) % MENTOR_FIRST_NAMES.length]} ${MENTOR_LAST_NAMES[(mentorIndex * 5) % MENTOR_LAST_NAMES.length]}`;
    rows.userAccounts.push({
      id,
      email,
      email_norm: normalizeEmail(email),
      display_name: displayName,
      status: "active",
    });
    rows.userRoles.push({
      user_id: id,
      role_id: "mentor",
      scope_type: "global",
      scope_id: "",
      assigned_by: null,
    });
    addTenantMembership(id);
    addSiteMembership(PRIMARY_SITE_ID, id);
    const primaryMentors = mentorIdsBySite.get(PRIMARY_SITE_ID) || [];
    primaryMentors.push(id);
    mentorIdsBySite.set(PRIMARY_SITE_ID, primaryMentors);
    if (mentorIndex <= resolvedCredentialMentorCount) {
      const password = passwordFor(id, email, displayName, seed, passwordPrefix);
      rows.passwordCredentials.push(await credentialRow(id, password, passwordPepper, seed));
      credentials.mentorLogins.push({
        email,
        displayName,
        role: "mentor",
        scope: "assigned_students",
        suggestedDemoUrl,
        password,
      });
    }
  }

  for (const site of DEMO_SITES.filter((item) => !item.primary)) {
    const siteMentors = [];
    for (let mentorIndex = 1; mentorIndex <= SECONDARY_SITE_MENTOR_COUNT; mentorIndex += 1) {
      const id = `${site.mentorPrefix}${pad(mentorIndex, 3)}`;
      const email = `mentor-${site.slug}-${pad(mentorIndex, 3)}@${STAFF_DOMAIN}`;
      const displayName = `${MENTOR_FIRST_NAMES[(mentorIndex + rows.userAccounts.length) % MENTOR_FIRST_NAMES.length]} ${MENTOR_LAST_NAMES[(mentorIndex * 7 + rows.userAccounts.length) % MENTOR_LAST_NAMES.length]}`;
      rows.userAccounts.push({
        id,
        email,
        email_norm: normalizeEmail(email),
        display_name: displayName,
        status: "active",
      });
      rows.userRoles.push({
        user_id: id,
        role_id: "mentor",
        scope_type: "global",
        scope_id: "",
        assigned_by: null,
      });
      addTenantMembership(id);
      addSiteMembership(site.id, id);
      siteMentors.push(id);
    }
    mentorIdsBySite.set(site.id, siteMentors);
  }

  let studentNumber = 0;
  for (const program of PROGRAMS) {
    for (let index = 0; index < program.count; index += 1) {
      studentNumber += 1;
      const id = `demo-student-${pad(studentNumber, 3)}`;
      const email = `student${pad(studentNumber, 3)}@${STUDENT_DOMAIN}`;
      const story = storyForPrimaryStudent(studentNumber);
      const displayName = story
        ? `${story.prefix} Demo ${pad(story.index, 2)}`
        : `${FIRST_NAMES[(studentNumber - 1) % FIRST_NAMES.length]} ${LAST_NAMES[(studentNumber * 7) % LAST_NAMES.length]}`;
      const stage = story?.stage || stagePool[studentNumber - 1];
      const projectTitle = program.titles[(studentNumber + index) % program.titles.length];
      const teacherIds = primaryTeacherIdsForProgram(teachersByProgram, program.id);
      const teacherId = teacherIds[index % teacherIds.length] || teacherIds[0] || null;
      const student = {
        id,
        email,
        displayName,
        number: studentNumber,
        program,
        stage,
        projectTitle,
        teacherId,
        siteId: PRIMARY_SITE_ID,
        siteSlug: "desert-valley-high",
        storyBucket: story?.id || null,
        noMentor: story?.mentor === "none" || studentNumber % 10 === 0,
      };
      students.push(student);
      rows.userAccounts.push({
        id,
        email,
        email_norm: normalizeEmail(email),
        display_name: displayName,
        status: "active",
      });
      rows.userRoles.push({
        user_id: id,
        role_id: "student",
        scope_type: "global",
        scope_id: "",
        assigned_by: null,
      });
      addTenantMembership(id);
      addSiteMembership(PRIMARY_SITE_ID, id);
      rows.groupMemberships.push({
        group_id: `demo-group-desert-valley-high-program-${program.id}`,
        user_id: id,
        membership_role: "student",
      });
      rows.groupMemberships.push({
        group_id: "demo-group-desert-valley-high-cohort-2027",
        user_id: id,
        membership_role: "student",
      });
    }
  }

  for (const site of DEMO_SITES.filter((item) => !item.primary)) {
    const sitePrograms = programsForSite(site);
    for (let index = 0; index < site.studentCount; index += 1) {
      studentNumber += 1;
      const program = sitePrograms[index % sitePrograms.length];
      const id = `demo-student-${pad(studentNumber, 3)}`;
      const email = `student${pad(studentNumber, 3)}@${STUDENT_DOMAIN}`;
      const displayName = `${site.name.split(" ")[0]} ${FIRST_NAMES[(studentNumber - 1) % FIRST_NAMES.length]} ${LAST_NAMES[(studentNumber * 7) % LAST_NAMES.length]}`;
      const stage = stagePool[(studentNumber - 1) % stagePool.length];
      const projectTitle = program.titles[(studentNumber + index) % program.titles.length];
      const teacherIds = secondaryTeacherIdsForSiteProgram(site.slug, teachersByProgram, program.id);
      const teacherId = teacherIds[index % teacherIds.length] || teacherIds[0] || primaryTeacherIdsForProgram(teachersByProgram, program.id)[0] || null;
      const student = {
        id,
        email,
        displayName,
        number: studentNumber,
        program,
        stage,
        projectTitle,
        teacherId,
        siteId: site.id,
        siteSlug: site.slug,
        storyBucket: null,
        noMentor: (index + 1) % 10 === 0,
      };
      students.push(student);
      rows.userAccounts.push({
        id,
        email,
        email_norm: normalizeEmail(email),
        display_name: displayName,
        status: "active",
      });
      rows.userRoles.push({
        user_id: id,
        role_id: "student",
        scope_type: "global",
        scope_id: "",
        assigned_by: null,
      });
      addTenantMembership(id);
      addSiteMembership(site.id, id);
      rows.groupMemberships.push({
        group_id: `demo-group-${site.slug}-program-${program.id}`,
        user_id: id,
        membership_role: "student",
      });
      rows.groupMemberships.push({
        group_id: `demo-group-${site.slug}-cohort-2027`,
        user_id: id,
        membership_role: "student",
      });
    }
  }

  const assignedStudents = students.filter((student) => !student.noMentor);
  assignedStudents.forEach((student, index) => {
    const siteMentors = mentorIdsBySite.get(student.siteId) || mentorIdsBySite.get(PRIMARY_SITE_ID) || [];
    const mentorId = siteMentors[index % siteMentors.length] || `demo-mentor-${pad((index % resolvedMentorCount) + 1, 3)}`;
    rows.mentorAssignments.push({
      id: `demo-mentor-assignment-${pad(student.number, 3)}`,
      mentor_user_id: mentorId,
      student_user_id: student.id,
      assigned_by: null,
      active: 1,
    });
    student.mentorId = mentorId;
  });

  students
    .filter((student) => student.siteId === PRIMARY_SITE_ID)
    .slice(0, 3)
    .forEach((student) => {
      rows.viewerStudentAssignments.push({
        id: `demo-viewer-assignment-${pad(student.number, 3)}`,
        viewer_user_id: "demo-viewer-desert-valley-high",
        student_user_id: student.id,
        assigned_by: null,
        active: 1,
      });
    });

  for (const student of students) {
    const stage = stageShape(student.stage);
    const updatedBy = student.teacherId || student.id;
    rows.progressRecords.push({
      id: `demo-progress-${student.id}-proposal`,
      student_id: student.id,
      requirement_id: lookups.proposalRequirementId,
      phase: lookups.proposalPhase,
      status: stage.progressStatus,
      updated_by: updatedBy,
      updated_at: dateForStudent(student.number, -stage.ageDays),
    });
    if (!stage.submissionStatus) continue;
    const submissionId = `demo-submission-${student.id}-proposal`;
    const createdAt = dateForStudent(student.number, -(stage.ageDays + 8));
    const updatedAt = dateForStudent(student.number, -stage.ageDays);
    rows.submissions.push({
      id: submissionId,
      student_id: student.id,
      requirement_id: lookups.proposalRequirementId,
      status: stage.submissionStatus,
      version: stage.version,
      submitted_at: stage.submitted ? dateForStudent(student.number, -(stage.ageDays + 3)) : null,
      created_at: createdAt,
      updated_at: updatedAt,
    });
    student.submissionId = submissionId;
    student.submissionStatus = stage.submissionStatus;
    student.submissionVersion = stage.version;

    rows.statusHistory.push({
      id: `demo-status-history-${student.id}-draft`,
      student_id: student.id,
      entity_type: "submission",
      entity_id: submissionId,
      from_status: null,
      to_status: "draft",
      changed_by: student.id,
      reason: `${DEMO_MARKER}: ${student.projectTitle} proposal draft created.`,
      created_at: createdAt,
    });
    if (stage.submissionStatus !== "draft") {
      rows.statusHistory.push({
        id: `demo-status-history-${student.id}-${stage.submissionStatus}`,
        student_id: student.id,
        entity_type: "submission",
        entity_id: submissionId,
        from_status: "draft",
        to_status: stage.submissionStatus,
        changed_by: updatedBy,
        reason: `${DEMO_MARKER}: ${statusReason(stage.submissionStatus, student.projectTitle)}`,
        created_at: updatedAt,
      });
    }
  }

  for (const student of students) {
    if (!student.submissionId) continue;
    const count = evidenceCountForStudent(student);
    for (let index = 0; index < count; index += 1) {
      const template = EVIDENCE_TEMPLATES[index % EVIDENCE_TEMPLATES.length];
      rows.evidenceArtifacts.push({
        id: `demo-evidence-${student.id}-${pad(index + 1, 2)}`,
        repository_id: "default-google-drive",
        student_id: student.id,
        submission_id: student.submissionId,
        artifact_type: template.artifactType,
        source_kind: "external_link",
        drive_file_id: null,
        drive_parent_folder_id: null,
        external_url: `https://example.com/capstone-demo/student${pad(student.number, 3)}/${template.slug}`,
        title: template.title,
        mime_type: template.mimeType,
        size_bytes: null,
        review_status: evidenceStatusFor(student.stage, index),
        created_by: student.id,
        created_at: dateForStudent(student.number + index, -(stageShape(student.stage).ageDays + Math.max(1, count - index))),
        deleted_at: null,
      });
    }
  }

  for (const student of students) {
    if (!student.submissionId) continue;
    const teacherId = student.teacherId || "demo-teacher-it-01";
    const stage = stageShape(student.stage);
    if (["revision_requested", "approved", "archived"].includes(student.submissionStatus) || student.stage === "building" || student.stage === "presentation") {
      const decision = student.submissionStatus === "revision_requested" ? "revision_requested" : "approved";
      const feedback = feedbackFor(decision, student.projectTitle);
      rows.reviews.push({
        id: `demo-review-${student.id}-${decision}`,
        submission_id: student.submissionId,
        reviewer_user_id: teacherId,
        decision,
        feedback,
        created_at: dateForStudent(student.number, -stage.ageDays),
      });
      rows.comments.push(commentRow(`demo-comment-${student.id}-${decision}`, "submission", student.submissionId, teacherId, feedback, stage.ageDays));
    } else if (student.submissionStatus === "submitted" && student.number % 2 === 0) {
      const feedback = `${DEMO_MARKER}: Comment-only check-in for ${student.projectTitle}. Evidence is visible; teacher review is still pending.`;
      rows.reviews.push({
        id: `demo-review-${student.id}-comment`,
        submission_id: student.submissionId,
        reviewer_user_id: teacherId,
        decision: "comment_only",
        feedback,
        created_at: dateForStudent(student.number, -stage.ageDays),
      });
      rows.comments.push(commentRow(`demo-comment-${student.id}-comment`, "submission", student.submissionId, teacherId, feedback, stage.ageDays));
    }

    if (student.mentorId && student.number % 4 === 0) {
      rows.comments.push(commentRow(
        `demo-comment-${student.id}-mentor`,
        "submission",
        student.submissionId,
        student.mentorId,
        `${DEMO_MARKER}: Mentor check-in noted steady progress on ${student.projectTitle}; next step is a clearer evidence caption.`,
        stage.ageDays - 1,
      ));
    }
    if (evidenceCountForStudent(student) === 0 || student.stage === "high_risk") {
      rows.comments.push(commentRow(
        `demo-comment-${student.id}-intervention`,
        "progress_record",
        `demo-progress-${student.id}-proposal`,
        teacherId,
        `${DEMO_MARKER}: Intervention reminder for ${student.projectTitle}; student needs a concrete next step and evidence attached.`,
        Math.max(1, stage.ageDays - 2),
      ));
    }
  }

  if (capabilities.submissionVersions) {
    for (const student of students) {
      if (!student.submissionId || student.submissionStatus === "draft") continue;
      const evidenceSnapshot = rows.evidenceArtifacts
        .filter((artifact) => artifact.submission_id === student.submissionId && artifact.review_status !== "archived")
        .map((artifact) => ({
          id: artifact.id,
          title: artifact.title,
          artifactType: artifact.artifact_type,
          sourceKind: artifact.source_kind,
          reviewStatus: artifact.review_status,
          createdAt: artifact.created_at,
        }));
      rows.submissionVersions.push({
        id: `demo-submission-version-${student.id}-${student.submissionVersion}`,
        submission_id: student.submissionId,
        student_id: student.id,
        requirement_id: lookups.proposalRequirementId,
        version: student.submissionVersion,
        status: student.submissionStatus,
        submitted_by: student.id,
        submitted_at: dateForStudent(student.number, -(stageShape(student.stage).ageDays + 3)),
        evidence_snapshot_json: JSON.stringify(evidenceSnapshot),
        notes: `${DEMO_MARKER}: Version ${student.submissionVersion} snapshot for ${student.projectTitle}.`,
      });
    }
  }

  if (capabilities.mentorMeetings) {
    const meetingStudents = assignedStudents.slice(0, 200);
    meetingStudents.forEach((student, index) => {
      const status = meetingStatus(index);
      rows.mentorMeetings.push({
        id: `demo-mentor-meeting-${pad(student.number, 3)}`,
        mentor_user_id: student.mentorId,
        student_user_id: student.id,
        submission_id: student.submissionId || null,
        status,
        scheduled_for: dateForStudent(student.number, status === "scheduled" ? 8 : -12),
        held_at: status === "held" ? dateForStudent(student.number, -10) : null,
        notes: `${DEMO_MARKER}: ${mentorMeetingNote(status, student.projectTitle)}`,
        created_by: student.mentorId,
        created_at: dateForStudent(student.number, -15),
        updated_at: dateForStudent(student.number, -8),
      });
    });
  }

  if (capabilities.presentationSlots) {
    const presentationCandidates = students.filter((student) => ["presentation", "completed"].includes(student.stage)).concat(
      students.filter((student) => student.stage === "approved").slice(0, 5),
      students.filter((student) => student.storyBucket === "rich_timeline"),
    );
    presentationCandidates.forEach((student, index) => {
      const slot = student.storyBucket === "presentation_pending"
        ? { status: "scheduled", outlineStatus: index % 2 === 0 ? "pending" : "revision_needed", checkedOut: false, checkedIn: false, dayOffset: 10 }
        : presentationSlotShape(student.stage, index);
      rows.presentationSlots.push({
        id: `demo-presentation-slot-${pad(student.number, 3)}`,
        student_user_id: student.id,
        submission_id: student.submissionId || null,
        requirement_id: lookups.presentationRequirementId,
        scheduled_for: dateForStudent(student.number, slot.dayOffset, "17:00:00.000Z"),
        duration_minutes: 20,
        location: `Demo Room ${101 + (index % 5)}`,
        status: slot.status,
        outline_status: slot.outlineStatus,
        checked_out_at: slot.checkedOut ? dateForStudent(student.number, slot.dayOffset, "16:30:00.000Z") : null,
        checked_in_at: slot.checkedIn ? dateForStudent(student.number, slot.dayOffset, "18:00:00.000Z") : null,
        notes: `${DEMO_MARKER}: Presentation slot for ${student.projectTitle}; synthetic local demo only.`,
        created_by: student.teacherId || "demo-teacher-it-01",
        created_at: dateForStudent(student.number, -18),
        updated_at: dateForStudent(student.number, -2),
      });
    });
  }

  if (capabilities.exports) {
    const archiveReadyStudents = students.filter((student) => ["model_excellent", "archive_ready", "rich_timeline"].includes(student.storyBucket));
    const archiveFailedStudents = students.filter((student) => student.storyBucket === "archive_failed");
    const queuedStudents = students.filter((student) => ["presentation", "approved"].includes(student.stage) && !student.storyBucket).slice(0, 8);
    const exportStudents = [
      ...archiveReadyStudents.map((student) => ({ student, status: "complete" })),
      ...archiveFailedStudents.map((student) => ({ student, status: "failed" })),
      ...queuedStudents.map((student, index) => ({ student, status: index % 2 === 0 ? "queued" : "running" })),
    ];
    exportStudents.forEach(({ student, status }, index) => {
      const exportId = `demo-export-${pad(index + 1, 3)}`;
      rows.exports.push({
        id: exportId,
        export_type: "student_archive_manifest",
        requested_by: student.teacherId || "demo-teacher-it-01",
        target_user_id: student.id,
        drive_file_id: null,
        status,
        created_at: dateForStudent(student.number, -4),
        completed_at: status === "complete" ? dateForStudent(student.number, -3) : null,
      });
      if (capabilities.exportArtifacts && status === "complete") {
        const body = JSON.stringify({
          marker: DEMO_MARKER,
          studentId: student.id,
          projectTitle: student.projectTitle,
          synthetic: true,
          driveFileCreated: false,
        });
        rows.exportArtifacts.push({
          id: `demo-export-artifact-${pad(index + 1, 3)}`,
          export_id: exportId,
          artifact_type: "archive_manifest",
          title: `DEMO_SEED Archive Manifest ${pad(index + 1, 3)}`,
          mime_type: "application/json",
          byte_length: Buffer.byteLength(body, "utf8"),
          content_sha256: sha256Hex(body),
          body_json: body,
          expires_at: dateForStudent(student.number, 30),
          created_at: dateForStudent(student.number, -3),
        });
      }
    });
  }

  rows.auditEvents.push(
    auditEvent("demo-audit-seed-started", "demo_seed_started", `${demoLocationLabel}_demo_workspace`, "demo-workspace", null, { marker: DEMO_MARKER, synthetic: true }),
    auditEvent("demo-audit-admin-ready", "demo_admin_dashboard_ready", `${demoLocationLabel}_demo_workspace`, "demo-admin-dashboard", includeDemoAdmin ? demoAdminId : "demo-platform-admin-001", { marker: DEMO_MARKER, students: students.length, primarySiteStudents: DEMO_SITES[0].studentCount }),
    auditEvent("demo-audit-mentor-ready", "demo_mentor_dashboard_ready", `${demoLocationLabel}_demo_workspace`, "demo-mentor-dashboard", "demo-mentor-001", { marker: DEMO_MARKER, mentors: Array.from(mentorIdsBySite.values()).flat().length }),
  );

  return {
    rows,
    credentials,
    generatedCounts: generatedCounts(rows),
    programDistribution: programDistributionForStudents(students),
    siteDistribution: siteDistributionForStudents(students),
    stageDistribution: { ...STAGE_COUNTS },
    storyBuckets: storyBucketSummary(students),
  };
}

function programsForSite(site) {
  if (site.programIds === "all") return PROGRAMS;
  const ids = new Set(site.programIds);
  return PROGRAMS.filter((program) => ids.has(program.id));
}

function primaryTeacherIdsForProgram(teachersByProgram, programId) {
  return (teachersByProgram.get(programId) || []).filter((id) => !id.includes("canyon-ridge-career") && !id.includes("north-valley-tech"));
}

function secondaryTeacherIdsForSiteProgram(siteSlug, teachersByProgram, programId) {
  return (teachersByProgram.get(programId) || []).filter((id) => id.includes(siteSlug));
}

function storyForPrimaryStudent(studentNumber) {
  let start = 1;
  for (const bucket of STORY_BUCKETS) {
    const end = start + bucket.count - 1;
    if (studentNumber >= start && studentNumber <= end) {
      return {
        ...bucket,
        index: studentNumber - start + 1,
      };
    }
    start = end + 1;
  }
  return null;
}

function programDistributionForStudents(students) {
  const output = {};
  for (const program of PROGRAMS) output[program.name] = 0;
  for (const student of students) output[student.program.name] = (output[student.program.name] || 0) + 1;
  return output;
}

function siteDistributionForStudents(students) {
  const output = Object.fromEntries(DEMO_SITES.map((site) => [site.id, {
    name: site.name,
    students: 0,
  }]));
  for (const student of students) {
    if (!output[student.siteId]) output[student.siteId] = { name: student.siteId, students: 0 };
    output[student.siteId].students += 1;
  }
  return output;
}

function storyBucketSummary(students) {
  const output = Object.fromEntries(STORY_BUCKETS.map((bucket) => [bucket.id, {
    label: bucket.label,
    count: 0,
    searchPrefix: `${bucket.prefix} Demo`,
  }]));
  for (const student of students) {
    if (!student.storyBucket || !output[student.storyBucket]) continue;
    output[student.storyBucket].count += 1;
  }
  return output;
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function emptyRows() {
  return {
    tenants: [],
    programs: [],
    sites: [],
    sitePrograms: [],
    cohorts: [],
    groups: [],
    userAccounts: [],
    passwordCredentials: [],
    userRoles: [],
    tenantUsers: [],
    siteUsers: [],
    groupMemberships: [],
    mentorAssignments: [],
    viewerStudentAssignments: [],
    progressRecords: [],
    submissions: [],
    statusHistory: [],
    evidenceArtifacts: [],
    reviews: [],
    comments: [],
    submissionVersions: [],
    mentorMeetings: [],
    presentationSlots: [],
    exports: [],
    exportArtifacts: [],
    auditEvents: [],
  };
}

function stageShape(stage) {
  const shapes = {
    not_started: { progressStatus: "not_started", submissionStatus: null, version: 0, submitted: false, ageDays: 40 },
    draft: { progressStatus: "in_progress", submissionStatus: "draft", version: 1, submitted: false, ageDays: 28 },
    submitted: { progressStatus: "submitted", submissionStatus: "submitted", version: 1, submitted: true, ageDays: 16 },
    revision_requested: { progressStatus: "revision_requested", submissionStatus: "revision_requested", version: 2, submitted: true, ageDays: 12 },
    approved: { progressStatus: "approved", submissionStatus: "approved", version: 1, submitted: true, ageDays: 9 },
    building: { progressStatus: "approved", submissionStatus: "approved", version: 1, submitted: true, ageDays: 7 },
    presentation: { progressStatus: "approved", submissionStatus: "approved", version: 1, submitted: true, ageDays: 5 },
    completed: { progressStatus: "archived", submissionStatus: "archived", version: 2, submitted: true, ageDays: 3 },
    high_risk: { progressStatus: "revision_requested", submissionStatus: "revision_requested", version: 2, submitted: true, ageDays: 21 },
  };
  return shapes[stage];
}

function expandStagePool() {
  const output = [];
  for (const [stage, count] of Object.entries(STAGE_COUNTS)) {
    for (let index = 0; index < count; index += 1) output.push(stage);
  }
  return output;
}

function evidenceCountForStage(stage, studentNumber) {
  if (stage === "not_started") return 0;
  if (stage === "draft") return studentNumber % 2;
  if (stage === "submitted") return 1 + (studentNumber % 2);
  if (stage === "revision_requested") return 1 + (studentNumber % 3);
  if (stage === "high_risk") return studentNumber % 2;
  if (stage === "approved") return 2 + (studentNumber % 3);
  if (stage === "building") return 4 + (studentNumber % 3);
  if (stage === "presentation") return 3 + (studentNumber % 4);
  if (stage === "completed") return 5 + (studentNumber % 2);
  return 1;
}

function evidenceCountForStudent(student) {
  if (
    student.siteId === PRIMARY_SITE_ID
    && student.program?.id === "it"
    && student.storyBucket === "missing_mentor"
    && student.number % 3 === 0
  ) {
    return 0;
  }
  return evidenceCountForStage(student.stage, student.number);
}

function evidenceStatusFor(stage, index) {
  if (stage === "revision_requested" || stage === "high_risk") return index === 0 ? "revision_requested" : "pending_review";
  if (stage === "completed") return "approved";
  if (stage === "approved" || stage === "building" || stage === "presentation") return index % 4 === 0 ? "pending_review" : "approved";
  return "pending_review";
}

function meetingStatus(index) {
  if (index % 10 === 0) return "missed";
  if (index % 8 === 0) return "makeup_required";
  if (index % 5 === 0) return "scheduled";
  return "held";
}

function presentationSlotShape(stage, index) {
  if (stage === "completed") {
    return { status: "completed", outlineStatus: "approved", checkedOut: true, checkedIn: true, dayOffset: -2 };
  }
  if (index % 9 === 0) return { status: "scheduled", outlineStatus: "revision_needed", checkedOut: false, checkedIn: false, dayOffset: 12 };
  if (index % 7 === 0) return { status: "checked_in", outlineStatus: "approved", checkedOut: true, checkedIn: true, dayOffset: 1 };
  if (index % 5 === 0) return { status: "checked_out", outlineStatus: "approved", checkedOut: true, checkedIn: false, dayOffset: 1 };
  if (index % 3 === 0) return { status: "scheduled", outlineStatus: "pending", checkedOut: false, checkedIn: false, dayOffset: 9 };
  return { status: "scheduled", outlineStatus: "approved", checkedOut: false, checkedIn: false, dayOffset: 8 };
}

function feedbackFor(decision, projectTitle) {
  if (decision === "approved") {
    return `${DEMO_MARKER}: Approved. ${projectTitle} has a clear scope, usable evidence, and a safe next step for build/presentation readiness.`;
  }
  return `${DEMO_MARKER}: Revision requested. ${projectTitle} needs a tighter success measure and one more piece of specific evidence before approval.`;
}

function statusReason(status, projectTitle) {
  if (status === "submitted") return `${projectTitle} submitted for program teacher review.`;
  if (status === "revision_requested") return `${projectTitle} moved into revision loop after teacher feedback.`;
  if (status === "approved") return `${projectTitle} approved for build and mentor evidence.`;
  if (status === "archived") return `${projectTitle} completed and archived in local demo metadata.`;
  return `${projectTitle} status updated to ${status}.`;
}

function mentorMeetingNote(status, projectTitle) {
  if (status === "held") return `Held meeting reviewed ${projectTitle} progress and next evidence step.`;
  if (status === "missed") return `Missed meeting for ${projectTitle}; teacher follow-up is visible in dashboards.`;
  if (status === "makeup_required") return `Makeup meeting required for ${projectTitle}; mentor should reschedule.`;
  return `Scheduled mentor check-in for ${projectTitle}.`;
}

function commentRow(id, entityType, entityId, authorUserId, body, ageDays) {
  return {
    id,
    entity_type: entityType,
    entity_id: entityId,
    author_user_id: authorUserId,
    visibility: "student_and_staff",
    body,
    created_at: dateForStudent(Number(id.match(/(\d{3})/)?.[1] || 1), -ageDays),
    deleted_at: null,
  };
}

function auditEvent(id, action, entityType, entityId, actorUserId, metadata) {
  return {
    id,
    actor_user_id: actorUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    ip_hash: null,
    user_agent_hash: null,
    metadata_json: JSON.stringify(metadata),
    created_at: "2026-05-01T15:00:00.000Z",
  };
}

function generatedCounts(rows) {
  return Object.fromEntries(Object.entries(rows).map(([key, value]) => [key, value.length]));
}

function buildSeedSql(dataset, schema, { includeDeletes = true, includeTransaction = true } = {}) {
  const statements = [
    "PRAGMA foreign_keys = ON;",
  ];
  if (includeTransaction) statements.push("BEGIN TRANSACTION;");
  if (includeDeletes) {
    for (const spec of deleteSpecs(schema)) {
      statements.push(`DELETE FROM ${quoteIdent(spec.table)} WHERE ${spec.where};`);
    }
  }

  const rows = dataset.rows;
  pushRows(statements, "tenants", rows.tenants);
  pushRows(statements, "programs", rows.programs || []);
  pushRows(statements, "sites", rows.sites);
  pushRows(statements, "site_programs", rows.sitePrograms);
  pushRows(statements, "cohorts", rows.cohorts);
  pushRows(statements, "groups", rows.groups);
  pushRows(statements, "user_accounts", rows.userAccounts);
  pushRows(statements, "password_credentials", rows.passwordCredentials);
  pushRows(statements, "user_roles", rows.userRoles);
  pushRows(statements, "tenant_users", rows.tenantUsers);
  pushRows(statements, "site_users", rows.siteUsers);
  pushRows(statements, "group_memberships", rows.groupMemberships);
  pushRows(statements, "mentor_assignments", rows.mentorAssignments);
  pushRows(statements, "viewer_student_assignments", rows.viewerStudentAssignments);
  pushRows(statements, "progress_records", rows.progressRecords);
  pushRows(statements, "submissions", rows.submissions);
  pushRows(statements, "evidence_artifacts", rows.evidenceArtifacts);
  pushRows(statements, "reviews", rows.reviews);
  pushRows(statements, "comments", rows.comments);
  pushRows(statements, "status_history", rows.statusHistory);
  if (schema.tableNames.has("submission_versions")) pushRows(statements, "submission_versions", rows.submissionVersions);
  if (schema.tableNames.has("mentor_meetings")) pushRows(statements, "mentor_meetings", rows.mentorMeetings);
  if (schema.tableNames.has("presentation_slots")) pushRows(statements, "presentation_slots", rows.presentationSlots);
  if (schema.tableNames.has("exports")) pushRows(statements, "exports", rows.exports);
  if (schema.tableNames.has("export_artifacts")) pushRows(statements, "export_artifacts", rows.exportArtifacts);
  pushRows(statements, "audit_events", rows.auditEvents);
  if (includeTransaction) statements.push("COMMIT;");
  statements.push("");
  return statements.join("\n");
}

function pushRows(statements, table, rows) {
  for (const row of rows) {
    const columns = Object.keys(row);
    statements.push(
      `INSERT INTO ${quoteIdent(table)} (${columns.map(quoteIdent).join(", ")}) VALUES (${columns.map((column) => sqlString(row[column])).join(", ")});`,
    );
  }
}

async function verifySeedState(adapter, schema) {
  const queries = [
    "SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'student' WHERE u.email_norm LIKE '%@demo-student.capstone.test';",
    "SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'program_teacher' WHERE u.email_norm LIKE '%@demo-staff.capstone.test';",
    "SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'mentor' WHERE u.email_norm LIKE '%@demo-staff.capstone.test';",
    "SELECT COUNT(*) AS count FROM mentor_assignments WHERE id LIKE 'demo-%' AND active = 1;",
    "SELECT COUNT(DISTINCT student_user_id) AS count FROM mentor_assignments WHERE id LIKE 'demo-%' AND active = 1;",
    "SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'student' LEFT JOIN mentor_assignments ma ON ma.student_user_id = u.id AND ma.active = 1 WHERE u.email_norm LIKE '%@demo-student.capstone.test' AND ma.id IS NULL;",
    "SELECT COUNT(*) AS count FROM submissions WHERE id LIKE 'demo-%';",
    "SELECT COUNT(*) AS count FROM evidence_artifacts WHERE id LIKE 'demo-%' AND source_kind = 'external_link' AND external_url LIKE 'https://example.com/capstone-demo/%' AND drive_file_id IS NULL AND drive_parent_folder_id IS NULL;",
    "SELECT COUNT(*) AS count FROM comments WHERE id LIKE 'demo-%';",
    "SELECT COUNT(*) AS count FROM reviews WHERE id LIKE 'demo-%';",
    "SELECT COUNT(*) AS count FROM user_accounts WHERE email_norm LIKE '%nv.ccsd.net' OR email_norm = 'bryan@thecapstoneapp.com';",
    `SELECT COUNT(*) AS count FROM tenants WHERE id = ${sqlString(DEMO_TENANT_ID)} AND status = 'active';`,
    `SELECT COUNT(*) AS count FROM sites WHERE tenant_id = ${sqlString(DEMO_TENANT_ID)} AND status = 'active';`,
    `SELECT COUNT(*) AS count
     FROM site_users su
     JOIN user_roles r ON r.user_id = su.user_id AND r.role_id = 'student'
     JOIN user_accounts u ON u.id = su.user_id AND u.email_norm LIKE '%@demo-student.capstone.test'
     WHERE su.site_id = ${sqlString(PRIMARY_SITE_ID)}
       AND su.membership_status = 'active';`,
    `SELECT COUNT(*) AS count
     FROM site_users su
     JOIN user_roles r ON r.user_id = su.user_id AND r.role_id = 'student'
     JOIN user_accounts u ON u.id = su.user_id AND u.email_norm LIKE '%@demo-student.capstone.test'
     WHERE su.site_id IN (${DEMO_SITES.filter((site) => !site.primary).map((site) => sqlString(site.id)).join(", ")})
       AND su.membership_status = 'active';`,
    `SELECT COUNT(*) AS count FROM site_programs WHERE site_id = ${sqlString(PRIMARY_SITE_ID)} AND active = 1;`,
    `SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'global_admin' WHERE u.email_norm LIKE '%@demo-staff.capstone.test';`,
    `SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'administration' WHERE u.email_norm LIKE '%@demo-staff.capstone.test';`,
    `SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'site_admin' WHERE u.email_norm LIKE '%@demo-staff.capstone.test';`,
    `SELECT COUNT(*) AS count FROM user_accounts u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'viewer' WHERE u.email_norm LIKE '%@demo-staff.capstone.test';`,
    "SELECT COUNT(*) AS count FROM viewer_student_assignments WHERE id LIKE 'demo-%' AND active = 1;",
    `SELECT COUNT(*) AS count FROM password_credentials WHERE user_id IN (SELECT id FROM user_accounts WHERE email_norm LIKE '%@demo-student.capstone.test');`,
    "SELECT COUNT(*) AS count FROM announcements WHERE id LIKE 'demo-%' OR title LIKE '%DEMO_SEED%' OR body LIKE '%DEMO_SEED%';",
    "PRAGMA foreign_key_check;",
  ];
  const rows = await adapter.queryBatch(queries);
  const summary = {
    demoStudents: firstCount(rows[0]),
    demoProgramTeachers: firstCount(rows[1]),
    demoMentors: firstCount(rows[2]),
    mentorAssignments: firstCount(rows[3]),
    studentsWithMentors: firstCount(rows[4]),
    studentsWithoutMentors: firstCount(rows[5]),
    submissions: firstCount(rows[6]),
    evidenceMetadata: firstCount(rows[7]),
    comments: firstCount(rows[8]),
    reviews: firstCount(rows[9]),
    forbiddenRealDomainRows: firstCount(rows[10]),
    demoTenantRows: firstCount(rows[11]),
    demoSites: firstCount(rows[12]),
    primarySiteStudents: firstCount(rows[13]),
    secondarySiteStudents: firstCount(rows[14]),
    primarySitePrograms: firstCount(rows[15]),
    globalAdmins: firstCount(rows[16]),
    administrationUsers: firstCount(rows[17]),
    siteAdmins: firstCount(rows[18]),
    viewers: firstCount(rows[19]),
    viewerStudentAssignments: firstCount(rows[20]),
    studentCredentials: firstCount(rows[21]),
    announcements: firstCount(rows[22]),
    foreignKeyViolations: rows[23].length,
  };
  summary.primaryAvailablePrograms = firstCount(await adapter.query(
    `SELECT COUNT(*) AS count
     FROM programs
     LEFT JOIN site_programs
       ON site_programs.site_id = ${sqlString(PRIMARY_SITE_ID)}
      AND site_programs.program_id = programs.id
      AND site_programs.active = 1
     WHERE programs.active = 1
      AND site_programs.program_id IS NULL;`,
  ));
  const optional = {};
  if (schema.tableNames.has("mentor_meetings")) optional.mentorMeetings = firstCount(await adapter.query("SELECT COUNT(*) AS count FROM mentor_meetings WHERE id LIKE 'demo-%';"));
  if (schema.tableNames.has("presentation_slots")) optional.presentationSlots = firstCount(await adapter.query("SELECT COUNT(*) AS count FROM presentation_slots WHERE id LIKE 'demo-%';"));
  if (schema.tableNames.has("exports")) optional.exports = firstCount(await adapter.query("SELECT COUNT(*) AS count FROM exports WHERE id LIKE 'demo-%';"));
  if (schema.tableNames.has("export_artifacts")) optional.exportArtifacts = firstCount(await adapter.query("SELECT COUNT(*) AS count FROM export_artifacts WHERE id LIKE 'demo-%';"));
  if (schema.tableNames.has("submission_versions")) optional.submissionVersions = firstCount(await adapter.query("SELECT COUNT(*) AS count FROM submission_versions WHERE id LIKE 'demo-%';"));

  const secondarySiteCounts = await siteStudentCounts(adapter, DEMO_SITES.filter((site) => !site.primary).map((site) => site.id));
  const storyBuckets = await storyBucketCounts(adapter);
  const storyBucketsOk = STORY_BUCKETS.every((bucket) => Number(storyBuckets[bucket.id]?.count || 0) >= bucket.count);
  const secondaryCountsOk = Object.values(secondarySiteCounts).every((count) => count >= 40 && count <= 75);

  if (
    summary.demoStudents !== 370
    || summary.primarySiteStudents !== 250
    || !secondaryCountsOk
    || summary.demoProgramTeachers < 22
    || summary.demoMentors < 41
    || summary.demoTenantRows !== 1
    || summary.demoSites !== 3
    || summary.primarySitePrograms !== PROGRAMS.length
    || summary.primaryAvailablePrograms < DEMO_ADDABLE_PROGRAMS.length
    || summary.globalAdmins !== 1
    || summary.administrationUsers !== 1
    || summary.siteAdmins !== 3
    || summary.viewers !== 1
    || summary.viewerStudentAssignments !== 3
    || summary.studentCredentials !== 0
    || summary.announcements !== 0
    || !storyBucketsOk
    || summary.forbiddenRealDomainRows !== 0
    || summary.foreignKeyViolations !== 0
  ) {
    throw new DemoSeedError("SEED_VERIFY_FAILED", "Local demo seed verification failed.", { summary, optional });
  }
  const programRows = await adapter.query(
    `SELECT programs.name, COUNT(DISTINCT gm.user_id) AS count
     FROM programs
     LEFT JOIN groups g ON g.program_id = programs.id
     LEFT JOIN group_memberships gm ON gm.group_id = g.id
     LEFT JOIN user_accounts u ON u.id = gm.user_id
     WHERE u.email_norm LIKE '%@demo-student.capstone.test'
     GROUP BY programs.id, programs.name
     ORDER BY programs.name;`,
  );
  const stageRows = await adapter.query(
    `SELECT COALESCE(s.status, 'not_started') AS status, COUNT(*) AS count
     FROM user_accounts u
     JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'student'
     LEFT JOIN submissions s ON s.student_id = u.id
     WHERE u.email_norm LIKE '%@demo-student.capstone.test'
     GROUP BY COALESCE(s.status, 'not_started')
     ORDER BY status;`,
  );
  return {
    ...summary,
    ...optional,
    secondarySiteCounts,
    storyBuckets,
    programDistribution: Object.fromEntries(programRows.map((row) => [row.name, Number(row.count || 0)])),
    submissionStatusDistribution: Object.fromEntries(stageRows.map((row) => [row.status, Number(row.count || 0)])),
  };
}

async function siteStudentCounts(adapter, siteIds) {
  if (!siteIds.length) return {};
  const rows = await adapter.query(
    `SELECT su.site_id, COUNT(DISTINCT su.user_id) AS count
     FROM site_users su
     JOIN user_accounts u ON u.id = su.user_id AND u.email_norm LIKE '%@${STUDENT_DOMAIN}'
     JOIN user_roles r ON r.user_id = su.user_id AND r.role_id = 'student'
     WHERE su.site_id IN (${siteIds.map(sqlString).join(", ")})
       AND su.membership_status = 'active'
     GROUP BY su.site_id
     ORDER BY su.site_id;`,
  );
  return Object.fromEntries(rows.map((row) => [row.site_id, Number(row.count || 0)]));
}

async function storyBucketCounts(adapter) {
  const output = {};
  for (const bucket of STORY_BUCKETS) {
    const rows = await adapter.query(
      `SELECT COUNT(*) AS count
       FROM user_accounts u
       JOIN site_users su ON su.user_id = u.id AND su.site_id = ${sqlString(PRIMARY_SITE_ID)}
       WHERE u.email_norm LIKE '%@${STUDENT_DOMAIN}'
         AND u.display_name LIKE ${sqlString(`${bucket.prefix} Demo%`)};`,
    );
    output[bucket.id] = {
      label: bucket.label,
      count: firstCount(rows),
      searchPrefix: `${bucket.prefix} Demo`,
    };
  }
  return output;
}

async function runDemoSeed(args, options = {}) {
  if (args.target !== "local") {
    throw new DemoSeedError("REMOTE_REFUSED", "The demo seeder is local-only and refuses remote D1 targets.");
  }
  const repoRoot = options.repoRoot || REPO_ROOT;
  const repo = options.verifyRepo === false ? null : assertRepoIdentity(repoRoot);
  const adapter = options.adapter || new WranglerD1Adapter({ repoRoot, target: "local" });
  const schema = await introspectSchema(adapter);
  const { capabilities, skippedSlices } = validateSchemaCapabilities(schema);
  const lookups = await loadLookups(adapter);
  const protectedAdminsBefore = await verifyProtectedAdmins(adapter);
  const deletePlanBefore = await buildDeletePlan(adapter, schema);
  const dataset = await buildDemoDataset({
    capabilities,
    lookups,
    seed: args.seed || DEFAULT_SEED,
    passwordPepper: options.passwordPepper ?? process.env.PASSWORD_PEPPER ?? "",
  });
  const base = {
    ok: true,
    target: "local",
    mode: args.mode,
    resetRequested: Boolean(args.reset),
    repo,
    protectedAdminsBefore,
    deletePlan: {
      demoRowsFoundBeforeReset: deletePlanBefore.counts,
      totalDemoRowsFoundBeforeReset: deletePlanBefore.total,
    },
    generatedCounts: dataset.generatedCounts,
    programDistribution: dataset.programDistribution,
    siteDistribution: dataset.siteDistribution,
    stageDistribution: dataset.stageDistribution,
    storyBuckets: dataset.storyBuckets,
    skippedSlices,
    credentialPath: null,
    credentialsPrinted: false,
    credentialValuesCommitted: false,
    finalVerification: null,
    protectedAdminsAfter: null,
  };
  if (args.mode === "dryrun") {
    return base;
  }

  const sqlText = buildSeedSql(dataset, schema);
  await adapter.executeScript(sqlText, { label: "local-demo-workspace-seed", repoRoot });
  const protectedAdminsAfter = await verifyProtectedAdmins(adapter);
  const deletePlanAfter = await buildDeletePlan(adapter, schema);
  const finalVerification = await verifySeedState(adapter, schema);
  const credentialPath = options.writeCredentials === false
    ? null
    : writeDemoCredentialFile({
        repoRoot,
        credentials: dataset.credentials,
        now: options.now || new Date(),
        assertIgnored: options.assertIgnored || assertGitIgnored,
      });
  return {
    ...base,
    credentialPath,
    protectedAdminsAfter,
    deletePlan: {
      ...base.deletePlan,
      demoRowsDeleted: deletePlanBefore.counts,
      demoRowsInserted: deletePlanAfter.counts,
      totalDemoRowsAfterSeed: deletePlanAfter.total,
    },
    finalVerification,
  };
}

function writeDemoCredentialFile({ repoRoot, credentials, now = new Date(), assertIgnored = assertGitIgnored }) {
  const file = path.join(repoRoot, ".secrets", `demo-staff-logins-${timestampForFile(now)}.json`);
  assertSecretPath(repoRoot, file);
  assertIgnored(repoRoot, ".secrets/");
  assertIgnored(repoRoot, path.relative(repoRoot, file));
  mkdirSync(path.dirname(file), { recursive: true });
  const payload = {
    kind: "local_demo_staff_logins",
    generatedAt: now.toISOString(),
    warning: "Ignored local demo credentials. Do not commit, print, paste, screenshot, or move this file outside .secrets/.",
    localOnly: true,
    syntheticOnly: true,
    noRealStudentData: true,
    suggestedDemoUrl: "http://127.0.0.1:8788/workspace.html",
    adminLogins: credentials.adminLogins,
    personaLogins: credentials.personaLogins,
    programTeacherLogins: credentials.programTeacherLogins,
    mentorLogins: credentials.mentorLogins,
    sampleStudentLogins: credentials.sampleStudentLogins,
  };
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return path.relative(repoRoot, file).replaceAll("\\", "/");
}

async function credentialRow(userId, password, pepper, seed) {
  const salt = Buffer.from(sha256Hex(`${seed}:${userId}:salt`), "hex").subarray(0, 24);
  const derived = pbkdf2Sync(`${pepper}${password}`, salt, 100000, 32, "sha256");
  return {
    user_id: userId,
    password_hash: derived.toString("base64url"),
    password_salt: salt.toString("base64url"),
    algorithm: "PBKDF2-SHA-256",
    iterations: 100000,
    requires_reset: 0,
  };
}

function passwordFor(userId, email, displayName, seed, prefix = "DemoLocal!") {
  const token = Buffer.from(sha256Hex(`${seed}:${userId}:${email}:${displayName}`), "hex").toString("base64url").slice(0, 18);
  return `${prefix}${token}9zZ`;
}

function dateForStudent(studentNumber, dayOffset, time = "16:00:00.000Z") {
  const base = new Date(Date.UTC(2026, 4, 20));
  base.setUTCDate(base.getUTCDate() + dayOffset + (studentNumber % 7));
  const date = base.toISOString().slice(0, 10);
  return `${date}T${time}`;
}

function deterministicShuffle(values, seed) {
  const output = [...values];
  const random = seededRandom(seed);
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [output[index], output[swap]] = [output[swap], output[index]];
  }
  return output;
}

function seededRandom(seed) {
  let state = Number.parseInt(sha256Hex(seed).slice(0, 8), 16) >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function sha256Hex(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function pad(value, size) {
  return String(value).padStart(size, "0");
}

function subtractCounts(before, after) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const output = {};
  for (const key of keys) output[key] = Math.max(0, Number(before[key] || 0) - Number(after[key] || 0));
  return output;
}

function firstCount(rows) {
  return Number(rows?.[0]?.count || 0);
}

function quoteIdent(value) {
  const text = String(value || "");
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(text)) {
    throw new DemoSeedError("UNSAFE_IDENTIFIER", `Unsafe SQL identifier: ${text}`);
  }
  return `"${text}"`;
}

function sqlString(value) {
  if (value == null) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function splitSqlStatements(sqlText) {
  const statements = [];
  let current = "";
  let inString = false;
  for (let index = 0; index < sqlText.length; index += 1) {
    const char = sqlText[index];
    const next = sqlText[index + 1];
    current += char;
    if (char === "'" && inString && next === "'") {
      current += next;
      index += 1;
      continue;
    }
    if (char === "'") inString = !inString;
    if (char === ";" && !inString) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
    }
  }
  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

function extractJson(output) {
  const trimmed = String(output || "").trim();
  const startCandidates = [trimmed.indexOf("["), trimmed.indexOf("{")].filter((index) => index >= 0);
  if (!startCandidates.length) throw new Error("No JSON payload found.");
  const start = Math.min(...startCandidates);
  const end = Math.max(trimmed.lastIndexOf("]"), trimmed.lastIndexOf("}"));
  if (end <= start) throw new Error("No complete JSON payload found.");
  return JSON.parse(trimmed.slice(start, end + 1));
}

function normalizeBatchResultRows(payload) {
  const results = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.result)
      ? payload.result
      : [payload?.result || payload];
  return results.map((item) => {
    if (item?.success === false) throw new DemoSeedError("D1_QUERY_FAILED", "One D1 batch query failed.");
    return item?.results || [];
  });
}

function assertSecretPath(repoRoot, candidate) {
  const secretsRoot = path.resolve(repoRoot, ".secrets");
  const resolved = path.resolve(candidate);
  const relative = path.relative(secretsRoot, resolved);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new DemoSeedError("SECRET_PATH_UNSAFE", "Demo credential output must stay inside the repo .secrets folder.");
  }
}

function assertGitIgnored(repoRoot, relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  const result = spawnSync("git", ["check-ignore", "-q", normalized], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new DemoSeedError("SECRET_PATH_NOT_IGNORED", `${normalized} is not ignored by git.`);
  }
}

function timestampForFile(now = new Date()) {
  return now.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function redact(value) {
  return String(value || "")
    .replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[REDACTED]"')
    .replace(/"password_hash"\s*:\s*"[^"]+"/gi, '"password_hash":"[REDACTED]"')
    .replace(/"password_salt"\s*:\s*"[^"]+"/gi, '"password_salt":"[REDACTED]"');
}

function redactErrorDetails(details) {
  return JSON.parse(redact(JSON.stringify(details || {})));
}

export {
  DEFAULT_SEED,
  DEMO_ADDABLE_PROGRAMS,
  DEMO_SITES,
  DEMO_TENANT,
  DEMO_TENANT_ID,
  DEMO_MARKER,
  PRIMARY_SITE_ID,
  PROGRAMS,
  STAFF_DOMAIN,
  STUDENT_DOMAIN,
  STORY_BUCKETS,
  STAGE_COUNTS,
  DemoSeedError,
  DirectD1Adapter,
  WranglerD1Adapter,
  assertRepoIdentity,
  buildDeletePlan,
  buildDemoDataset,
  buildSeedSql,
  introspectSchema,
  loadLookups,
  parseArgs,
  runDemoSeed,
  siteStudentCounts,
  storyBucketCounts,
  validateSchemaCapabilities,
  verifyProtectedAdmins,
  verifySeedState,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs();
    const result = await runDemoSeed(args);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof DemoSeedError) {
      console.error(`Local demo seed failed: ${error.classification}: ${error.message}`);
      if (error.details && Object.keys(error.details).length > 0) {
        console.error(`Redacted details: ${JSON.stringify(redactErrorDetails(error.details))}`);
      }
    } else {
      console.error(`Local demo seed failed: UNKNOWN: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}
