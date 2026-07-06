import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = process.cwd();
const BASE_URL_FROM_ENV = (process.env.WORKSPACE_UI_POLISH_BASE_URL || "").replace(/\/$/, "");
const WORKSPACE_ENTRY_PATH = normalizeWorkspaceEntryPath(process.env.WORKSPACE_UI_POLISH_ENTRY_PATH || "/workspace.html");
const CREDENTIALS_PATH = process.env.WORKSPACE_UI_POLISH_CREDENTIALS_PATH
  || path.join(".secrets", "admin-console-local-browser-accounts.json");
const SCREENSHOT_DIR = process.env.WORKSPACE_UI_POLISH_SCREENSHOT_DIR
  || path.join("docs", "sales", "screenshots", "2026-06-30-ui-polish");
const MANIFEST_PATH = process.env.WORKSPACE_UI_POLISH_MANIFEST_PATH
  || path.join("docs", "progress", "runs", "2026-06-30-workspace-ui-polish-browser-proof.json");
const WRANGLER_JS = path.join(ROOT, "node_modules", "wrangler", "bin", "wrangler.js");

const EDGE_CANDIDATES = [
  process.env.EDGE_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const SECRET_PATTERNS = [
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /api[_-]?key/i,
  /client[_-]?secret/i,
  /BEGIN PRIVATE KEY/,
  /\.secrets/i,
  /drive_file_id/i,
  /driveFileId/i,
  /password_hash/i,
  /password_salt/i,
  /CLOUDFLARE_API_TOKEN/i,
];

const SCREENSHOT_PLAN = [
  {
    id: "01-admin-console-global-admin-desktop",
    label: "Admin Console desktop",
    persona: "Global Admin",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview"),
    viewport: { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false },
    expected: ["Admin Console", "Operations Overview", "What to fix first", "Setup reasons by lane", "Open the exact setup screen", "Current scope health", "Latest changes in this scope"],
    absent: ["Demo proof guard", "What this role can manage or monitor", "What to do first"],
    proves: "Global Admin sees the operations-first Admin Console overview with setup issues, readiness lanes, health, quick actions, and activity.",
  },
  {
    id: "02-workspace-site-admin-desktop",
    label: "Workspace desktop",
    persona: "Site Admin",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=overview"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Staff Workspace", "Site Admin Workspace", "Who needs attention today?", "Needs Review", "Open Student"],
    absent: ["Daily workspace is clear", "Role context", "Need setup or access work?"],
    proves: "Site Admin lands on student-centered Staff Workspace Today before console setup.",
  },
  {
    id: "03-program-teacher-workspace",
    label: "Program Teacher workspace",
    persona: "Program Teacher",
    authRole: "program_teacher",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=overview"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Staff Workspace", "Program Teacher Workspace", "Who needs attention today?", "Needs Review"],
    absent: ["Role context", "Demo boundary"],
    proves: "Program Teacher sees program-scoped review-first daily work.",
  },
  {
    id: "04-mentor-workspace",
    label: "Mentor workspace",
    persona: "Mentor",
    authRole: "mentor",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=overview"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Staff Workspace", "Mentor Workspace", "Who needs attention today?", "Needs Help"],
    absent: ["Admin Console", "Role context"],
    proves: "Mentor starts from assigned-student support, not broad admin tools.",
  },
  {
    id: "05-viewer-read-only-workspace",
    label: "Viewer read-only workspace",
    persona: "Viewer",
    authRole: "viewer",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=overview"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Staff Workspace", "Viewer Workspace / Read-only", "Read-only", "Who needs attention today?"],
    absent: ["Admin Console", "Role context"],
    proves: "Viewer opens in read-only Staff Workspace without Admin Console.",
  },
  {
    id: "06-student-today-desktop",
    label: "Student Today desktop",
    persona: "Student",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=student"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["My Capstone", "What to do next", "View Work", "Progress"],
    absent: ["Admin Console", "Staff Workspace"],
    proves: "Student Today answers the next capstone action with student-only navigation.",
  },
  {
    id: "07-student-today-phone",
    label: "Student Today phone",
    persona: "Student mobile",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=student"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["My Capstone", "What to do next", "View Work"],
    absent: ["Admin Console", "Staff Workspace"],
    proves: "Student Today keeps the primary action near the top at phone width.",
  },
  {
    id: "08-staff-view-as-student-phone",
    label: "Staff View as Student phone",
    persona: "Site Admin previewing student",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account using read-only preview",
    url: workspaceUrl("?section=student&siteId=site-desert-valley-high&viewAsStudentId=demo-student-101&viewAsReturnSection=students"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["Viewing as:", "read-only"],
    proves: "Staff preview keeps the read-only View as Student boundary visible on phone.",
  },
  {
    id: "09-admin-console-half-screen",
    label: "Admin Console half-screen",
    persona: "Global Admin half-screen",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview"),
    viewport: { width: 820, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Admin Console", "Operations Overview", "What to fix first", "Setup reasons by lane", "Open the exact setup screen"],
    absent: ["Demo proof guard", "What this role can manage or monitor", "What to do first"],
    proves: "Admin Console setup and quick-action overview stacks without horizontal overflow at half width.",
  },
  {
    id: "10-workspace-half-screen",
    label: "Workspace half-screen",
    persona: "Site Admin half-screen",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=overview"),
    viewport: { width: 820, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Staff Workspace", "Who needs attention today?", "Needs Review"],
    absent: ["Daily workspace is clear", "Role context"],
    proves: "Staff Workspace Today remains readable at half width.",
  },
  {
    id: "11-drawer-open-phone",
    label: "Drawer open on phone",
    persona: "Student mobile drawer",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=student"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["My Capstone menu", "Today"],
    action: "openDrawer",
    proves: "Phone drawer opens with a My Capstone menu and student-only routes.",
  },
  {
    id: "12-drawer-open-half-screen",
    label: "Drawer open half-screen",
    persona: "Site Admin half-screen drawer",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=overview"),
    viewport: { width: 820, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Staff Workspace menu", "Today"],
    action: "openDrawer",
    proves: "Half-screen staff drawer opens without covering the workflow landing or causing overflow.",
  },
  {
    id: "13-site-admin-student-detail-click",
    label: "Student detail opened from staff list",
    persona: "Site Admin student detail",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Student", "Back to Students", "More", "What this student needs next"],
    action: "clickFirstStudentDetail",
    proves: "Staff can click from the scoped student list into a protected detail drawer.",
  },
  {
    id: "14-viewer-read-only-detail-click",
    label: "Viewer read-only student detail",
    persona: "Viewer read-only detail",
    authRole: "viewer",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=students&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Student", "Read-only viewer", "Back to Students", "View work"],
    action: "clickFirstStudentDetail",
    proves: "Viewer can open assigned detail context without mutation controls.",
  },
  {
    id: "15-view-as-student-entered-desktop",
    label: "View as Student entered",
    persona: "Site Admin preview entered",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account using read-only preview",
    url: workspaceUrl("?mode=admin&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Viewing as:", "Read-only preview", "Exit student view"],
    actions: ["clickFirstViewAsStudent", "scrollTop"],
    proves: "Authorized staff can enter View as Student and see the read-only preview boundary.",
  },
  {
    id: "16-view-as-student-exited-return",
    label: "View as Student exit return",
    persona: "Site Admin preview exited",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account using read-only preview",
    url: workspaceUrl("?mode=admin&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Students", "More"],
    absent: ["Viewing as:"],
    actions: ["clickFirstViewAsStudent", "clickExitViewAsStudent", "scrollTop"],
    proves: "Exit returns staff to the scoped student list without leaving preview mode active.",
  },
  {
    id: "17-people-access-landing",
    label: "Admin People",
    persona: "Site Admin People",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminPeople&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["People", "Staff Directory", "Add Staff", "Manage Staff"],
    proves: "People opens as a focused Admin Console staff operations section.",
  },
  {
    id: "18-admin-students",
    label: "Admin Students",
    persona: "Site Admin Students",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminStudents&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Students", "Student Roster Setup", "Manage Students", "Current student accounts"],
    action: "scrollToPeopleScreen",
    proves: "Students opens as a focused roster setup section with real student rows.",
  },
  {
    id: "19-csv-import-template",
    label: "Admin Imports templates",
    persona: "Site Admin Import Students",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminImports&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Imports", "Student and Staff Imports", "Student CSV template", "Staff CSV template", "Download template", "Preview protects the roster"],
    action: "scrollToCsvImport",
    proves: "Imports shows student and staff templates plus preview and confirmation order before any save action.",
  },
  {
    id: "20-student-admin-route-blocked",
    label: "Student admin route blocked",
    persona: "Student blocked from Admin Console",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?mode=admin&section=adminUsers"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Admin Console is not available for this role", "My Capstone"],
    proves: "Student deep link to Admin Console fails safely and keeps recovery visible.",
  },
  {
    id: "21-empty-student-search",
    label: "Empty student search",
    persona: "Site Admin empty search",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=students&siteId=site-desert-valley-high&search=zzzz-no-demo-match"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["No matching student search results", "Clear filters"],
    action: "scrollToStudentDirectoryEmpty",
    proves: "Student list empty search state explains what happened and how to recover.",
  },
  {
    id: "22-student-final-files-state",
    label: "Student Final Checklist",
    persona: "Student Final Checklist",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentFinalChecklist"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Final Checklist", "What is done? What still needs work?", "Finish checks"],
    absent: ["Admin Console", "Staff Workspace"],
    proves: "Student Final Checklist summarizes remaining completion status without fake completion.",
  },
  {
    id: "24-student-my-work-desktop",
    label: "Student My Work desktop",
    persona: "Student My Work",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentWork"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["My Work", "Open work. Turn in work. Check files.", "Current work", "Missing work", "Turned in", "Files"],
    absent: ["Admin Console", "Staff Workspace", "Showing 0 of 0"],
    proves: "Student My Work shows checklist, work turned in, and proof rows as the work surface.",
  },
  {
    id: "43-student-my-work-phone",
    label: "Student My Work phone",
    persona: "Student mobile My Work",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentWork"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["My Work", "Open work. Turn in work. Check files.", "Current work", "Missing work", "Turned in", "Files"],
    absent: ["Admin Console", "Staff Workspace", "Showing 0 of 0"],
    proves: "Student My Work keeps current work, work turned in, and proof rows readable on phone width.",
  },
  {
    id: "25-student-feedback-desktop",
    label: "Student Feedback desktop",
    persona: "Student Feedback",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentFeedback"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Feedback", "Read feedback. Fix work if asked.", "Needs changes", "New feedback", "Old feedback"],
    absent: ["Admin Console", "Staff Workspace", "Showing 0 of 0"],
    proves: "Student Feedback separates revision, recent, and past feedback without staff controls.",
  },
  {
    id: "26-administration-workspace-today",
    label: "Administration Today",
    persona: "Administration",
    authRole: "misc_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=overview"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Staff Workspace", "Administration Workspace", "Who needs attention today?", "Needs Review"],
    absent: ["Need setup or access work?", "Role context"],
    proves: "Administration lands on the student attention queues instead of the old dashboard handoff.",
  },
  {
    id: "27-global-admin-workspace-today",
    label: "Global Admin Today",
    persona: "Global Admin",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=overview"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Staff Workspace", "Global Admin Workspace", "Who needs attention today?", "Open Admin Console"],
    absent: ["Need setup or access work?", "Role context"],
    proves: "Global Admin workspace defaults to queues while preserving the explicit Admin Console switch.",
  },
  {
    id: "28-student-detail-evidence",
    label: "Student detail Evidence tab",
    persona: "Site Admin evidence detail",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Student", "Evidence", "Files uploaded"],
    actions: ["clickFirstStudentDetail", "clickStudentDetailEvidenceTab"],
    proves: "Student Detail exposes the Prompt 3 Evidence tab through the protected detail drawer.",
  },
  {
    id: "29-workspace-reports",
    label: "Workspace Reports",
    persona: "Site Admin reports",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=staffReports&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Reports", "Student Progress Reports", "Visible students by status", "Needs Review", "Missing work/setup"],
    absent: ["Admin Console Overview", "Role context", "Showing 0 of 0"],
    proves: "Workspace Reports show scoped student status bars outside Admin Console.",
  },
  {
    id: "30-mobile-mentor-today",
    label: "Mobile Mentor Today",
    persona: "Mentor mobile Today",
    authRole: "mentor",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=overview"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["Staff Workspace", "Mentor Workspace", "Who needs attention today?"],
    absent: ["Admin Console", "Role context"],
    proves: "Mentor Today queues remain readable on phone width.",
  },
  {
    id: "31-mobile-student-detail",
    label: "Mobile Student Detail",
    persona: "Site Admin mobile detail",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["Student", "Overview", "Work", "Back to Students"],
    action: "clickFirstStudentDetail",
    proves: "Student Detail remains usable on phone width with the new five-tab shell.",
  },
  {
    id: "44-mobile-staff-students",
    label: "Mobile Staff Students",
    persona: "Site Admin mobile Students",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["Students", "Find a student or start with work that needs attention.", "Start Here", "Open Student"],
    absent: ["Showing 0 of 0", "Role context", "Demo boundary"],
    proves: "Staff Students keeps Start Here, filters, and row actions readable on phone width.",
  },
  {
    id: "45-mobile-student-detail-evidence",
    label: "Mobile Student Detail Evidence",
    persona: "Site Admin mobile evidence detail",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["Student", "Evidence", "Files uploaded", "FILES AND REVIEW STATUS", "Protected file details"],
    absent: ["Download file", "storage id", "Showing 0 of 0"],
    actions: ["clickFirstStudentDetail", "clickStudentDetailEvidenceTab"],
    proves: "Student Detail Evidence stays usable on phone width without exposing file/storage identifiers.",
  },
  {
    id: "32-admin-console-site-admin-overview",
    label: "Admin Console Site Admin Overview",
    persona: "Site Admin Admin Overview",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Admin Console", "Operations Overview", "What to fix first", "Setup reasons by lane", "Open the exact setup screen", "Current scope health"],
    absent: ["Demo proof guard", "What this role can manage or monitor", "Security checks that are enforced now"],
    proves: "Site Admin sees the rebuilt operations overview with setup reasons inside school scope.",
  },
  {
    id: "33-admin-assignments",
    label: "Admin Assignments",
    persona: "Site Admin Assignments",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminAssignments&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Assignments", "Coverage and Access Assignments", "active mentor assignments", "Manage Site Access"],
    proves: "Assignments puts coverage gaps before the existing scoped access forms.",
  },
  {
    id: "34-admin-programs",
    label: "Admin Programs",
    persona: "Site Admin Programs",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=programs&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Programs", "Programs at Desert Valley High School", "Program Teacher assignment", "Active site programs"],
    proves: "Programs shows school context, active programs, available programs, and Program Teacher coverage issues.",
  },
  {
    id: "35-admin-reports",
    label: "Admin Reports",
    persona: "Site Admin Reports",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminReports&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Reports", "Operational Reports", "Setup reasons by lane", "Operational coverage summary", "Roster completeness", "Mentor coverage"],
    absent: ["Showing 0 of 0", "No data", "No rows"],
    proves: "Reports shows roster completeness, setup reasons, coverage, review, setup, and import issue summaries.",
  },
  {
    id: "36-admin-audit",
    label: "Admin Audit",
    persona: "Global Admin Audit",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=audit"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Audit", "Access Review", "Account, role, and school access changes", "Loaded redacted rows", "Rows that may need support"],
    absent: ["Security checks that are enforced now", "Audit is for triage and proof", "Recent Protected Activity"],
    proves: "Audit shows access review, role assignments, recent changes, and potential issues without proof/debug copy.",
  },
  {
    id: "37-mobile-admin-overview",
    label: "Mobile Admin Overview",
    persona: "Site Admin mobile overview",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["Admin Console", "Operations Overview", "What to fix first", "Setup reasons by lane", "Open the exact setup screen"],
    absent: ["What to do first", "What this role can manage or monitor"],
    proves: "Mobile Admin Overview keeps setup issues and quick actions readable on phone width.",
  },
  {
    id: "38-mobile-admin-imports",
    label: "Mobile Admin Imports",
    persona: "Site Admin mobile imports",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminImports&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["Imports", "Student and Staff Imports", "Student CSV template", "Preview protects the roster"],
    action: "scrollToCsvImport",
    proves: "Mobile Imports keeps template downloads and CSV preview readable on phone width.",
  },
  {
    id: "42-mobile-admin-reports",
    label: "Mobile Admin Reports",
    persona: "Site Admin mobile reports",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminReports&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["Reports", "Admin CSV downloads", "Download CSV", "unknown states are not counted as complete"],
    actions: ["scrollToReportExports"],
    proves: "Mobile Admin Reports keeps scoped CSV export buttons and denominator confidence copy readable on phone width.",
  },
  {
    id: "39-viewer-students-directory",
    label: "Viewer Students directory",
    persona: "Viewer Students",
    authRole: "viewer",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=students&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Students", "Find a student or start with work that needs attention.", "Start Here", "Read-only"],
    absent: ["Admin Console", "Remove student", "Manage Site Access"],
    proves: "Viewer Students shows scoped read-only roster search, plain filters, and detail actions without admin controls.",
  },
  {
    id: "46-mobile-viewer-students",
    label: "Mobile Viewer Students",
    persona: "Viewer mobile Students",
    authRole: "viewer",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=students&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["Students", "Find a student or start with work that needs attention.", "Read-only"],
    absent: ["Admin Console", "Remove student", "Manage Site Access"],
    proves: "Viewer Students keeps read-only student context readable on phone width.",
  },
  {
    id: "40-staff-reviews",
    label: "Staff Reviews",
    persona: "Program Teacher Reviews",
    authRole: "program_teacher",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=teacher&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Review Work", "Work students sent in will appear here", "Can review work", "START HERE", "Choose the work to review first"],
    absent: ["Teacher intervention"],
    proves: "Staff Reviews exposes role-aware review queues, decision order, filters, selected-row context, and student detail links.",
  },
  {
    id: "41-student-detail-timeline",
    label: "Student detail Timeline tab",
    persona: "Site Admin timeline detail",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Timeline", "Showing all activity", "Recent activity", "Comment added"],
    actions: ["clickFirstStudentDetail", "clickStudentDetailTimelineTab"],
    proves: "Student Detail exposes the Timeline tab through the protected detail drawer with scoped activity context.",
  },
  {
    id: "23-student-detail-phone",
    label: "Student detail phone",
    persona: "Site Admin phone detail",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["Student", "Back to Students"],
    action: "clickFirstStudentDetail",
    proves: "Scoped student detail remains usable and bounded on phone width.",
  },
];

function normalizeWorkspaceEntryPath(value) {
  const trimmed = String(value || "").trim() || "/workspace.html";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function workspaceUrl(search = "") {
  return `${WORKSPACE_ENTRY_PATH}${search}`;
}

function absoluteRepoPath(repoRelativePath) {
  return path.resolve(ROOT, repoRelativePath);
}

function normalizeAccountRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (normalized === "global_admin" || normalized === "platform_admin") return "admin";
  if (normalized === "administration") return "misc_admin";
  return normalized;
}

async function readAccounts() {
  const absolutePath = absoluteRepoPath(CREDENTIALS_PATH);
  const raw = await fs.readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);
  const accounts = Array.isArray(parsed) ? parsed : parsed.accounts || [];
  const byRole = new Map();
  for (const account of accounts) {
    const role = normalizeAccountRole(account.role || account.key || account.roleId);
    if (!role || byRole.has(role)) continue;
    const email = account.email || account.username;
    const password = account.password;
    if (email && password) byRole.set(role, { email, password });
  }
  const requiredRoles = [...new Set(SCREENSHOT_PLAN.map((item) => normalizeAccountRole(item.authRole)).filter(Boolean))];
  const missing = requiredRoles.filter((role) => !byRole.has(role));
  if (missing.length) {
    throw new Error(`Missing local fake-account credentials for roles: ${missing.join(", ")}`);
  }
  return byRole;
}

function findEdgePath() {
  const edgePath = EDGE_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!edgePath) {
    throw new Error(`Microsoft Edge was not found. Set EDGE_PATH. Checked: ${EDGE_CANDIDATES.join(", ")}`);
  }
  return edgePath;
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, options);
  return { status: response.status, ok: response.ok, text: await response.text().catch(() => "") };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.json();
}

async function waitForHttpOk(url, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = "not reached";
  while (Date.now() < deadline) {
    try {
      const result = await fetchText(url);
      lastStatus = String(result.status);
      if (result.status >= 200 && result.status < 500) return result;
    } catch (error) {
      lastStatus = error.message;
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for local app at ${url}; last status: ${lastStatus}`);
}

async function startLocalAppIfNeeded(result) {
  if (BASE_URL_FROM_ENV) {
    result.server = {
      startedByScript: false,
      baseUrl: BASE_URL_FROM_ENV,
      note: "Using WORKSPACE_UI_POLISH_BASE_URL; script did not start local Pages.",
    };
    await waitForHttpOk(`${BASE_URL_FROM_ENV}${WORKSPACE_ENTRY_PATH}`);
    return { baseUrl: BASE_URL_FROM_ENV, app: null, stdout: [], stderr: [] };
  }
  if (!existsSync(WRANGLER_JS)) {
    throw new Error(`Wrangler CLI not found at ${WRANGLER_JS}. Run npm install before browser proof.`);
  }
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const stdout = [];
  const stderr = [];
  const app = spawn(process.execPath, [
    WRANGLER_JS,
    "pages",
    "dev",
    ".",
    "--compatibility-date=2026-05-18",
    "--port",
    String(port),
    "--ip",
    "127.0.0.1",
  ], {
    cwd: ROOT,
    env: { ...process.env, NO_COLOR: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  app.stdout.on("data", (chunk) => stdout.push(chunk.toString()));
  app.stderr.on("data", (chunk) => stderr.push(chunk.toString()));
  await waitForHttpOk(`${baseUrl}${WORKSPACE_ENTRY_PATH}`);
  result.server = {
    startedByScript: true,
    baseUrl,
    command: "node node_modules/wrangler/bin/wrangler.js pages dev . --compatibility-date=2026-05-18",
  };
  return { baseUrl, app, stdout, stderr };
}

async function waitForDevtools(port, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      return await fetchJson(`http://127.0.0.1:${port}/json/version`);
    } catch (error) {
      lastError = error;
      await sleep(250);
    }
  }
  throw new Error(`Timed out waiting for Edge DevTools endpoint: ${lastError?.message || "unknown error"}`);
}

async function getPageWebSocketUrl(port) {
  const pages = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const page = pages.find((entry) => entry.type === "page" && entry.webSocketDebuggerUrl);
  if (!page) throw new Error("No debuggable Edge page target was found.");
  return page.webSocketDebuggerUrl;
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.waitingEvents = new Map();
    socket.addEventListener("message", (event) => this.handleMessage(event));
    socket.addEventListener("close", () => {
      for (const { reject } of this.pending.values()) reject(new Error("CDP socket closed"));
      this.pending.clear();
    });
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message}${message.error.data ? `: ${message.error.data}` : ""}`));
      else resolve(message.result);
      return;
    }

    if (message.method && this.waitingEvents.has(message.method)) {
      const waiters = this.waitingEvents.get(message.method);
      for (const waiter of waiters.splice(0)) waiter.resolve(message.params || {});
    }
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(payload);
    });
  }

  waitForEvent(method, timeoutMs = 20_000) {
    return new Promise((resolve, reject) => {
      const waiter = { resolve, reject };
      if (!this.waitingEvents.has(method)) this.waitingEvents.set(method, []);
      this.waitingEvents.get(method).push(waiter);
      setTimeout(() => {
        const waiters = this.waitingEvents.get(method) || [];
        const index = waiters.indexOf(waiter);
        if (index >= 0) waiters.splice(index, 1);
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs).unref();
    });
  }

  async evaluate(expression, { awaitPromise = false } = {}) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
    }
    return result.result?.value;
  }
}

async function connectToCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", () => reject(new Error("Unable to connect to Edge CDP WebSocket")), { once: true });
  });
  return new CdpClient(socket);
}

async function setViewport(client, viewport) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: viewport.mobile,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
  });
  await client.send("Emulation.setVisibleSize", { width: viewport.width, height: viewport.height }).catch(() => {});
}

async function navigate(client, targetUrl) {
  const loaded = client.waitForEvent("Page.loadEventFired", 25_000).catch(() => null);
  await client.send("Page.navigate", { url: targetUrl });
  await loaded;
  await waitForStableWorkspace(client);
}

async function waitForStableWorkspace(client) {
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    const state = await client.evaluate(`(() => ({
      readyState: document.readyState,
      bodyText: document.body ? document.body.innerText.slice(0, 1200) : "",
      workspaceRoot: Boolean(document.querySelector("#workspaceRoot, [data-workspace-app]"))
    }))()`);
    const loading = /Loading (your )?workspace|Checking your session|Signing in/i.test(state.bodyText || "");
    if (state.readyState === "complete" && !loading) {
      await sleep(700);
      return;
    }
    await sleep(300);
  }
  throw new Error("Timed out waiting for workspace UI to settle.");
}

async function login(client, account) {
  const result = await client.evaluate(
    `(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: ${JSON.stringify(account.email)}, password: ${JSON.stringify(account.password)} })
      });
      const body = await response.json().catch(() => ({}));
      return { status: response.status, ok: body && body.ok === true, error: body && body.error ? body.error : null };
    })()`,
    { awaitPromise: true },
  );
  if (result?.status !== 200 || result?.ok !== true) {
    throw new Error(`Login failed with HTTP ${result?.status || "unknown"}${result?.error ? ` (${result.error})` : ""}`);
  }
  return { status: result.status, ok: result.ok };
}

async function logout(client) {
  await client.evaluate(
    `(async () => {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => null);
      localStorage.clear();
      sessionStorage.clear();
      return true;
    })()`,
    { awaitPromise: true },
  ).catch(() => {});
}

async function waitForSelectorState(client, selector, { present = true, timeoutMs = 15_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const matches = await client.evaluate(`(() => Boolean(document.querySelector(${JSON.stringify(selector)})))()`);
    if (present ? matches : !matches) return true;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for selector ${selector} to be ${present ? "present" : "absent"}.`);
}

async function clickSelector(client, selector, label) {
  await waitForSelectorState(client, selector);
  const clicked = await client.evaluate(`(() => {
    const target = document.querySelector(${JSON.stringify(selector)});
    if (!target) return false;
    target.scrollIntoView({ block: "center", inline: "nearest" });
    target.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Could not click ${label || selector}; selector not found: ${selector}`);
  await sleep(500);
}

async function scrollToSelector(client, selector, label) {
  await waitForSelectorState(client, selector);
  const scrolled = await client.evaluate(`(() => {
    const target = document.querySelector(${JSON.stringify(selector)});
    if (!target) return false;
    target.scrollIntoView({ block: "start", inline: "nearest" });
    return true;
  })()`);
  if (!scrolled) throw new Error(`Could not scroll to ${label || selector}; selector not found: ${selector}`);
  await sleep(700);
}

async function performSinglePlanAction(client, action) {
  if (action === "scrollTop") {
    await client.evaluate(`(() => { window.scrollTo(0, 0); return true; })()`);
    await sleep(500);
    return;
  }
  if (action === "scrollToPeopleScreen") {
    await scrollToSelector(client, "[data-people-screen]", "People screen");
    return;
  }
  if (action === "scrollToCsvImport") {
    await scrollToSelector(client, "[data-csv-import-stepper]", "CSV import stepper");
    return;
  }
  if (action === "scrollToReportExports") {
    await scrollToSelector(client, "[data-report-export-panel]", "Report exports");
    return;
  }
  if (action === "scrollToStudentDirectoryEmpty") {
    await scrollToSelector(client, "[data-student-directory-empty='true']", "student directory empty state");
    return;
  }
  if (action === "openDrawer") {
    await client.evaluate(`(() => {
      const toggle = document.querySelector("#workspaceMenuToggle");
      const rail = document.querySelector("#workspaceNavigationRail");
      if (toggle && (rail?.hidden || toggle.getAttribute("aria-expanded") === "false")) {
        toggle.click();
      }
      return {
        toggle: Boolean(toggle),
        railHidden: rail ? rail.hidden : null,
        expanded: toggle ? toggle.getAttribute("aria-expanded") : null
      };
    })()`);
    await sleep(500);
    return;
  }
  if (action === "clickFirstStudentDetail") {
    await clickSelector(client, "[data-site-student-action='view-detail'][data-student-detail-id]", "first student detail action");
    await waitForSelectorState(client, "[data-student-detail-panel='true']");
    await sleep(700);
    return;
  }
  if (action === "clickStudentDetailEvidenceTab") {
    await clickSelector(client, "[data-student-detail-tab='evidence']", "student detail Evidence tab");
    await waitForSelectorState(client, "[data-student-detail-section='evidence']");
    await sleep(700);
    return;
  }
  if (action === "clickStudentDetailTimelineTab") {
    await clickSelector(client, "[data-student-detail-tab='timeline']", "student detail Timeline tab");
    await waitForSelectorState(client, "[data-student-detail-section='timeline']");
    await sleep(700);
    return;
  }
  if (action === "clickFirstViewAsStudent") {
    await clickSelector(client, "[data-view-as-student-action='enter'][data-view-as-student-id]", "first View as Student action");
    await waitForSelectorState(client, "[data-view-as-student-banner='true']");
    await sleep(700);
    return;
  }
  if (action === "clickExitViewAsStudent") {
    await clickSelector(client, "[data-view-as-student-action='exit']", "Exit student view");
    await waitForSelectorState(client, "[data-view-as-student-banner='true']", { present: false });
    await sleep(700);
    return;
  }
  if (action) throw new Error(`Unsupported proof action: ${action}`);
}

async function performPlanAction(client, planItem) {
  const actions = [
    ...(Array.isArray(planItem.actions) ? planItem.actions : []),
    ...(planItem.action ? [planItem.action] : []),
  ];
  for (const action of actions) {
    await performSinglePlanAction(client, action);
  }
}

async function collectPageState(client) {
  return client.evaluate(`(() => {
    const text = document.body ? document.body.innerText : "";
    const visiblePasswordValues = Array.from(document.querySelectorAll("input[type='password']"))
      .map((input) => input.value || "")
      .filter(Boolean);
    const activeNav = Array.from(document.querySelectorAll("[aria-current='page'], .active, .is-active"))
      .map((node) => node.textContent.trim())
      .filter(Boolean)
      .slice(0, 10);
    const rail = document.querySelector("#workspaceNavigationRail");
    const toggle = document.querySelector("#workspaceMenuToggle");
    return {
      title: document.title,
      url: location.href,
      text,
      textSample: text.replace(/\\s+/g, " ").trim().slice(0, 700),
      visiblePasswordValueCount: visiblePasswordValues.length,
      heading: (document.querySelector("h1, h2") || {}).textContent || "",
      activeNav,
      layout: {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body ? document.body.scrollWidth : 0,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1
      },
      drawer: {
        togglePresent: Boolean(toggle),
        railPresent: Boolean(rail),
        hidden: rail ? rail.hidden : null,
        expanded: toggle ? toggle.getAttribute("aria-expanded") : null
      },
      markers: {
        studentDetailPanel: Boolean(document.querySelector("[data-student-detail-panel='true']")),
        viewAsBanner: Boolean(document.querySelector("[data-view-as-student-banner='true']")),
        peopleManagement: Boolean(document.querySelector("[data-people-management='true'], [data-admin-operations-section='people']")),
        csvImportStepper: Boolean(document.querySelector("[data-csv-import-stepper]")),
        adminSetupList: Boolean(document.querySelector("[data-admin-console-setup-list='true']")),
        adminSetupReadiness: Boolean(document.querySelector("[data-admin-setup-readiness='true']")),
        adminQuickActions: Boolean(document.querySelector("[data-admin-console-quick-actions='true']")),
        adminStudents: Boolean(document.querySelector("[data-admin-operations-section='students']")),
        adminAssignments: Boolean(document.querySelector("[data-admin-operations-section='assignments']")),
        adminImports: Boolean(document.querySelector("[data-admin-operations-section='imports']")),
        adminPrograms: Boolean(document.querySelector("[data-admin-program-coverage='true']")),
        adminReports: Boolean(document.querySelector("[data-admin-report-summary='true']")),
        adminAudit: Boolean(document.querySelector("[data-admin-audit-overview='true']")),
        readOnlyBoundary: Boolean(document.querySelector("[data-read-only-boundary-list]")),
        staffAttentionModel: Boolean(document.querySelector("[data-staff-attention-model='true']")),
        staffAttentionQueue: Boolean(document.querySelector("[data-staff-attention-queue]")),
        studentDetailEvidence: Boolean(document.querySelector("[data-student-detail-section='evidence']")),
        staffReports: Boolean(document.querySelector("[data-staff-reports='true']")),
        reportBars: Boolean(document.querySelector("[data-report-bars='true']")),
        staffReportBars: Boolean(document.querySelector("[data-staff-report-bars='true']")),
        reportExportPanel: Boolean(document.querySelector("[data-report-export-panel]")),
        studentDirectory: Boolean(document.querySelector("[data-student-directory-start-here='true']")),
        studentWork: Boolean(document.querySelector("[data-student-work-section]")),
        problemState: Boolean(document.querySelector("[data-workspace-state='permission-denied'], .workspace-problem-state")),
        intentionalEmptyState: Boolean(document.querySelector("[data-intentional-empty-state], [data-student-directory-empty='true']")),
        finalFiles: Boolean(document.querySelector("[data-archive-dashboard], .workspace-archive-dashboard, [data-student-final-checklist='true']"))
      }
    };
  })()`);
}

function checkPage(planItem, pageState) {
  const text = `${pageState.heading || ""}\n${pageState.text || ""}`;
  const missingExpectedText = planItem.expected.filter((marker) => !text.includes(marker));
  const unexpectedText = (planItem.absent || []).filter((marker) => text.includes(marker));
  const secretMatches = SECRET_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  const requestedActions = [
    ...(Array.isArray(planItem.actions) ? planItem.actions : []),
    ...(planItem.action ? [planItem.action] : []),
  ];
  const drawerOpenWhenRequested = requestedActions.includes("openDrawer")
    ? pageState.drawer.railPresent && pageState.drawer.hidden === false && pageState.drawer.expanded === "true"
    : true;
  return {
    expectedTextPresent: missingExpectedText.length === 0,
    missingExpectedText,
    noUnexpectedText: unexpectedText.length === 0,
    unexpectedText,
    noVisiblePasswordValues: pageState.visiblePasswordValueCount === 0,
    noSecretLikeText: secretMatches.length === 0,
    secretPatternMatches: secretMatches,
    noHorizontalOverflow: pageState.layout.horizontalOverflow === false,
    drawerOpenWhenRequested,
  };
}

async function captureScreenshot(client, outputPath) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await fs.writeFile(outputPath, Buffer.from(result.data, "base64"));
}

async function writeManifest(result) {
  await fs.mkdir(path.dirname(absoluteRepoPath(MANIFEST_PATH)), { recursive: true });
  await fs.writeFile(absoluteRepoPath(MANIFEST_PATH), `${JSON.stringify(result, null, 2)}\n`);
}

function passedChecks(checks) {
  return checks.expectedTextPresent
    && checks.noUnexpectedText
    && checks.noVisiblePasswordValues
    && checks.noSecretLikeText
    && checks.noHorizontalOverflow
    && checks.drawerOpenWhenRequested;
}

function tailLines(chunks) {
  return chunks.join("").split(/\r?\n/).filter(Boolean).slice(-25);
}

async function run() {
  const startedAt = new Date().toISOString();
  const accountsByRole = await readAccounts();
  const edgePath = findEdgePath();
  const screenshotsAbsoluteDir = absoluteRepoPath(SCREENSHOT_DIR);
  await fs.mkdir(screenshotsAbsoluteDir, { recursive: true });

  const result = {
    proof: "workspace_ui_polish_local_browser",
    verdict: "PENDING",
    baseUrl: null,
    workspaceEntryPath: WORKSPACE_ENTRY_PATH,
    startedAt,
    completedAt: null,
    browser: {
      executable: edgePath,
      devtoolsProtocol: null,
    },
    server: null,
    screenshotDir: SCREENSHOT_DIR.replaceAll("\\", "/"),
    manifestPath: MANIFEST_PATH.replaceAll("\\", "/"),
    fakeDataOnly: true,
    realStudentProductionStatus: "NOT_CLAIMED_READY",
    claimBoundary: "Local fake-account browser UI proof only. Does not prove real-student pilot readiness.",
    screenshots: [],
    failures: [],
  };

  const localApp = await startLocalAppIfNeeded(result);
  result.baseUrl = localApp.baseUrl;

  const cdpPort = await getFreePort();
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "senior-capstone-ui-polish-browser-"));
  const edgeStderr = [];
  const edge = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-background-networking",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], {
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
  });
  edge.stderr.on("data", (chunk) => edgeStderr.push(chunk.toString()));

  let client;
  try {
    const version = await waitForDevtools(cdpPort);
    result.browser.devtoolsProtocol = version["Protocol-Version"] || null;
    const webSocketUrl = await getPageWebSocketUrl(cdpPort);
    client = await connectToCdp(webSocketUrl);
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Network.enable");

    for (const planItem of SCREENSHOT_PLAN) {
      await setViewport(client, planItem.viewport);
      await navigate(client, `${localApp.baseUrl}${WORKSPACE_ENTRY_PATH}`);
      await logout(client);
      const loginResult = await login(client, accountsByRole.get(normalizeAccountRole(planItem.authRole)));
      await navigate(client, `${localApp.baseUrl}${planItem.url}`);
      await performPlanAction(client, planItem);
      const pageState = await collectPageState(client);
      const checks = checkPage(planItem, pageState);
      const relativePath = path.join(SCREENSHOT_DIR, `${planItem.id}.png`).replaceAll("\\", "/");
      await captureScreenshot(client, absoluteRepoPath(relativePath));
      const passed = passedChecks(checks);
      if (!passed) {
        result.failures.push({
          id: planItem.id,
          role: planItem.authRole,
          checks,
        });
      }
      result.screenshots.push({
        id: planItem.id,
        label: planItem.label,
        persona: planItem.persona,
        role: planItem.authRole,
        accountType: planItem.accountType,
        viewport: planItem.viewport,
        route: planItem.url,
        screenshot: relativePath,
        expected: planItem.expected,
        proves: planItem.proves,
        caveat: "Fake/demo account UI screenshot only; not real-student production pilot proof.",
        login: loginResult,
        checks,
        markers: pageState.markers,
        heading: String(pageState.heading || "").trim(),
        textSample: pageState.textSample,
        activeNav: pageState.activeNav,
      });
      console.log(`${passed ? "PASS" : "FAIL"} ${planItem.id} ${planItem.label} -> ${relativePath}`);
    }

    result.completedAt = new Date().toISOString();
    result.verdict = result.failures.length ? "NOT_GREEN" : "GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF";
    await writeManifest(result);
    if (result.failures.length) {
      throw new Error(`Workspace UI polish proof failed for ${result.failures.length} screenshot(s).`);
    }
  } catch (error) {
    result.completedAt = new Date().toISOString();
    result.verdict = "NOT_GREEN";
    result.error = error.message;
    result.edgeStderrTail = tailLines(edgeStderr);
    result.appStdoutTail = tailLines(localApp.stdout || []);
    result.appStderrTail = tailLines(localApp.stderr || []);
    await writeManifest(result).catch(() => {});
    throw error;
  } finally {
    if (client) client.socket.close();
    if (!edge.killed) edge.kill();
    if (localApp.app && !localApp.app.killed) localApp.app.kill();
    await fs.rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
