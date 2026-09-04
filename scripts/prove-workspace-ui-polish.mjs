import { spawn, spawnSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = process.cwd();
const BASE_URL_FROM_ENV = (process.env.WORKSPACE_UI_POLISH_BASE_URL || "").replace(/\/$/, "");
const HOSTED_PROOF = Boolean(BASE_URL_FROM_ENV);
const WORKSPACE_ENTRY_PATH = normalizeWorkspaceEntryPath(process.env.WORKSPACE_UI_POLISH_ENTRY_PATH || "/workspace");
const CREDENTIALS_PATH = process.env.WORKSPACE_UI_POLISH_CREDENTIALS_PATH
  || path.join(".secrets", "admin-console-local-browser-accounts.json");
const STUDENT_CREDENTIALS_PATH = process.env.WORKSPACE_UI_POLISH_STUDENT_CREDENTIALS_PATH
  || path.join(".secrets", "test-accounts-2026-05-18.json");
const SCREENSHOT_DIR = process.env.WORKSPACE_UI_POLISH_SCREENSHOT_DIR
  || path.join("docs", "sales", "screenshots", "2026-06-30-ui-polish");
const MANIFEST_PATH = process.env.WORKSPACE_UI_POLISH_MANIFEST_PATH
  || path.join("docs", "progress", "runs", "2026-06-30-workspace-ui-polish-browser-proof.json");
const SCREENSHOT_INDEX_PATH = process.env.WORKSPACE_UI_POLISH_INDEX_PATH
  || path.join("docs", "sales", "workspace-ui-polish-screenshot-index.md");
const EXHAUSTIVE_PROOF = /^(1|true|yes)$/i.test(String(process.env.WORKSPACE_UI_POLISH_EXHAUSTIVE || ""));
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
    expected: ["Admin Console", "Admin Overview", "What to fix first", "Setup work to review", "Open the exact setup item", "Current setup health", "Latest changes in this view"],
    absent: ["Demo proof guard", "What this role can manage or monitor", "What to do first"],
    proves: "Global Admin sees the operations-first Admin Console overview with setup issues, setup checklist, health, quick actions, and activity.",
  },
  {
    id: "02-workspace-site-admin-desktop",
    label: "Workspace desktop",
    persona: "Site Admin",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=overview"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Staff Workspace", "Daily support before setup work", "Choose one student group", "Open students"],
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
    expected: ["Staff Workspace", "Projects that need you", "Start here", "Program list and reports"],
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
    expected: ["Staff Workspace", "Your next check-in", "Help one student move one project step forward", "Show filters and other students"],
    absent: ["Admin Console", "Role context"],
    proves: "Mentor starts from assigned-student support, not broad admin tools.",
  },
  {
    id: "47-mentor-dashboard-flow",
    label: "Mentor dashboard flow",
    persona: "Mentor focused dashboard",
    authRole: "mentor",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=mentorDashboard"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Your next check-in", "ASK", "HELP", "RECORD", "Open check-in", "Show filters and other students"],
    absent: ["Choose one mentor action", "Use this map before scanning every assigned student row", "Admin Console"],
    proves: "Mentor Dashboard starts with one assigned student, one coaching question, and secondary filters collapsed.",
  },
  {
    id: "05-viewer-read-only-workspace",
    label: "Viewer read-only workspace",
    persona: "Viewer",
    authRole: "viewer",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=overview"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Staff Workspace", "Read one record, then share outside the app", "Read-only", "Open one assigned student"],
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
    expected: ["My Capstone", "Your next step", "Show progress, feedback, and checklist"],
    absent: ["Admin Console", "Staff Workspace"],
    proves: "Student Today answers the next capstone action with student-only navigation.",
  },
  {
    id: "79-student-today-chromebook",
    label: "Student Today Chromebook",
    persona: "Student Chromebook browser",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=student"),
    viewport: { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false },
    expected: ["My Capstone", "Your next step", "Show progress, feedback, and checklist"],
    absent: ["Admin Console", "Staff Workspace"],
    proves: "Student Today keeps next action, current work, and supporting details reachable in a Chromebook-size desktop browser.",
  },
  {
    id: "83-student-today-chromebook-short",
    label: "Student Today short Chromebook",
    persona: "Student short Chromebook browser",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=student"),
    viewport: { width: 1366, height: 650, deviceScaleFactor: 1, mobile: false },
    expected: ["My Capstone", "Your next step"],
    absent: ["Admin Console", "Staff Workspace"],
    proves: "Student Today keeps the next action and current work visible when Chromebook browser chrome leaves a shorter page viewport.",
  },
  {
    id: "07-student-today-phone",
    label: "Student Today phone",
    persona: "Student mobile",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=student"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["My Capstone", "Your next step"],
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
    expected: ["Viewing as:", "Nothing can be changed here", "Preview safety"],
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
    expected: ["Admin Console", "Admin Overview", "What to fix first", "Setup work to review", "Open the exact setup item"],
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
    expected: ["Site Admin plan", "Daily support before setup work", "Choose one student group", "Open students"],
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
    expected: ["Go to My Capstone", "Close", "Today", "My Project"],
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
    expected: ["Go to Staff Workspace", "Close", "Projects", "Work queue"],
    action: "openDrawer",
    proves: "Half-screen staff drawer opens without covering the workflow landing or causing overflow.",
  },
  {
    id: "13-site-admin-student-detail-click",
    label: "Student detail opened from staff list",
    persona: "Site Admin student detail",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Student", "More", "What this student needs next"],
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
    expected: ["Student", "Read-only viewer", "More", "View work"],
    action: "clickFirstStudentDetail",
    proves: "Viewer can open assigned detail context without mutation controls.",
  },
  {
    id: "15-view-as-student-entered-desktop",
    label: "View as Student entered",
    persona: "Site Admin preview entered",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account using read-only preview",
    url: workspaceUrl("?mode=workspace&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Viewing as:", "Nothing can be changed here", "Exit student view"],
    actions: ["clickFirstViewAsStudent", "scrollTop"],
    proves: "Authorized staff can enter View as Student and see the read-only preview boundary.",
  },
  {
    id: "16-view-as-student-exited-return",
    label: "View as Student exit return",
    persona: "Site Admin preview exited",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account using read-only preview",
    url: workspaceUrl("?mode=workspace&section=students&siteId=site-desert-valley-high"),
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
    expected: ["Student Roster Setup", "Review the student profile, school, program, and required mentor", "Roster setup", "Manage Students", "Add Student"],
    absent: ["Students visible", "Roster fields", "Mentor gaps", "Viewer gaps"],
    action: "scrollToPeopleScreen",
    proves: "Students opens on the current roster state and real student rows, with setup counts collapsed.",
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
    id: "76-csv-import-preview-errors",
    label: "Admin Imports preview errors",
    persona: "Site Admin Import Students preview",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminImports&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    action: "previewStudentCsvWithError",
    proves: "CSV preview names the first row to fix and keeps final import blocked until errors are cleared.",
  },
  {
    id: "78-csv-import-access-error",
    label: "Admin Imports access error",
    persona: "Site Admin Import Students access preview",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminImports&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    action: "previewStudentCsvAccessError",
    absent: ["current scope", "role and scope combination"],
    proves: "CSV preview explains unavailable school access in plain account language.",
  },
  {
    id: "20-student-admin-route-blocked",
    label: "Student admin route blocked",
    persona: "Student blocked from Admin Console",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?mode=admin&section=adminUsers"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Admin Console is not available for this account", "My Capstone"],
    proves: "Student deep link to Admin Console fails safely and keeps recovery visible.",
  },
  {
    id: "21-empty-student-search",
    label: "Empty student search",
    persona: "Site Admin empty search",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=students&siteId=site-desert-valley-high&search=zzzz-no-demo-match"),
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
    id: "82-student-final-checklist-chromebook",
    label: "Student Final Checklist Chromebook",
    persona: "Student Chromebook final checklist",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentFinalChecklist"),
    viewport: { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false },
    expected: ["Final Checklist", "What is done? What still needs work?", "Finish checks"],
    absent: ["Admin Console", "Staff Workspace"],
    proves: "Student Final Checklist keeps completion status and continue actions readable in a Chromebook-size desktop browser.",
  },
  {
    id: "86-student-final-checklist-chromebook-short",
    label: "Student Final Checklist short Chromebook",
    persona: "Student short Chromebook final checklist",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentFinalChecklist"),
    viewport: { width: 1366, height: 650, deviceScaleFactor: 1, mobile: false },
    expected: ["Final Checklist", "What is done? What still needs work?", "Finish checks"],
    absent: ["Admin Console", "Staff Workspace"],
    proves: "Student Final Checklist keeps finish checks in reach when Chromebook browser chrome leaves a shorter page viewport.",
  },
  {
    id: "87-student-presentation-chromebook",
    label: "Student Presentation Chromebook",
    persona: "Student Chromebook Presentation",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=presentation"),
    viewport: { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false },
    expected: ["Presentation plan", "Your Presentation", "Before presentation day"],
    absent: ["Admin Console", "Staff Workspace", "data-presentation-action=\"check-out\"", "data-presentation-action=\"check-in\""],
    proves: "Student Presentation keeps time, outline, and day-of guidance readable in a Chromebook-size desktop browser without staff controls.",
  },
  {
    id: "88-student-presentation-chromebook-short",
    label: "Student Presentation short Chromebook",
    persona: "Student short Chromebook Presentation",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=presentation"),
    viewport: { width: 1366, height: 650, deviceScaleFactor: 1, mobile: false },
    expected: ["Presentation plan", "Your Presentation", "Before presentation day"],
    absent: ["Admin Console", "Staff Workspace", "data-presentation-action=\"check-out\"", "data-presentation-action=\"check-in\""],
    proves: "Student Presentation keeps preparation guidance in reach when Chromebook browser chrome leaves a shorter page viewport.",
  },
  {
    id: "89-student-final-files-chromebook",
    label: "Student Final Files Chromebook",
    persona: "Student Chromebook Final Files",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=archive"),
    viewport: { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false },
    expected: ["Final Files", "Final files readiness score", "What affects your download"],
    absent: ["Admin Console", "Staff Workspace", "signed archive links", "Drive-backed archive package"],
    proves: "Student Final Files keeps readiness and download guidance readable in a Chromebook-size desktop browser without staff-only archive language.",
  },
  {
    id: "90-student-final-files-chromebook-short",
    label: "Student Final Files short Chromebook",
    persona: "Student short Chromebook Final Files",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=archive"),
    viewport: { width: 1366, height: 650, deviceScaleFactor: 1, mobile: false },
    expected: ["Final Files", "Final files readiness score", "What affects your download"],
    absent: ["Admin Console", "Staff Workspace", "signed archive links", "Drive-backed archive package"],
    proves: "Student Final Files keeps readiness and download guidance in reach when Chromebook browser chrome leaves a shorter page viewport.",
  },
  {
    id: "24-student-my-work-desktop",
    label: "Student My Work desktop",
    persona: "Student My Work",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentWork"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["My Project", "Pick one step. Do the work. Turn it in.", "Project work", "Project timeline", "Back to Today"],
    absent: ["Admin Console", "Staff Workspace", "Showing 0 of 0"],
    proves: "Student My Work shows checklist, work turned in, and proof rows as the work surface.",
  },
  {
    id: "80-student-my-work-chromebook",
    label: "Student My Work Chromebook",
    persona: "Student Chromebook My Work",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentWork"),
    viewport: { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false },
    expected: ["My Project", "Pick one step. Do the work. Turn it in.", "Project work", "Project timeline", "Back to Today"],
    absent: ["Admin Console", "Staff Workspace", "Showing 0 of 0"],
    proves: "Student My Work keeps current work, turned-in work, and files readable in a Chromebook-size desktop browser.",
  },
  {
    id: "84-student-my-work-chromebook-short",
    label: "Student My Work short Chromebook",
    persona: "Student short Chromebook My Work",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentWork"),
    viewport: { width: 1366, height: 650, deviceScaleFactor: 1, mobile: false },
    expected: ["My Project", "Pick one step. Do the work. Turn it in.", "Project work", "Project timeline"],
    absent: ["Admin Console", "Staff Workspace", "Showing 0 of 0"],
    proves: "Student My Work keeps the current item visible when Chromebook browser chrome leaves a shorter page viewport.",
  },
  {
    id: "43-student-my-work-phone",
    label: "Student My Work phone",
    persona: "Student mobile My Work",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentWork"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["My Project", "Pick one step. Do the work. Turn it in.", "Project work", "Project timeline", "Back to Today"],
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
    id: "81-student-feedback-chromebook",
    label: "Student Feedback Chromebook",
    persona: "Student Chromebook Feedback",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentFeedback"),
    viewport: { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false },
    expected: ["Feedback", "Read feedback. Fix work if asked.", "Needs changes", "New feedback", "Old feedback"],
    absent: ["Admin Console", "Staff Workspace", "Showing 0 of 0"],
    proves: "Student Feedback keeps revision, new feedback, and older feedback readable in a Chromebook-size desktop browser.",
  },
  {
    id: "85-student-feedback-chromebook-short",
    label: "Student Feedback short Chromebook",
    persona: "Student short Chromebook Feedback",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentFeedback"),
    viewport: { width: 1366, height: 650, deviceScaleFactor: 1, mobile: false },
    expected: ["Feedback", "Read feedback. Fix work if asked.", "Needs changes", "New feedback"],
    absent: ["Admin Console", "Staff Workspace", "Showing 0 of 0"],
    proves: "Student Feedback keeps action-needed notes visible when Chromebook browser chrome leaves a shorter page viewport.",
  },
  {
    id: "26-administration-workspace-today",
    label: "Reporting Admin Today",
    persona: "Reporting Admin",
    authRole: "misc_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=overview"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Staff Workspace", "LEGACY REPORTING ADMIN", "Start with the worklist", "Open students"],
    absent: ["Need setup or access work?", "Role context"],
    proves: "Reporting Admin lands on its limited worklist without inheriting School Admin privileges.",
  },
  {
    id: "27-global-admin-workspace-today",
    label: "Global Admin Today",
    persona: "Global Admin",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=overview"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Staff Workspace", "GLOBAL ADMIN PLAN", "Daily support before setup work", "Choose one student group", "Tools"],
    absent: ["Need setup or access work?", "Role context"],
    proves: "Global Admin workspace defaults to queues while keeping Admin Console access behind the secondary tools menu.",
  },
  {
    id: "28-student-detail-evidence",
    label: "Student detail Evidence tab",
    persona: "Site Admin evidence detail",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Student", "Evidence", "GOOGLE DRIVE LINKS AND REVIEW STATUS", "Project links"],
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
    expected: ["Reports", "Student Progress Reports", "Answer one report question", "STUDENTS NEEDING ATTENTION", "WORK WAITING FOR REVIEW"],
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
    expected: ["Your next check-in", "ASK", "HELP", "RECORD", "Open check-in"],
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
    expected: ["Student", "Overview", "Work", "More"],
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
    expected: ["Student", "Evidence", "GOOGLE DRIVE LINKS AND REVIEW STATUS", "Project links"],
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
    expected: ["Admin Console", "Admin Overview", "What to fix first", "Setup work to review", "Open the exact setup item", "Current setup health"],
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
    expected: ["Programs", "Programs at", "School look", "Program Teacher assignment", "Active site programs"],
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
    expected: ["Reports", "Choose one report", "Pick the report you need now", "Download roster CSV", "Roster completeness"],
    absent: ["Operational Reports", "CURRENT SCOPE", "STUDENTS SHOWN", "Showing 0 of 0", "No data", "No rows"],
    proves: "Reports starts as a report-choice flow while scope, setup, and coverage diagnostics stay behind a supporting disclosure.",
  },
  {
    id: "36-admin-audit",
    label: "Admin Audit",
    persona: "Global Admin Audit",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=audit"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Audit", "Choose one audit check", "Pick one redacted check", "Start with latest changes", "Redacted events only"],
    absent: ["Loaded redacted rows", "Rows that may need support", "Security checks that are enforced now", "Audit is for triage and proof", "Recent Protected Activity"],
    proves: "Audit starts with one redacted-check list while counts, filters, anomalies, and recent events stay behind supporting details.",
  },
  {
    id: "37-mobile-admin-overview",
    label: "Mobile Admin Overview",
    persona: "Site Admin mobile overview",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["Admin Console", "Admin Overview", "What to fix first", "Setup work to review", "Open the exact setup item"],
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
    id: "77-mobile-csv-import-preview-errors",
    label: "Mobile Admin Imports preview errors",
    persona: "Site Admin mobile import preview",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminImports&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    action: "previewStudentCsvWithError",
    proves: "Mobile CSV preview stacks the first-row repair guidance without overflow.",
  },
  {
    id: "42-mobile-admin-reports",
    label: "Mobile Admin Reports",
    persona: "Site Admin mobile reports",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminReports&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["Reports", "Pick the report you need now", "Download roster CSV", "unknown states are not counted as complete"],
    actions: ["scrollToReportExports"],
    proves: "Mobile Admin Reports opens on the scoped report picker with counted-students confidence copy and CSV download affordances.",
  },
  {
    id: "39-viewer-students-directory",
    label: "Viewer Students directory",
    persona: "Viewer Students",
    authRole: "viewer",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=students&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Students", "Find a student by picking one group", "Start Here", "Read-only rules"],
    absent: ["Admin Console", "Remove student", "Manage Site Access", "CURRENT SITE", "When you need someone to act"],
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
    expected: ["Students", "Find a student by picking one group", "Read-only rules"],
    absent: ["Admin Console", "Remove student", "Manage Site Access", "CURRENT SITE", "When you need someone to act"],
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
    expected: ["Review one project", "Open one project. Read the work. Then choose the next step.", "DO THIS NEXT", "Review this project", "See all waiting work"],
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
    expected: ["Timeline", "Showing all activity", "Recent activity"],
    actions: ["clickFirstStudentDetail", "clickStudentDetailTimelineTab"],
    proves: "Student Detail exposes the Timeline tab through the protected detail drawer with scoped activity context.",
  },
  {
    id: "23-student-detail-phone",
    label: "Student detail phone",
    persona: "Site Admin phone detail",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    expected: ["Student", "More"],
    action: "clickFirstStudentDetail",
    proves: "Scoped student detail remains usable and bounded on phone width.",
  },
  {
    id: "48-site-admin-today-phone",
    label: "Site Admin Today phone",
    persona: "Site Admin mobile Today",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=overview"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    proves: "Site Admin Today keeps the staff/admin daily-support plan readable on phone width.",
  },
  {
    id: "49-program-teacher-today-phone",
    label: "Program Teacher Today phone",
    persona: "Program Teacher mobile Today",
    authRole: "program_teacher",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=overview"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    proves: "Program Teacher Today keeps the decision plan and review-first cues readable on phone width.",
  },
  {
    id: "50-viewer-today-phone",
    label: "Viewer Today phone",
    persona: "Viewer mobile Today",
    authRole: "viewer",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=overview"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    absent: ["Admin Console", "Remove student"],
    proves: "Viewer Today keeps the read-only plan readable on phone width without edit controls.",
  },
  {
    id: "51-administration-today-phone",
    label: "Reporting Admin Today phone",
    persona: "Reporting Admin mobile Today",
    authRole: "misc_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=overview"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    proves: "Reporting Admin Today keeps the limited reporting plan readable on phone width.",
  },
  {
    id: "52-global-admin-today-phone",
    label: "Global Admin Today phone",
    persona: "Global Admin mobile Today",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=overview"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    proves: "Global Admin workspace Today keeps daily work separate from Admin Console on phone width.",
  },
  {
    id: "53-student-my-work-half-screen",
    label: "Student My Work half-screen",
    persona: "Student half-screen My Work",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentWork"),
    viewport: { width: 820, height: 900, deviceScaleFactor: 1, mobile: false },
    absent: ["Admin Console", "Staff Workspace"],
    proves: "Student My Work stays readable at half-screen width.",
  },
  {
    id: "54-student-feedback-phone",
    label: "Student Feedback phone",
    persona: "Student mobile Feedback",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentFeedback"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    absent: ["Admin Console", "Staff Workspace"],
    proves: "Student Feedback keeps action-needed teacher notes readable on phone width.",
  },
  {
    id: "55-student-final-checklist-phone",
    label: "Student Final Checklist phone",
    persona: "Student mobile Final Checklist",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentFinalChecklist"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    absent: ["Admin Console", "Staff Workspace"],
    proves: "Student Final Checklist keeps final-file readiness and blockers readable on phone width.",
  },
  {
    id: "56-program-dashboard-desktop",
    label: "Program Dashboard desktop",
    persona: "Program Teacher dashboard",
    authRole: "program_teacher",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=programDashboard"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    proves: "Program Dashboard keeps review-first program metrics and scoped student details route-backed.",
  },
  {
    id: "57-program-dashboard-phone",
    label: "Program Dashboard phone",
    persona: "Program Teacher mobile dashboard",
    authRole: "program_teacher",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=programDashboard"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    proves: "Program Dashboard keeps scoped program review cues readable on phone width.",
  },
  {
    id: "58-mentor-dashboard-phone",
    label: "Mentor Dashboard phone",
    persona: "Mentor mobile focused dashboard",
    authRole: "mentor",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=mentorDashboard"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    absent: ["Admin Console"],
    proves: "Mentor Dashboard keeps one assigned-student focus readable on phone width.",
  },
  {
    id: "59-mentor-assigned-students-desktop",
    label: "Mentor assigned students",
    persona: "Mentor assigned-student screen",
    authRole: "mentor",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=mentor"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    absent: ["Admin Console"],
    proves: "Mentor assigned-student screen stays focused on assigned students and student detail routes.",
  },
  {
    id: "60-mentor-assigned-students-phone",
    label: "Mentor assigned students phone",
    persona: "Mentor mobile assigned-student screen",
    authRole: "mentor",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=mentor"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    absent: ["Admin Console"],
    proves: "Mentor assigned-student screen remains readable on phone width.",
  },
  {
    id: "61-site-admin-students-workspace",
    label: "Site Admin Students workspace",
    persona: "Site Admin workspace Students",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    proves: "Site Admin Students opens on the real student directory and support groups outside Admin Console.",
  },
  {
    id: "62-site-admin-reviews-workspace",
    label: "Site Admin Reviews workspace",
    persona: "Site Admin workspace Reviews",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=teacher&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    proves: "Site Admin Reviews opens the role-safe Review Work queue without Program Teacher-only mutation expansion.",
  },
  {
    id: "63-site-admin-reports-phone",
    label: "Site Admin Reports phone",
    persona: "Site Admin mobile Reports",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=staffReports&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    proves: "Workspace Reports keep scoped bars and export affordances readable on phone width.",
  },
  {
    id: "64-administration-students-workspace",
    label: "Reporting Admin Readiness workspace",
    persona: "Reporting Admin workspace Readiness",
    authRole: "misc_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=readiness&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    proves: "Reporting Admin opens aggregate readiness without student-directory privileges.",
  },
  {
    id: "65-administration-reports-phone",
    label: "Reporting Admin Reports phone",
    persona: "Reporting Admin mobile Reports",
    authRole: "misc_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=staffReports&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    proves: "Reporting Admin Reports keep aggregate status bars readable on phone width.",
  },
  {
    id: "66-global-admin-students-workspace",
    label: "Global Admin Students workspace",
    persona: "Global Admin workspace Students",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=students&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    proves: "Global Admin workspace Students stays route-backed and school-filtered outside Admin Console.",
  },
  {
    id: "67-global-admin-reports-phone",
    label: "Global Admin Reports phone",
    persona: "Global Admin mobile Reports",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=staffReports&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    proves: "Global Admin workspace Reports keep scoped report bars readable on phone width.",
  },
  {
    id: "68-mobile-admin-people",
    label: "Mobile Admin People",
    persona: "Site Admin mobile People",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminPeople&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    proves: "Mobile Admin People keeps staff directory and access entry points readable.",
  },
  {
    id: "69-admin-students-half-screen",
    label: "Admin Students half-screen",
    persona: "Site Admin half-screen Students",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminStudents&siteId=site-desert-valley-high"),
    viewport: { width: 820, height: 900, deviceScaleFactor: 1, mobile: false },
    proves: "Admin Students roster setup remains readable at half-screen width.",
  },
  {
    id: "70-mobile-admin-assignments",
    label: "Mobile Admin Assignments",
    persona: "Site Admin mobile Assignments",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=adminAssignments&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    proves: "Mobile Admin Assignments keeps mentor, viewer, and Program Teacher coverage flows readable.",
  },
  {
    id: "71-mobile-admin-programs",
    label: "Mobile Admin Programs",
    persona: "Site Admin mobile Programs",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=programs&siteId=site-desert-valley-high"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    proves: "Mobile Admin Programs keeps active programs and Program Teacher coverage readable.",
  },
  {
    id: "72-mobile-admin-audit",
    label: "Mobile Admin Audit",
    persona: "Global Admin mobile Audit",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=audit"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    proves: "Mobile Admin Audit keeps redacted activity review readable for Global Admin.",
  },
  {
    id: "73-mobile-global-admin-overview",
    label: "Mobile Global Admin Overview",
    persona: "Global Admin mobile overview",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    proves: "Global Admin mobile overview keeps setup-first Admin Console work readable.",
  },
  {
    id: "74-viewer-reports-desktop",
    label: "Viewer Reports desktop",
    persona: "Viewer Reports",
    authRole: "viewer",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=staffReports"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    absent: ["Admin Console", "data-admin-action"],
    proves: "Viewer Reports remain read-only and scoped to report-safe fields.",
  },
  {
    id: "75-student-today-half-screen",
    label: "Student Today half-screen",
    persona: "Student half-screen Today",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=student"),
    viewport: { width: 820, height: 900, deviceScaleFactor: 1, mobile: false },
    absent: ["Admin Console", "Staff Workspace"],
    proves: "Student Today keeps the next-step map readable at half-screen width.",
  },
  {
    id: "101-site-admin-tools-phone",
    label: "Site Admin Tools on narrow phone",
    persona: "Site Admin using Tools on a narrow phone",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=projects&siteId=site-desert-valley-high"),
    viewport: { width: 320, height: 720, deviceScaleFactor: 2, mobile: true },
    expected: ["Tools", "Find a student", "Open students", "Workspace", "Admin Console"],
    action: "openTools",
    proves: "Site Admin Tools opens below the measured phone header with a stacked student search and balanced mode choices.",
  },
  {
    id: "102-site-admin-console-tools-phone",
    label: "Site Admin Console Tools on narrow phone",
    persona: "Site Admin using Admin Console Tools on a narrow phone",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview&siteId=site-desert-valley-high"),
    viewport: { width: 320, height: 720, deviceScaleFactor: 2, mobile: true },
    expected: ["Tools", "Find a student", "Open students", "Workspace", "Admin Console"],
    action: "openTools",
    proves: "The Site Admin Console Tools menu stays inside a narrow phone viewport without covering its trigger row.",
  },
  {
    id: "103-program-teacher-tools-phone",
    label: "Program Teacher Tools on narrow phone",
    persona: "Program Teacher using Tools on a narrow phone",
    authRole: "program_teacher",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=teacher&siteId=site-desert-valley-high"),
    viewport: { width: 320, height: 720, deviceScaleFactor: 2, mobile: true },
    expected: ["Tools", "Find a student", "Open students"],
    action: "openTools",
    proves: "Program Teacher search tools stay readable and reachable at the narrow supported phone width.",
  },
  {
    id: "104-mentor-phone-without-empty-tools",
    label: "Mentor phone without empty Tools",
    persona: "Mentor using a narrow phone",
    authRole: "mentor",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=mentorDashboard&siteId=site-desert-valley-high"),
    viewport: { width: 320, height: 720, deviceScaleFactor: 2, mobile: true },
    expected: ["Mentor", "Your next check-in"],
    absent: ["Tools", "Admin Console"],
    proves: "Mentors do not see a dead-end Tools button when no switcher or search action is available.",
  },
  {
    id: "105-student-phone-without-empty-tools",
    label: "Student phone without empty Tools",
    persona: "Student using a narrow phone",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentWork"),
    viewport: { width: 320, height: 720, deviceScaleFactor: 2, mobile: true },
    expected: ["My Project", "Project timeline"],
    absent: ["Tools", "Admin Console", "Staff Workspace"],
    proves: "Students do not see a dead-end Tools button when their account has no top-bar tools.",
  },
  {
    id: "106-site-admin-account-phone",
    label: "Site Admin account menu on narrow phone",
    persona: "Site Admin using the account menu on a narrow phone",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=overview&siteId=site-desert-valley-high"),
    viewport: { width: 320, height: 720, deviceScaleFactor: 2, mobile: true },
    expected: ["Dark view", "Refresh", "Sign out"],
    action: "openAccountMenu",
    proves: "The compact phone account button opens full-width account actions below the measured header.",
  },
  {
    id: "107-global-admin-tools-half-screen",
    label: "Global Admin Tools at half-screen width",
    persona: "Global Admin using Tools at half-screen width",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview&siteId=site-desert-valley-high"),
    viewport: { width: 820, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Tools", "Find a student", "Open students", "Workspace", "Admin Console"],
    action: "openTools",
    proves: "Global Admin Tools uses one clear column and balanced mode buttons at half-screen width.",
  },
];

const DARK_THEME_ROLE_PLAN = [
  {
    id: "91-dark-student-phone",
    label: "Student dark view on phone",
    persona: "Student using dark view on a phone",
    authRole: "student",
    accountType: "Fake .test demo student account",
    url: workspaceUrl("?section=studentWork"),
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    theme: "dark",
    proves: "Student work keeps its next action, readable type, and keyboard path in dark view on a phone.",
  },
  {
    id: "92-dark-program-teacher-desktop",
    label: "Program Teacher dark view",
    persona: "Program Teacher using dark view",
    authRole: "program_teacher",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=teacher&siteId=site-desert-valley-high"),
    viewport: { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false },
    theme: "dark",
    proves: "Teacher review keeps one clear action and a predictable keyboard path in dark view.",
  },
  {
    id: "93-dark-mentor-tablet",
    label: "Mentor dark view on tablet",
    persona: "Mentor using dark view at tablet width",
    authRole: "mentor",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=mentorDashboard&siteId=site-desert-valley-high"),
    viewport: { width: 820, height: 900, deviceScaleFactor: 1, mobile: false },
    theme: "dark",
    proves: "Mentor support remains readable and keyboard reachable in dark view at tablet width.",
  },
  {
    id: "94-dark-viewer-desktop",
    label: "Viewer dark view",
    persona: "Read-only viewer using dark view",
    authRole: "viewer",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?section=staffReports&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    theme: "dark",
    proves: "Viewer reports remain clearly read-only and keyboard reachable in dark view.",
  },
  {
    id: "95-dark-site-admin-tablet",
    label: "Site Admin dark view on tablet",
    persona: "Site Admin using dark view at tablet width",
    authRole: "site_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=projects&siteId=site-desert-valley-high"),
    viewport: { width: 820, height: 900, deviceScaleFactor: 1, mobile: false },
    theme: "dark",
    expected: ["PROJECT COMMAND CENTER", "Back to project list", "START HERE", "YOUR NEXT MOVE", "PROJECT PATH", "PROJECT TEAM", "MENTOR", "PROGRAM TEACHER"],
    absent: ["Choose one project. The list will close", "Project or student name", "School projects"],
    action: "proveProjectOpenAndBack",
    proves: "A project replaces the directory, Back restores the directory, and reopening the project stays readable in dark view at tablet width.",
  },
  {
    id: "96-dark-administration-desktop",
    label: "Reporting Admin dark view",
    persona: "Reporting Admin using dark view",
    authRole: "misc_admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=workspace&section=readiness&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    theme: "dark",
    proves: "Reporting Admin keeps aggregate readiness readable and keyboard reachable in dark view.",
  },
  {
    id: "97-dark-global-admin-east-tech",
    label: "Global Admin East Tech dark view",
    persona: "Global Admin checking East Tech school branding in dark view",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview&siteId=site-east-career-technical-academy"),
    viewport: { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false },
    theme: "dark",
    expectedSchoolTheme: "east-tech",
    expectedHeadingFont: "Barlow Semi Condensed",
    proves: "East Tech identity colors and type remain distinct and readable in the Global Admin dark view.",
  },
  {
    id: "98-light-global-admin-desert-valley",
    label: "Global Admin Desert Valley light view",
    persona: "Global Admin checking Desert Valley school branding in light view",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    theme: "light",
    expectedSchoolTheme: "desert-valley",
    proves: "Desert Valley identity colors and type remain distinct and readable in the Global Admin light view.",
  },
  {
    id: "99-light-global-admin-canyon-ridge",
    label: "Global Admin East Tech light view",
    persona: "Global Admin checking East Tech school branding in light view",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview&siteId=site-east-career-technical-academy"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    theme: "light",
    expectedSchoolTheme: "east-tech",
    proves: "East Tech identity colors and type remain distinct and readable in the Global Admin light view.",
  },
  {
    id: "100-dark-global-admin-north-valley",
    label: "Global Admin Desert Valley dark view",
    persona: "Global Admin checking Desert Valley school branding in dark view",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    theme: "dark",
    expectedSchoolTheme: "desert-valley",
    proves: "Desert Valley identity colors and type remain distinct and readable in the Global Admin dark view.",
  },
];

SCREENSHOT_PLAN.push(...DARK_THEME_ROLE_PLAN);
const ADMIN_ROLE_MODE_PLAN = [
  {
    id: "admin-role-global-switcher-desktop",
    label: "Global Admin working mode selector",
    persona: "Global Admin choosing an access view",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview&siteId=site-desert-valley-high"),
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Global Admin", "Site Admin", "Work as", "All schools", "Changing this view never changes your account assignment"],
    action: "openAdminRoleSwitcher",
    proves: "The header keeps a readable, explicit choice between global and selected-school access views visible without opening a menu.",
  },
  {
    id: "admin-role-site-mode-half-screen",
    label: "Global Admin using Site Admin mode",
    persona: "Global Admin working as Site Admin at half-screen width",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview&siteId=site-desert-valley-high"),
    viewport: { width: 820, height: 900, deviceScaleFactor: 1, mobile: false },
    expected: ["Global Admin", "Site Admin", "Work as", "Desert Valley High School", "The server still checks every action"],
    actions: ["switchToSiteAdmin", "openAdminRoleSwitcher"],
    auditKeyboard: false,
    proves: "Site Admin mode stays readable at half-screen width and removes global-only navigation while keeping the selected school visible.",
  },
  {
    id: "admin-role-global-switcher-phone",
    label: "Global Admin working mode selector on phone",
    persona: "Global Admin choosing an access view on a narrow phone",
    authRole: "admin",
    accountType: "Fake .test demo staff account",
    url: workspaceUrl("?mode=admin&section=overview&siteId=site-desert-valley-high"),
    viewport: { width: 320, height: 720, deviceScaleFactor: 2, mobile: true },
    expected: ["Global Admin", "Site Admin", "Work as", "All schools"],
    action: "openAdminRoleSwitcher",
    auditKeyboard: false,
    proves: "The Global Admin and Site Admin choices remain fully visible, readable, and touch-sized on a narrow phone.",
  },
];
if (String(process.env.WORKSPACE_UI_POLISH_IDS || "").includes("admin-role-")) {
  SCREENSHOT_PLAN.push(...ADMIN_ROLE_MODE_PLAN);
}
const PROJECT_STICKY_ROLE_PLAN = [
  ["program-teacher", "program_teacher", "Program Teacher"],
  ["mentor", "mentor", "Mentor"],
  ["viewer", "viewer", "Viewer"],
  ["administration", "administration", "School Admin"],
  ["site-admin", "site_admin", "Site Admin"],
  ["global-admin", "admin", "Global Admin"],
].map(([idSuffix, authRole, persona]) => ({
  id: `project-sticky-${idSuffix}-desktop`,
  label: `${persona} project sticky rail`,
  persona: `${persona} reviewing a long project at desktop width`,
  authRole,
  accountType: "Fake .test demo staff account",
  url: workspaceUrl("?mode=workspace&section=projects&siteId=site-desert-valley-high"),
  viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
  theme: "light",
  expected: ["PROJECT COMMAND CENTER", "Back to project list", "START HERE", "YOUR NEXT MOVE", "PROJECT PATH", "PROJECT TEAM"],
  absent: ["Choose one project. The list will close", "Project or student name", "School projects"],
  actions: ["proveProjectOpenAndBack", "proveProjectStickyRail"],
  auditKeyboard: false,
  capture: authRole === "site_admin",
  proves: `The shared project overview keeps its right rail, top bar, and left navigation fixed for the ${persona} role while left-side information scrolls.`,
}));
if (String(process.env.WORKSPACE_UI_POLISH_IDS || "").includes("project-sticky-")) {
  SCREENSHOT_PLAN.push(...PROJECT_STICKY_ROLE_PLAN);
}
const EXHAUSTIVE_ROLE_SURFACES = {
  student: {
    workspace: ["profile", "student", "studentWork", "studentFeedback", "studentFinalChecklist", "presentation", "archive", "security"],
  },
  mentor: {
    workspace: ["profile", "overview", "projects", "mentor", "teacher", "mentorDashboard", "presentation", "staffReports", "security"],
  },
  viewer: {
    workspace: ["profile", "overview", "projects", "students", "staffReports", "security"],
  },
  program_teacher: {
    workspace: ["profile", "overview", "projects", "students", "teacher", "programDashboard", "operations", "presentation", "staffReports", "security"],
    admin: ["overview", "adminAssignments", "students", "teacher", "mentorAssignments", "operations"],
  },
  administration: {
    workspace: ["profile", "overview", "projects", "students", "siteDashboard", "operations", "mentorAssignments", "presentation", "readiness", "staffReports", "security"],
    admin: ["overview", "adminPeople", "adminStudents", "adminAssignments", "adminImports", "adminUsers", "students", "mentorAssignments", "operations", "presentation", "readiness", "adminReports", "siteDashboard"],
  },
  site_admin: {
    workspace: ["profile", "overview", "projects", "students", "teacher", "siteDashboard", "operations", "mentorAssignments", "presentation", "readiness", "staffReports", "security"],
    admin: ["overview", "adminPeople", "adminStudents", "adminAssignments", "programs", "adminImports", "adminUsers", "students", "teacher", "mentorAssignments", "operations", "presentation", "readiness", "adminReports", "siteDashboard"],
  },
  admin: {
    workspace: ["profile", "overview", "projects", "students", "teacher", "siteDashboard", "operations", "mentorAssignments", "presentation", "readiness", "adminDashboard", "staffReports", "security"],
    admin: ["overview", "adminPeople", "adminStudents", "adminAssignments", "programs", "adminImports", "adminUsers", "students", "teacher", "mentorAssignments", "operations", "presentation", "readiness", "adminReports", "adminDashboard", "siteDashboard", "archiveExports", "audit", "security"],
  },
};
const EXHAUSTIVE_RESPONSIVE_PROFILES = [
  ["chromebook-light", { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false }, "light", false],
  ["chromebook-dark", { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false }, "dark", false],
  ["short-light", { width: 1366, height: 650, deviceScaleFactor: 1, mobile: false }, "light", true],
  ["short-dark", { width: 1366, height: 650, deviceScaleFactor: 1, mobile: false }, "dark", false],
  ["tablet-light", { width: 820, height: 900, deviceScaleFactor: 1, mobile: false }, "light", false],
  ["tablet-dark", { width: 820, height: 900, deviceScaleFactor: 1, mobile: false }, "dark", false],
  ["narrow-phone-light", { width: 360, height: 800, deviceScaleFactor: 2, mobile: true }, "light", false],
  ["narrow-phone-dark", { width: 360, height: 800, deviceScaleFactor: 2, mobile: true }, "dark", false],
  ["phone-light", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, "light", false],
  ["phone-dark", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, "dark", true],
];

function exhaustiveWorkspaceUrl(mode, section) {
  const params = new URLSearchParams({ mode, section });
  if (section !== "student" && section !== "studentWork" && section !== "studentFeedback" && section !== "studentFinalChecklist") {
    params.set("siteId", "site-desert-valley-high");
  }
  return workspaceUrl(`?${params.toString()}`);
}

function exhaustivePlanItem({ id, role, mode, section, viewport, theme, capture = false, action = "" }) {
  return {
    id,
    label: `${role} ${mode} ${section} ${theme}`,
    persona: `${role} exhaustive visual audit`,
    authRole: role,
    accountType: "Fake .test local visual-audit account",
    url: exhaustiveWorkspaceUrl(mode, section),
    viewport,
    theme,
    capture,
    auditKeyboard: false,
    ...(action ? { action } : {}),
    proves: `${role} ${mode} / ${section} passed current-theme, readability, contrast, overflow, topbar, and target-size checks at ${viewport.width}x${viewport.height}${action ? " with every disclosure expanded" : ""}.`,
  };
}

function buildExhaustivePlan() {
  const plan = [];
  const representativeBySection = new Map();
  const expandedScreenshotSections = new Set();
  for (const [role, modes] of Object.entries(EXHAUSTIVE_ROLE_SURFACES)) {
    for (const [mode, sections] of Object.entries(modes)) {
      for (const section of sections) {
        if (!representativeBySection.has(section)) representativeBySection.set(section, { role, mode, section });
        plan.push(exhaustivePlanItem({
          id: `x-role-${role}-${mode}-${section}-desktop-light`,
          role,
          mode,
          section,
          viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
          theme: "light",
          capture: true,
        }));
        const captureExpanded = !expandedScreenshotSections.has(section);
        if (captureExpanded) expandedScreenshotSections.add(section);
        plan.push(exhaustivePlanItem({
          id: `x-role-${role}-${mode}-${section}-desktop-dark-expanded`,
          role,
          mode,
          section,
          viewport: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
          theme: "dark",
          capture: captureExpanded,
          action: "openAllDisclosures",
        }));
      }
    }
  }
  for (const [section, surface] of representativeBySection) {
    for (const [profile, viewport, theme, capture] of EXHAUSTIVE_RESPONSIVE_PROFILES) {
      plan.push(exhaustivePlanItem({
        id: `x-responsive-${section}-${profile}`,
        ...surface,
        viewport,
        theme,
        capture,
      }));
    }
  }
  return plan;
}

const EXHAUSTIVE_PLAN = EXHAUSTIVE_PROOF ? buildExhaustivePlan() : [];
SCREENSHOT_PLAN.push(...EXHAUSTIVE_PLAN);
const SCREENSHOT_ID_FILTER = new Set(
  String(process.env.WORKSPACE_UI_POLISH_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const RUN_PLAN = SCREENSHOT_ID_FILTER.size
  ? SCREENSHOT_PLAN.filter((item) => SCREENSHOT_ID_FILTER.has(item.id))
  : SCREENSHOT_PLAN;
if (!RUN_PLAN.length) throw new Error("WORKSPACE_UI_POLISH_IDS did not match any screenshot plan ids.");

function normalizeWorkspaceEntryPath(value) {
  const trimmed = String(value || "").trim() || "/workspace";
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
  return normalized;
}

async function readAccounts() {
  const credentialPaths = [...new Set([CREDENTIALS_PATH, STUDENT_CREDENTIALS_PATH].filter(Boolean))];
  const byRole = new Map();
  for (const [pathIndex, credentialPath] of credentialPaths.entries()) {
    const absolutePath = absoluteRepoPath(credentialPath);
    if (!existsSync(absolutePath)) continue;
    const parsed = JSON.parse(await fs.readFile(absolutePath, "utf8"));
    for (const account of credentialAccounts(parsed)) {
      const role = normalizeAccountRole(account.role || account.key || account.roleId);
      const isStudentOverride = pathIndex > 0 && role === "student";
      if (!role || (byRole.has(role) && !isStudentOverride)) continue;
      const email = account.email || account.username;
      const password = account.password || account.workingPassword;
      if (email && password) byRole.set(role, {
        email,
        password,
        mfaSecret: String(account.mfaSecret || "").trim(),
      });
    }
  }
  const requiredRoles = [...new Set(RUN_PLAN.map((item) => normalizeAccountRole(item.authRole)).filter(Boolean))];
  const missing = requiredRoles.filter((role) => !byRole.has(role));
  if (missing.length) {
    throw new Error(`Missing local fake-account credentials for roles: ${missing.join(", ")}`);
  }
  return byRole;
}

function credentialAccounts(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.accounts)) return parsed.accounts;
  return [
    ...(parsed?.adminLogins || []),
    ...(parsed?.personaLogins || []),
    ...(parsed?.programTeacherLogins || []),
    ...(parsed?.mentorLogins || []),
    ...(parsed?.sampleStudentLogins || []),
  ];
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

function spawnLocalPagesProcess(port, stdout, stderr) {
  const app = spawn(process.execPath, [
    WRANGLER_JS,
    "pages",
    "dev",
    ".deploy-app",
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
  return app;
}

async function stopLocalPagesProcess(app) {
  if (!app || app.exitCode !== null || app.killed) return;
  await new Promise((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      resolve();
    };
    app.once("exit", finish);
    app.kill();
    setTimeout(finish, 5_000).unref();
  });
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
  const build = spawnSync(process.execPath, [path.join(ROOT, "scripts", "build-app-deploy.mjs")], {
    cwd: ROOT,
    env: { ...process.env, NO_COLOR: "1" },
    encoding: "utf8",
    windowsHide: true,
  });
  if (build.status !== 0) {
    throw new Error(`Production app build failed before browser proof: ${build.stderr || build.stdout || "unknown error"}`);
  }
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const stdout = [];
  const stderr = [];
  const localApp = { baseUrl, app: null, stdout, stderr, restarts: 0, restart: null };
  const launch = async () => {
    localApp.app = spawnLocalPagesProcess(port, stdout, stderr);
    await waitForHttpOk(`${baseUrl}${WORKSPACE_ENTRY_PATH}`);
  };
  localApp.restart = async () => {
    await stopLocalPagesProcess(localApp.app);
    await launch();
    localApp.restarts += 1;
    if (result.server) result.server.restarts = localApp.restarts;
  };
  await launch();
  await waitForHttpOk(`${baseUrl}${WORKSPACE_ENTRY_PATH}`);
  result.server = {
    startedByScript: true,
    baseUrl,
    command: "node node_modules/wrangler/bin/wrangler.js pages dev .deploy-app --compatibility-date=2026-05-18",
    build: "node scripts/build-app-deploy.mjs",
    restarts: 0,
  };
  return localApp;
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
    this.diagnostics = [];
    socket.addEventListener("message", (event) => this.handleMessage(event));
    socket.addEventListener("close", () => {
      for (const { reject } of this.pending.values()) reject(new Error("CDP socket closed"));
      this.pending.clear();
    });
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (["Runtime.exceptionThrown", "Runtime.consoleAPICalled", "Log.entryAdded"].includes(message.method)) {
      this.diagnostics.push({ method: message.method, params: message.params || {} });
      if (this.diagnostics.length > 40) this.diagnostics.shift();
    }
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

async function navigate(client, targetUrl, { recover = null } = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const loaded = client.waitForEvent("Page.loadEventFired", 25_000).catch(() => null);
    await client.send("Page.navigate", { url: targetUrl });
    await loaded;
    try {
      await waitForStableWorkspace(client);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        if (typeof recover === "function") await recover();
        await sleep(750);
      }
    }
  }
  throw lastError || new Error(`Unable to settle workspace navigation: ${targetUrl}`);
}

async function waitForStableWorkspace(client) {
  const deadline = Date.now() + 40_000;
  let lastState = null;
  let stablePasses = 0;
  while (Date.now() < deadline) {
    const state = await client.evaluate(`(() => ({
      readyState: document.readyState,
      bodyText: document.body ? document.body.innerText.slice(0, 1200) : "",
      workspaceRoot: Boolean(document.querySelector(".workspace-app, .workspace-auth")),
      loading: Boolean(document.querySelector("#workspaceLoading"))
        || document.querySelector(".workspace-app")?.getAttribute("aria-busy") === "true"
        || [
          "Loading student detail...",
          "Loading this student's latest work and feedback",
          "Loading student timeline...",
          "Loading this student's activity.",
        ].some((message) => (document.body?.innerText || "").includes(message))
        || Array.from(document.querySelectorAll(".workspace-status")).some((node) => {
          const text = String(node.textContent || "").trim();
          return ["Loading your workspace...", "Updating this page...", "Trying the server again..."].includes(text);
        })
    }))()`);
    lastState = state;
    const loading = state.loading === true;
    if (state.readyState === "complete" && state.workspaceRoot && !loading) {
      stablePasses += 1;
      if (stablePasses >= 3) return;
    } else {
      stablePasses = 0;
    }
    await sleep(350);
  }
  throw new Error(`Timed out waiting for workspace UI to settle: ${JSON.stringify(lastState)}`);
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
      return {
        status: response.status,
        ok: body && body.ok === true,
        error: body && body.error ? body.error : null,
        challengeToken: body && body.challengeToken ? body.challengeToken : null,
        mfaSecret: body && body.mfa && body.mfa.secret ? body.mfa.secret : null
      };
    })()`,
    { awaitPromise: true },
  );
  if (result?.status === 200 && result?.ok === true) {
    return { status: result.status, ok: result.ok };
  }
  if (result?.status === 202 && ["mfa_enrollment_required", "mfa_required"].includes(result?.error)) {
    const secret = result.error === "mfa_enrollment_required"
      ? String(result.mfaSecret || "").trim()
      : String(account.mfaSecret || "").trim();
    if (!result.challengeToken || !secret) {
      throw new Error("Login needs the fake account's saved extra sign-in setup.");
    }
    let verification = await verifyMfaLogin(client, result.challengeToken, currentTotpCode(secret));
    if (verification?.error === "invalid_mfa_code") {
      await sleep(30_000 - (Date.now() % 30_000) + 750);
      verification = await verifyMfaLogin(client, result.challengeToken, currentTotpCode(secret));
    }
    if (verification?.status !== 200 || verification?.ok !== true) {
      throw new Error(`Extra sign-in failed with HTTP ${verification?.status || "unknown"}${verification?.error ? ` (${verification.error})` : ""}`);
    }
    account.mfaSecret = secret;
    return { status: verification.status, ok: verification.ok };
  }
  if (result?.status !== 200 || result?.ok !== true) {
    throw new Error(`Login failed with HTTP ${result?.status || "unknown"}${result?.error ? ` (${result.error})` : ""}`);
  }
  return { status: result.status, ok: result.ok };
}

async function verifyMfaLogin(client, challengeToken, code) {
  return client.evaluate(
    `(async () => {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ challengeToken: ${JSON.stringify(challengeToken)}, code: ${JSON.stringify(code)} })
      });
      const body = await response.json().catch(() => ({}));
      return { status: response.status, ok: body && body.ok === true, error: body && body.error ? body.error : null };
    })()`,
    { awaitPromise: true },
  );
}

function decodeBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let buffer = 0;
  const bytes = [];
  for (const character of String(value || "").toUpperCase().replace(/=+$/g, "")) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("The fake account's saved extra sign-in setup is invalid.");
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function currentTotpCode(secret) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value = ((digest[offset] & 0x7f) << 24)
    | ((digest[offset + 1] & 0xff) << 16)
    | ((digest[offset + 2] & 0xff) << 8)
    | (digest[offset + 3] & 0xff);
  return String(value % 1_000_000).padStart(6, "0");
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

async function applyProofTheme(client, theme = "light") {
  const requestedTheme = theme === "dark" ? "dark" : "light";
  await client.evaluate(`(() => {
    localStorage.setItem("senior-project-view", ${JSON.stringify(requestedTheme)});
    document.documentElement.dataset.theme = ${JSON.stringify(requestedTheme)};
    return document.documentElement.dataset.theme;
  })()`);
}

async function pressTab(client, { reverse = false } = {}) {
  const modifiers = reverse ? 8 : 0;
  await client.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
    modifiers,
  });
  await client.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
    modifiers,
  });
  await sleep(60);
}

async function readFocusedControl(client) {
  return client.evaluate(`(() => {
    const node = document.activeElement;
    if (!node || node === document.body || node === document.documentElement) return null;
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const label = String(
      node.getAttribute("aria-label")
      || node.getAttribute("title")
      || node.innerText
      || node.value
      || node.name
      || node.id
      || node.tagName
    ).replace(/\\s+/g, " ").trim().slice(0, 100);
    const focusable = Array.from(document.querySelectorAll("a[href], button, input:not([type='hidden']), select, textarea, summary, [tabindex]:not([tabindex='-1'])"));
    return {
      tag: node.tagName.toLowerCase(),
      label,
      focusKey: focusable.indexOf(node),
      visible: rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none",
      focusShown: style.outlineStyle !== "none" || style.boxShadow !== "none",
    };
  })()`);
}

async function auditKeyboardFlow(client) {
  await client.evaluate(`(() => {
    const active = document.activeElement;
    if (active && typeof active.blur === "function") active.blur();
    window.scrollTo(0, 0);
    return true;
  })()`);
  const forward = [];
  for (let index = 0; index < 8; index += 1) {
    await pressTab(client);
    forward.push(await readFocusedControl(client));
  }
  const beforeReverse = forward.at(-1);
  await pressTab(client, { reverse: true });
  const reverse = await readFocusedControl(client);
  const usableForward = forward.filter((item) => item?.visible && item.label);
  const uniqueForward = new Set(usableForward.map((item) => `${item.tag}:${item.label}`));
  return {
    forward,
    reverse,
    visibleNamedStops: usableForward.length,
    uniqueNamedStops: uniqueForward.size,
    focusMoves: uniqueForward.size >= 3,
    focusIsShown: usableForward.some((item) => item.focusShown),
    reverseMoves: Boolean(
      (reverse && (!beforeReverse || reverse.focusKey !== beforeReverse.focusKey))
      || (!reverse && beforeReverse?.focusKey === 0)
    ),
  };
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

async function openV2SupportPanel(client) {
  const opened = await client.evaluate(`(() => {
    const panel = document.querySelector("[data-v2-support-panel]");
    if (!panel) return false;
    panel.setAttribute("open", "");
    return true;
  })()`);
  if (opened) await sleep(500);
}

async function previewStudentCsvWithError(client) {
  await openV2SupportPanel(client);
  await waitForSelectorState(client, "[data-csv-import-form][data-csv-import-kind='students']");
  const previewed = await client.evaluate(`(() => {
    const textarea = document.querySelector("[data-csv-text-input='students']");
    const button = document.querySelector("[data-csv-preview-action='students']");
    if (!textarea || !button) return false;
    textarea.value = [
      "first_name,last_name,email,site,program,guardian_phone",
      "Header,Drift,header.drift@senior-capstone.test,Desert Valley High School,Information Technology,555-0100"
    ].join("\\n");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    button.click();
    return true;
  })()`);
  if (!previewed) throw new Error("Could not seed and preview student CSV error state.");
  await waitForSelectorState(client, "[data-csv-preview-next-action='students'][data-csv-preview-next-state='fix-errors']");
  await openV2SupportPanel(client);
  await scrollToSelector(client, "[data-csv-preview-next-action='students']", "CSV preview next action");
}

async function previewStudentCsvAccessError(client) {
  await openV2SupportPanel(client);
  await waitForSelectorState(client, "[data-csv-import-form][data-csv-import-kind='students']");
  const previewed = await client.evaluate(`(() => {
    const textarea = document.querySelector("[data-csv-text-input='students']");
    const button = document.querySelector("[data-csv-preview-action='students']");
    if (!textarea || !button) return false;
    textarea.value = [
      "first_name,last_name,email,site,program,cohort,graduation_year,status",
      "Out,Access,out.access@senior-capstone.test,Other School,Information Technology,Class of 2026,2026,active"
    ].join("\\n");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    button.click();
    return true;
  })()`);
  if (!previewed) throw new Error("Could not seed and preview student CSV access error state.");
  await waitForSelectorState(client, "[data-csv-preview-next-action='students'][data-csv-preview-next-state='fix-errors']");
  await openV2SupportPanel(client);
  await scrollToSelector(client, "[data-csv-preview-next-action='students']", "Student CSV access preview next action");
}

async function performSinglePlanAction(client, action) {
  if (action === "openAllDisclosures") {
    await client.evaluate(`(() => {
      document.querySelectorAll("details").forEach((details) => details.setAttribute("open", ""));
      window.scrollTo(0, 0);
      return document.querySelectorAll("details[open]").length;
    })()`);
    await sleep(500);
    return;
  }
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
    await openV2SupportPanel(client);
    await scrollToSelector(client, "[data-csv-import-stepper]", "CSV import stepper");
    return;
  }
  if (action === "previewStudentCsvWithError") {
    await previewStudentCsvWithError(client);
    return;
  }
  if (action === "previewStudentCsvAccessError") {
    await previewStudentCsvAccessError(client);
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
  if (action === "openTools") {
    const opened = await client.evaluate(`(() => {
      const tools = document.querySelector("[data-workspace-topbar-tools='true']");
      if (!tools) return false;
      tools.setAttribute("open", "");
      return tools.open === true;
    })()`);
    if (!opened) throw new Error("Could not open the workspace Tools menu.");
    await sleep(500);
    return;
  }
  if (action === "openAccountMenu") {
    const opened = await client.evaluate(`(() => {
      const account = document.querySelector("[data-account-menu='true']");
      if (!account) return false;
      account.setAttribute("open", "");
      return account.open === true;
    })()`);
    if (!opened) throw new Error("Could not open the workspace account menu.");
    await sleep(500);
    return;
  }
  if (action === "openAdminRoleSwitcher") {
    const ready = await client.evaluate(`(() => {
      const switcher = document.querySelector("[data-admin-role-switcher='true']");
      if (!switcher) return false;
      switcher.scrollIntoView({ block: "nearest", inline: "nearest" });
      switcher.querySelector("[data-admin-role-mode-target][aria-pressed='false']")?.focus();
      return switcher.querySelectorAll("[data-admin-role-mode-target]").length === 2;
    })()`);
    if (!ready) throw new Error("Could not find both admin working mode choices.");
    await sleep(500);
    return;
  }
  if (action === "switchToSiteAdmin") {
    await client.evaluate(`(() => {
      const switcher = document.querySelector("[data-admin-role-switcher='true']");
      if (switcher) switcher.setAttribute("open", "");
      const option = document.querySelector("[data-admin-role-mode-target='site_admin']");
      if (!option) return false;
      option.click();
      return true;
    })()`);
    await waitForSelectorState(client, "[data-admin-role-mode='site_admin'][data-primary-role='site_admin'][aria-busy='false']");
    await sleep(700);
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
  if (action === "proveProjectOpenAndBack") {
    const before = await client.evaluate(`(() => ({
      href: location.href,
      search: document.querySelector("[data-project-directory-filter-form] [name='search']")?.value || "",
      filter: document.querySelector("[data-project-directory-filter-form] [name='filter']")?.value || "",
      sort: document.querySelector("[data-project-directory-filter-form] [name='sort']")?.value || ""
    }))()`);
    await clickSelector(client, "[data-project-action='open-row'][data-project-id]", "first project row");
    await waitForSelectorState(client, "[data-project-workspace='true']");
    const opened = await client.evaluate(`(() => ({
      href: location.href,
      project: Boolean(document.querySelector("[data-project-workspace='true']")),
      list: Boolean(document.querySelector("[data-project-list-only='true']")),
      filters: Boolean(document.querySelector("[data-project-directory-filter-form]"))
    }))()`);
    if (!opened.project || opened.list || opened.filters || opened.href !== before.href) {
      throw new Error(`Project did not replace the directory cleanly: ${JSON.stringify(opened)}`);
    }
    await clickSelector(client, "[data-project-action='back-to-list']", "Back to project list");
    await waitForSelectorState(client, "[data-project-list-only='true']");
    const returned = await client.evaluate(`(() => ({
      href: location.href,
      project: Boolean(document.querySelector("[data-project-workspace='true']")),
      list: Boolean(document.querySelector("[data-project-list-only='true']")),
      search: document.querySelector("[data-project-directory-filter-form] [name='search']")?.value || "",
      filter: document.querySelector("[data-project-directory-filter-form] [name='filter']")?.value || "",
      sort: document.querySelector("[data-project-directory-filter-form] [name='sort']")?.value || ""
    }))()`);
    if (!returned.list || returned.project || returned.href !== before.href
      || returned.search !== before.search || returned.filter !== before.filter || returned.sort !== before.sort) {
      throw new Error(`Back did not restore the same project directory state: ${JSON.stringify(returned)}`);
    }
    await clickSelector(client, "[data-project-action='open-row'][data-project-id]", "first project row after Back");
    await waitForSelectorState(client, "[data-project-workspace='true']");
    await sleep(700);
    return;
  }
  if (action === "proveProjectStickyRail") {
    const result = await client.evaluate(`(async () => {
      const rail = document.querySelector(".workspace-project-command-rail-sticky");
      const main = document.querySelector(".workspace-project-command-main");
      const topbar = document.querySelector(".workspace-v2-topbar");
      const drawer = document.querySelector(".workspace-v2-drawer");
      if (!rail || !main || !topbar || !drawer) return { ok: false, reason: "missing persistent project layout region" };
      window.scrollTo(0, 0);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const style = getComputedStyle(rail);
      const stickyTop = Number.parseFloat(style.top) || 0;
      const absoluteTop = rail.getBoundingClientRect().top + window.scrollY;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const firstScroll = Math.min(maxScroll, Math.max(0, absoluteTop - stickyTop + 40));
      window.scrollTo(0, firstScroll);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const first = {
        scrollY: window.scrollY,
        railTop: rail.getBoundingClientRect().top,
        mainTop: main.getBoundingClientRect().top,
        topbarTop: topbar.getBoundingClientRect().top,
        drawerTop: drawer.getBoundingClientRect().top,
      };
      window.scrollTo(0, Math.min(maxScroll, first.scrollY + 300));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const second = {
        scrollY: window.scrollY,
        railTop: rail.getBoundingClientRect().top,
        mainTop: main.getBoundingClientRect().top,
        topbarTop: topbar.getBoundingClientRect().top,
        drawerTop: drawer.getBoundingClientRect().top,
      };
      const scrollDelta = second.scrollY - first.scrollY;
      const railDelta = second.railTop - first.railTop;
      const mainDelta = second.mainTop - first.mainTop;
      const topbarDelta = second.topbarTop - first.topbarTop;
      const drawerDelta = second.drawerTop - first.drawerTop;
      const proof = {
        ok: style.position === "sticky"
          && getComputedStyle(topbar).position === "sticky"
          && getComputedStyle(drawer).position === "fixed"
          && scrollDelta >= 100
          && Math.abs(railDelta) <= 2
          && Math.abs(topbarDelta) <= 2
          && Math.abs(drawerDelta) <= 2
          && mainDelta <= -100,
        position: style.position,
        topbarPosition: getComputedStyle(topbar).position,
        drawerPosition: getComputedStyle(drawer).position,
        stickyTop,
        maxScroll,
        scrollDelta,
        railDelta,
        mainDelta,
        topbarDelta,
        drawerDelta,
        ancestors: Array.from((function* () {
          for (let node = rail.parentElement; node; node = node.parentElement) yield node;
        })()).map((node) => {
          const nodeStyle = getComputedStyle(node);
          return {
            tag: node.tagName.toLowerCase(),
            className: String(node.className || "").slice(0, 180),
            overflow: nodeStyle.overflow,
            overflowX: nodeStyle.overflowX,
            overflowY: nodeStyle.overflowY,
            contain: nodeStyle.contain,
            transform: nodeStyle.transform,
          };
        }),
      };
      document.documentElement.dataset.projectStickyRailProof = JSON.stringify(proof);
      return proof;
    })()`, { awaitPromise: true });
    if (!result?.ok) throw new Error(`Project sticky rail did not remain fixed while the left column moved: ${JSON.stringify(result)}`);
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
    function parseColor(value) {
      const text = String(value || "");
      const rgbMatch = text.match(/rgba?\\(([^)]+)\\)/i);
      const srgbMatch = text.match(/color\\(srgb\\s+([^)]+)\\)/i);
      const match = rgbMatch || srgbMatch;
      if (!match) return null;
      const parts = match[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      if (parts.length < 3 || parts.slice(0, 3).some((part) => !Number.isFinite(part))) return null;
      const channelScale = srgbMatch ? 255 : 1;
      return {
        r: parts[0] * channelScale,
        g: parts[1] * channelScale,
        b: parts[2] * channelScale,
        a: Number.isFinite(parts[3]) ? parts[3] : 1,
      };
    }
    function over(front, back) {
      const alpha = front.a + back.a * (1 - front.a);
      if (alpha <= 0) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: ((front.r * front.a) + (back.r * back.a * (1 - front.a))) / alpha,
        g: ((front.g * front.a) + (back.g * back.a * (1 - front.a))) / alpha,
        b: ((front.b * front.a) + (back.b * back.a * (1 - front.a))) / alpha,
        a: alpha,
      };
    }
    function effectiveBackground(element) {
      let result = { r: 0, g: 0, b: 0, a: 0 };
      for (let node = element; node instanceof Element; node = node.parentElement) {
        const style = getComputedStyle(node);
        const solidColor = parseColor(style.backgroundColor);
        const gradientColor = String(style.backgroundImage || "").match(/rgba?\\([^)]+\\)|color\\(srgb\\s+[^)]+\\)/i);
        const color = solidColor && solidColor.a > 0 ? solidColor : parseColor(gradientColor ? gradientColor[0] : "");
        if (color && color.a > 0) result = over(result, color);
        if (result.a >= 0.999) break;
      }
      const fallback = document.documentElement.dataset.theme === "dark"
        ? { r: 9, g: 17, b: 29, a: 1 }
        : { r: 255, g: 255, b: 255, a: 1 };
      return over(result, fallback);
    }
    function luminance(color) {
      const linear = [color.r, color.g, color.b].map((part) => {
        const value = part / 255;
        return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      });
      return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
    }
    function contrast(first, second) {
      const firstLuminance = luminance(first);
      const secondLuminance = luminance(second);
      return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
    }
    function isVisible(element) {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      let visibleThroughClosedDetails = true;
      for (let node = element; node instanceof Element; node = node.parentElement) {
        if (node.matches("details:not([open])") && !node.querySelector(":scope > summary")?.contains(element)) {
          visibleThroughClosedDetails = false;
          break;
        }
      }
      return visibleThroughClosedDetails
        && style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity) > 0
        && rect.width > 0
        && rect.height > 0
        && rect.right > 0
        && rect.bottom > 0;
    }
    function directText(element) {
      return Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent || "")
        .join(" ")
        .replace(/\\s+/g, " ")
        .trim();
    }
    function shortSelector(element) {
      const classes = Array.from(element.classList || []).slice(0, 2);
      return element.tagName.toLowerCase() + (element.id ? "#" + element.id : "") + classes.map((name) => "." + name).join("");
    }
    const contrastAudit = { checked: 0, minimumRatio: null, failures: [] };
    for (const element of document.querySelectorAll("body *")) {
      if (!isVisible(element) || element.matches(":disabled") || element.closest("[aria-disabled='true']")) continue;
      const sample = directText(element);
      if (!sample) continue;
      const style = getComputedStyle(element);
      const foreground = parseColor(style.color);
      const background = effectiveBackground(element);
      if (!foreground || !background) continue;
      const renderedForeground = over(foreground, background);
      const ratio = contrast(renderedForeground, background);
      const fontSize = Number.parseFloat(style.fontSize || "0");
      const fontWeight = Number.parseInt(style.fontWeight || "400", 10) || 400;
      const largeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const requiredRatio = largeText ? 3 : 4.5;
      contrastAudit.checked += 1;
      contrastAudit.minimumRatio = contrastAudit.minimumRatio === null ? ratio : Math.min(contrastAudit.minimumRatio, ratio);
      if (ratio + 0.01 < requiredRatio && contrastAudit.failures.length < 40) {
        contrastAudit.failures.push({
          selector: shortSelector(element),
          parentSelector: element.parentElement ? shortSelector(element.parentElement) : "",
          containerSelector: element.closest("article, section, form, details, nav, aside")
            ? shortSelector(element.closest("article, section, form, details, nav, aside"))
            : "",
          text: sample.slice(0, 80),
          ratio: Number(ratio.toFixed(2)),
          requiredRatio,
          color: style.color,
          background: "rgb(" + [background.r, background.g, background.b].map((value) => Math.round(value)).join(", ") + ")",
          fontSize,
          fontWeight,
        });
      }
    }
    const targetAudit = { checked: 0, minimumWidth: null, minimumHeight: null, failures: [] };
    const targetSelector = "button, input:not([type='hidden']):not([type='checkbox']):not([type='radio']), select, textarea, summary, [role='button'], a.workspace-button, a.workspace-link-button, a.workspace-v2-step";
    for (const element of document.querySelectorAll(targetSelector)) {
      if (!isVisible(element) || element.matches(":disabled") || element.closest("[aria-disabled='true']")) continue;
      const rect = element.getBoundingClientRect();
      targetAudit.checked += 1;
      targetAudit.minimumWidth = targetAudit.minimumWidth === null ? rect.width : Math.min(targetAudit.minimumWidth, rect.width);
      targetAudit.minimumHeight = targetAudit.minimumHeight === null ? rect.height : Math.min(targetAudit.minimumHeight, rect.height);
      if ((rect.width < 24 || rect.height < 24) && targetAudit.failures.length < 40) {
        targetAudit.failures.push({
          selector: shortSelector(element),
          label: String(element.getAttribute("aria-label") || element.innerText || element.value || "").replace(/\\s+/g, " ").trim().slice(0, 80),
          width: Number(rect.width.toFixed(1)),
          height: Number(rect.height.toFixed(1)),
        });
      }
    }
    const topbarAudit = { checked: 0, failures: [] };
    const topbar = document.querySelector(".workspace-v2-topbar");
    const topbarControlSelector = [
      ".workspace-v2-brandline > .workspace-menu-toggle",
      ".workspace-v2-brandline > .workspace-brand",
      ".workspace-v2-tools > summary",
      ".workspace-v2-user > .workspace-active-role-badge",
      ".workspace-v2-user > .workspace-admin-role-switcher",
      ".workspace-v2-user > .workspace-account-menu > .workspace-account-summary",
    ].join(",");
    const topbarControls = Array.from(document.querySelectorAll(topbarControlSelector)).filter(isVisible);
    const topbarRows = topbarControls.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        element,
        selector: shortSelector(element),
        label: String(element.getAttribute("aria-label") || element.innerText || "").replace(/\\s+/g, " ").trim().slice(0, 80),
        rect,
      };
    });
    topbarAudit.checked = topbarRows.length;
    for (const row of topbarRows) {
      if (row.rect.left < -1 || row.rect.right > window.innerWidth + 1) {
        topbarAudit.failures.push({
          type: "outside-viewport",
          selector: row.selector,
          label: row.label,
          left: Number(row.rect.left.toFixed(1)),
          right: Number(row.rect.right.toFixed(1)),
          viewportWidth: window.innerWidth,
        });
      }
    }
    for (let firstIndex = 0; firstIndex < topbarRows.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < topbarRows.length; secondIndex += 1) {
        const first = topbarRows[firstIndex];
        const second = topbarRows[secondIndex];
        const overlapX = Math.min(first.rect.right, second.rect.right) - Math.max(first.rect.left, second.rect.left);
        const overlapY = Math.min(first.rect.bottom, second.rect.bottom) - Math.max(first.rect.top, second.rect.top);
        if (overlapX > 1 && overlapY > 1) {
          topbarAudit.failures.push({
            type: "control-overlap",
            first: first.label || first.selector,
            second: second.label || second.selector,
            overlapX: Number(overlapX.toFixed(1)),
            overlapY: Number(overlapY.toFixed(1)),
          });
        }
      }
    }
    for (const panel of document.querySelectorAll(".workspace-v2-tools[open] > .workspace-v2-tools-panel, .workspace-account-menu[open] > .workspace-topbar-actions, .workspace-admin-role-switcher[open] > .workspace-admin-role-menu")) {
      if (!isVisible(panel)) continue;
      const rect = panel.getBoundingClientRect();
      const position = getComputedStyle(panel).position;
      if (rect.left < -1 || rect.right > window.innerWidth + 1) {
        topbarAudit.failures.push({
          type: "panel-outside-viewport",
          selector: shortSelector(panel),
          left: Number(rect.left.toFixed(1)),
          right: Number(rect.right.toFixed(1)),
          viewportWidth: window.innerWidth,
        });
      }
      if (position === "fixed" && topbar && rect.top < topbar.getBoundingClientRect().bottom - 1) {
        topbarAudit.failures.push({
          type: "panel-covers-header",
          selector: shortSelector(panel),
          panelTop: Number(rect.top.toFixed(1)),
          headerBottom: Number(topbar.getBoundingClientRect().bottom.toFixed(1)),
        });
      }
      const panelControls = Array.from(panel.querySelectorAll("button, input:not([type='hidden']), select, textarea, summary, [role='button'], a")).filter(isVisible);
      for (const control of panelControls) {
        const controlRect = control.getBoundingClientRect();
        if (controlRect.left < rect.left - 1 || controlRect.right > rect.right + 1) {
          topbarAudit.failures.push({
            type: "panel-control-clipped",
            selector: shortSelector(control),
            label: String(control.getAttribute("aria-label") || control.innerText || control.value || "").replace(/\\s+/g, " ").trim().slice(0, 80),
            left: Number(controlRect.left.toFixed(1)),
            right: Number(controlRect.right.toFixed(1)),
            panelLeft: Number(rect.left.toFixed(1)),
            panelRight: Number(rect.right.toFixed(1)),
          });
        }
      }
    }
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
    const bodyStyle = getComputedStyle(document.body);
    const headingElement = document.querySelector("h1, h2");
    const headingStyle = headingElement ? getComputedStyle(headingElement) : bodyStyle;
    return {
      title: document.title,
      url: location.href,
      text,
      textSample: text.replace(/\\s+/g, " ").trim().slice(0, 700),
      visiblePasswordValueCount: visiblePasswordValues.length,
      heading: (document.querySelector("h1, h2") || {}).textContent || "",
      activeNav,
      presentation: {
        theme: document.documentElement.dataset.theme || "",
        schoolTheme: document.documentElement.dataset.schoolTheme || "default",
        fontFamily: bodyStyle.fontFamily,
        headingFontFamily: headingStyle.fontFamily,
        eastTechFontLoaded: Boolean(document.fonts?.check('700 16px "Barlow Semi Condensed"')),
        fontSize: Number.parseFloat(bodyStyle.fontSize || "0"),
        lineHeight: bodyStyle.lineHeight,
      },
      layout: {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        documentClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body ? document.body.scrollWidth : 0,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        topbar: topbarAudit,
      },
      accessibility: {
        contrast: contrastAudit,
        targets: targetAudit,
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
        finalFiles: Boolean(document.querySelector("[data-archive-dashboard], .workspace-archive-dashboard, [data-student-final-checklist='true']")),
        projectStickyRail: (() => {
          try {
            return document.documentElement.dataset.projectStickyRailProof
              ? JSON.parse(document.documentElement.dataset.projectStickyRailProof)
              : null;
          } catch {
            return null;
          }
        })(),
        toolsOpen: Boolean(document.querySelector("[data-workspace-topbar-tools='true'][open]")),
        accountMenuOpen: Boolean(document.querySelector("[data-account-menu='true'][open]")),
        adminRoleSwitcherOpen: Boolean(document.querySelectorAll("[data-admin-role-switcher='true'] [data-admin-role-mode-target]").length === 2),
      },
      disclosures: {
        total: document.querySelectorAll("details").length,
        open: document.querySelectorAll("details[open]").length,
      },
      v2: {
        frame: Boolean(document.querySelector('[data-flow-frame="v2-from-scratch"]')),
        screen: document.querySelector("[data-v2-screen]")?.getAttribute("data-v2-screen") || "",
        support: Boolean(document.querySelector("[data-v2-support-panel]"))
      }
    };
  })()`);
}

function checkPage(planItem, pageState) {
  const text = `${pageState.heading || ""}\n${pageState.text || ""}`;
  const expectedMarkers = planItem.expected || [];
  const searchableText = text.toLowerCase();
  const missingExpectedText = expectedMarkers.filter((marker) => {
    const expected = String(marker).toLowerCase();
    return !searchableText.includes(expected);
  });
  const unexpectedText = (planItem.absent || []).filter((marker) => text.includes(marker));
  const secretMatches = SECRET_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  const requestedActions = [
    ...(Array.isArray(planItem.actions) ? planItem.actions : []),
    ...(planItem.action ? [planItem.action] : []),
  ];
  const drawerOpenWhenRequested = requestedActions.includes("openDrawer")
    ? pageState.drawer.railPresent && pageState.drawer.hidden === false && pageState.drawer.expanded === "true"
    : true;
  const toolsOpenWhenRequested = requestedActions.includes("openTools")
    ? pageState.markers?.toolsOpen === true
    : true;
  const accountMenuOpenWhenRequested = requestedActions.includes("openAccountMenu")
    ? pageState.markers?.accountMenuOpen === true
    : true;
  const adminRoleSwitcherOpenWhenRequested = requestedActions.includes("openAdminRoleSwitcher")
    ? pageState.markers?.adminRoleSwitcherOpen === true
    : true;
  const allDisclosuresOpenWhenRequested = requestedActions.includes("openAllDisclosures")
    ? Number(pageState.disclosures?.open || 0) === Number(pageState.disclosures?.total || 0)
    : true;
  const expectedTheme = planItem.theme === "dark" ? "dark" : "light";
  const expectedSchoolTheme = String(planItem.expectedSchoolTheme || "").trim();
  const expectedHeadingFont = String(planItem.expectedHeadingFont || "").trim();
  return {
    expectedTextPresent: missingExpectedText.length === 0,
    missingExpectedText,
    noUnexpectedText: unexpectedText.length === 0,
    unexpectedText,
    noVisiblePasswordValues: pageState.visiblePasswordValueCount === 0,
    noSecretLikeText: secretMatches.length === 0,
    secretPatternMatches: secretMatches,
    noHorizontalOverflow: pageState.layout.horizontalOverflow === false,
    topbarLayoutSafe: (pageState.layout?.topbar?.failures || []).length === 0,
    topbarLayoutFailures: pageState.layout?.topbar?.failures || [],
    drawerOpenWhenRequested,
    toolsOpenWhenRequested,
    accountMenuOpenWhenRequested,
    adminRoleSwitcherOpenWhenRequested,
    allDisclosuresOpenWhenRequested,
    expectedThemeApplied: pageState.presentation?.theme === expectedTheme,
    expectedSchoolThemeApplied: !expectedSchoolTheme || pageState.presentation?.schoolTheme === expectedSchoolTheme,
    expectedHeadingFontApplied: !expectedHeadingFont || (
      String(pageState.presentation?.headingFontFamily || "").includes(expectedHeadingFont)
      && pageState.presentation?.eastTechFontLoaded === true
    ),
    readableBaseType: Number(pageState.presentation?.fontSize || 0) >= 14,
    wcagTextContrast: (pageState.accessibility?.contrast?.failures || []).length === 0,
    contrastFailures: pageState.accessibility?.contrast?.failures || [],
    noTinyTargets: (pageState.accessibility?.targets?.failures || []).length === 0,
    tinyTargetFailures: pageState.accessibility?.targets?.failures || [],
    keyboardFocusMoves: pageState.keyboard?.focusMoves === true,
    keyboardFocusIsShown: pageState.keyboard?.focusIsShown === true,
    keyboardReverseMoves: pageState.keyboard?.reverseMoves === true,
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

function markdownCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replaceAll("\r", " ").replaceAll("\n", " ");
}

async function writeScreenshotIndex(result) {
  const environmentLabel = HOSTED_PROOF ? "Hosted fake-account UI proof only." : "Local fake-account UI proof only.";
  const claimBoundary = HOSTED_PROOF
    ? "These screenshots prove hosted fake-account demo UI state on the configured public base URL."
    : "These screenshots prove local fake-account demo UI state only.";
  const rows = result.screenshots.filter((screenshot) => screenshot.screenshot).map((screenshot) => (
    `| \`${markdownCell(screenshot.screenshot)}\` | ${markdownCell(screenshot.persona)} | \`${markdownCell(screenshot.role)}\` | ${markdownCell(screenshot.accountType)} | ${markdownCell(`${screenshot.viewport?.width || 0}x${screenshot.viewport?.height || 0}`)} | ${markdownCell(screenshot.proves)} | ${environmentLabel} |`
  ));
  const content = `# Workspace UI Polish Screenshot Index

Completed: ${result.completedAt || "Not completed"}

Proof status: \`${result.verdict}\`

Manifest: \`${result.manifestPath}\`

Screenshot directory: \`${result.screenshotDir}/\`

## Claim Boundary

${claimBoundary} They do not prove real-student pilot readiness, FERPA certification, support readiness, retention readiness, or district policy approval. Real-student pilot remains **NO-GO** until the required external approvals and real-user evidence exist.

\`student_archive_manifest_download\` remains a future/not-ready pilot item unless a later hosted proof explicitly shows a scoped student manifest download is available and safe.

## Screenshots

| File | Persona | Role | Account type | Viewport | What the screenshot proves | Caveat |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}

## Screenshot Hygiene

- Every row passed expected-copy, secret, overflow, theme, school-theme, type-size, WCAG contrast, target-size, and keyboard-focus checks.
- The manifest and index contain no credential values.
- Fake \`.test\` account labels and fake demo records may appear in screenshots.
- Upload-heavy hosted evidence proof is intentionally separate from this local UI polish screenshot set.
`;
  await fs.mkdir(path.dirname(absoluteRepoPath(SCREENSHOT_INDEX_PATH)), { recursive: true });
  await fs.writeFile(absoluteRepoPath(SCREENSHOT_INDEX_PATH), content);
}

function passedChecks(checks) {
  return checks.expectedTextPresent
    && checks.noUnexpectedText
    && checks.noVisiblePasswordValues
    && checks.noSecretLikeText
    && checks.noHorizontalOverflow
    && checks.topbarLayoutSafe
    && checks.drawerOpenWhenRequested
    && checks.toolsOpenWhenRequested
    && checks.accountMenuOpenWhenRequested
    && checks.adminRoleSwitcherOpenWhenRequested
    && checks.allDisclosuresOpenWhenRequested
    && checks.expectedThemeApplied
    && checks.expectedSchoolThemeApplied
    && checks.expectedHeadingFontApplied
    && checks.readableBaseType
    && checks.wcagTextContrast
    && checks.noTinyTargets
    && checks.keyboardFocusMoves
    && checks.keyboardFocusIsShown
    && checks.keyboardReverseMoves;
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
    proof: HOSTED_PROOF ? "workspace_ui_polish_hosted_browser" : "workspace_ui_polish_local_browser",
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
    claimBoundary: HOSTED_PROOF
      ? "Hosted fake-account browser UI proof only. Does not prove real-student pilot readiness."
      : "Local fake-account browser UI proof only. Does not prove real-student pilot readiness.",
    coverage: EXHAUSTIVE_PROOF ? {
      mode: "exhaustive",
      canonicalInteractiveCases: SCREENSHOT_PLAN.length - EXHAUSTIVE_PLAN.length,
      generatedAuditCases: EXHAUSTIVE_PLAN.length,
      roles: Object.keys(EXHAUSTIVE_ROLE_SURFACES),
      topLevelSections: [...new Set(Object.values(EXHAUSTIVE_ROLE_SURFACES).flatMap((modes) => Object.values(modes).flat()))].sort(),
      responsiveProfiles: EXHAUSTIVE_RESPONSIVE_PROFILES.map(([name, viewport, theme]) => ({ name, viewport, theme })),
      everyRoleSurfaceDesktopLightAndDark: true,
      everyDistinctSectionAcrossResponsiveProfiles: true,
      everyDisclosureExpandedPerRoleSurfaceInDarkDesktop: true,
    } : { mode: "canonical" },
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
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await client.send("Log.enable");

    let originReady = false;
    for (const [planIndex, planItem] of RUN_PLAN.entries()) {
      if (planIndex > 0 && planIndex % 15 === 0 && typeof localApp.restart === "function") {
        await localApp.restart();
      }
      await setViewport(client, planItem.viewport);
      if (!originReady) {
        await navigate(client, `${localApp.baseUrl}${WORKSPACE_ENTRY_PATH}`, { recover: localApp.restart });
        originReady = true;
      }
      await logout(client);
      const loginResult = await login(client, accountsByRole.get(normalizeAccountRole(planItem.authRole)));
      await applyProofTheme(client, planItem.theme || "light");
      await navigate(client, `${localApp.baseUrl}${planItem.url}`, { recover: localApp.restart });
      // Route load is only the shell. Wait for the requested role screen before
      // looking for controls so an action cannot hit stale DOM from the prior case.
      await waitForStableWorkspace(client);
      await performPlanAction(client, planItem);
      await waitForStableWorkspace(client);
      const pageState = await collectPageState(client);
      pageState.keyboard = planItem.auditKeyboard === false
        ? { skipped: true, focusMoves: true, focusIsShown: true, reverseMoves: true }
        : await auditKeyboardFlow(client);
      const checks = checkPage(planItem, pageState);
      const relativePath = planItem.capture === false
        ? null
        : path.join(SCREENSHOT_DIR, `${planItem.id}.png`).replaceAll("\\", "/");
      if (relativePath) await captureScreenshot(client, absoluteRepoPath(relativePath));
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
        caveat: `${HOSTED_PROOF ? "Hosted" : "Local"} fake/demo account UI screenshot only; not real-student production pilot proof.`,
        login: loginResult,
        checks,
        markers: pageState.markers,
        heading: String(pageState.heading || "").trim(),
        textSample: pageState.textSample,
        activeNav: pageState.activeNav,
        presentation: pageState.presentation,
        keyboard: pageState.keyboard,
        disclosures: pageState.disclosures,
      });
      console.log(`${passed ? "PASS" : "FAIL"} ${planItem.id} ${planItem.label} -> ${relativePath || "audit-only manifest row"}`);
    }

    result.completedAt = new Date().toISOString();
    result.verdict = result.failures.length
      ? "NOT_GREEN"
      : HOSTED_PROOF
        ? "GREEN_HOSTED_FAKE_ACCOUNT_UI_POLISH_PROOF"
        : "GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF";
    await writeManifest(result);
    if (result.failures.length) {
      throw new Error(`Workspace UI polish proof failed for ${result.failures.length} screenshot(s).`);
    }
    await writeScreenshotIndex(result);
  } catch (error) {
    result.completedAt = new Date().toISOString();
    result.verdict = "NOT_GREEN";
    result.error = error.message;
    result.edgeStderrTail = tailLines(edgeStderr);
    result.appStdoutTail = tailLines(localApp.stdout || []);
    result.appStderrTail = tailLines(localApp.stderr || []);
    result.browserDiagnostics = client?.diagnostics?.slice(-20) || [];
    await writeManifest(result).catch(() => {});
    throw error;
  } finally {
    if (client) client.socket.close();
    if (!edge.killed) edge.kill();
    await stopLocalPagesProcess(localApp.app);
    await fs.rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
