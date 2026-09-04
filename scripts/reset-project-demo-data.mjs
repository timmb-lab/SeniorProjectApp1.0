#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { RemoteWranglerD1Adapter } from "./seed-remote-demo-workspace.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const DATABASE_NAME = "senior-capstone-db";
const WRANGLER_JS = path.join(REPO_ROOT, "node_modules", "wrangler", "bin", "wrangler.js");
const CONFIRMATION = "RESET_PROJECT_DATA";
const SITE_ID = "site-desert-valley-high";

const PROJECTS = Object.freeze([
  project("demo-project-smart-locker", "Smart Locker Tracker", "Help students find open lockers and report broken locks.", "it", "start", "active", ["demo-student-001", "test_user_student_maya"], "demo-mentor-001", "demo-teacher-it-01", "req-senior-project-workspace", "draft", "We need to ask the front office which locker problems happen most.", [
    ["demo-student-001", "We listed the people we need to interview. Next, we will write five short questions."],
  ]),
  project("demo-project-recipe-book", "Community Recipe Book", "Make a simple recipe book with low-cost family meals.", "culinary", "phase-1", "active", ["demo-student-046", "demo-student-047"], "demo-mentor-002", "demo-teacher-culinary-01", "req-proposal-draft", "submitted", "We chose ten recipes and explained who the book will help.", [
    ["demo-student-046", "The proposal is ready for review. We checked every recipe with our mentor."],
    ["demo-mentor-002", "Good first plan. Add one question about food allergies at the next check-in."],
  ]),
  project("demo-project-event-checkin", "Campus Event Check-In", "Build a clear check-in plan for school events.", "hospitality-marketing", "phase-2a", "active", ["demo-student-081", "demo-student-082", "demo-student-083"], "demo-mentor-003", "demo-teacher-hospitality-marketing-01", "req-mentor-meeting-one-plan", "revision_requested", "Our first test had a long line, so we need a faster sign-in step.", [
    ["demo-student-081", "We tested the first check-in table during lunch. The name search took too long."],
    ["demo-teacher-hospitality-marketing-01", "Try one table for last names A through L and one for M through Z."],
  ]),
  project("demo-project-shop-cart", "Safer Shop Cart", "Design a cart that moves tools safely around the shop.", "mechanical-technology", "phase-2b", "active", ["demo-student-106", "demo-student-107", "demo-student-108", "demo-student-109"], "demo-mentor-004", "demo-teacher-mechanical-technology-01", "req-mentor-meeting-two-outline", "approved", "The wheel test passed. The team is building the handle next.", [
    ["demo-mentor-004", "The wheel test passed with the full practice load."],
    ["demo-student-106", "We changed the handle height after the first test. It is easier to push now."],
  ]),
  project("demo-project-tiny-home", "Tiny Home Materials Plan", "Compare safe, affordable materials for a small home.", "construction", "phase-3a", "active", ["demo-student-131", "demo-student-132", "demo-student-133", "demo-student-134", "demo-student-135"], "demo-mentor-005", "demo-teacher-construction-01", "req-presentation-day", "submitted", "The cost chart and model photos are ready for presentation review.", [
    ["demo-student-131", "The model is done. We need to practice the cost section before Friday."],
    ["demo-teacher-construction-01", "Each team member should explain one material choice during practice."],
  ]),
  project("demo-project-injury-campaign", "Sports Injury Prevention Campaign", "Teach younger athletes three ways to prevent common injuries.", "sports-medicine", "phase-3b", "active", ["demo-student-156", "demo-student-157"], "demo-mentor-006", "demo-teacher-sports-medicine-01", "req-celebration-day", "approved", "The team presented the warm-up lesson and is planning the showcase table.", [
    ["demo-student-156", "Our first lesson went well. Students remembered all three warm-up moves."],
    ["demo-mentor-006", "Bring the large movement cards to the showcase so visitors can try the lesson."],
  ]),
  project("demo-project-classroom-kits", "Classroom Activity Kits", "Create reusable activity kits for first-grade classrooms.", "teaching-training", "phase-4", "active", ["demo-student-191", "demo-student-192", "demo-student-193"], "demo-mentor-007", "demo-teacher-teaching-training-01", "req-reflection-best-work", "revision_requested", "The kits are finished. The reflection needs one clear example from the classroom test.", [
    ["demo-teacher-teaching-training-01", "Add one example of what a child said or did during the test."],
    ["demo-student-191", "We will use our notes from the color-sorting activity to improve the reflection."],
  ]),
  project("demo-project-childcare-guide", "Childcare Calm-Down Guide", "Make a picture guide that helps young children calm down.", "early-childhood-education", "finish", "completed", ["demo-student-211", "demo-student-212", "demo-student-213", "demo-student-214"], "demo-mentor-008", "demo-teacher-early-childhood-education-01", "req-personal-archive-export", "approved", "The guide, final reflection, and presentation are complete.", [
    ["demo-student-211", "We finished the guide and shared a copy with the classroom teacher."],
    ["demo-mentor-008", "The pictures are clear and the steps are easy to follow. Great finish."],
    ["demo-student-212", "Old print count: 12 copies. We archived this note after the final count changed.", "archived"],
  ]),
]);

function project(id, name, summary, programId, phase, status, students, mentorId, teacherId, requirementId, submissionStatus, reflection, notes) {
  return { id, name, summary, programId, phase, status, students, mentorId, teacherId, requirementId, submissionStatus, reflection, notes };
}

function parseArgs(values = process.argv.slice(2)) {
  const args = { mode: "", confirm: "" };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--remote") continue;
    if (value === "--dry-run") args.mode = "dryrun";
    else if (value === "--write") args.mode = "write";
    else if (value === "--confirm") args.confirm = values[++index] || "";
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (!args.mode) throw new Error("Choose --dry-run or --write.");
  if (args.mode === "write" && args.confirm !== CONFIRMATION) throw new Error(`Remote reset requires --confirm ${CONFIRMATION}.`);
  return args;
}

async function runReset(args, options = {}) {
  const adapter = options.adapter || new RemoteWranglerD1Adapter({ repoRoot: REPO_ROOT });
  const protectedBefore = await protectedCounts(adapter);
  await validateSeedPeople(adapter);
  const preview = {
    ok: true,
    mode: args.mode,
    target: "remote",
    projectCount: PROJECTS.length,
    activeMembershipCount: PROJECTS.reduce((sum, row) => sum + row.students.length, 0),
    noteCount: PROJECTS.reduce((sum, row) => sum + row.notes.length, 0),
    phases: Object.fromEntries(PROJECTS.map((row) => [row.name, row.phase])),
    protectedBefore,
    backupPath: null,
  };
  if (args.mode === "dryrun") return preview;

  const backupPath = options.skipBackup ? null : exportRemoteBackup(options.now || new Date());
  await adapter.executeScript(buildResetSeedSql(PROJECTS), { label: "reset-project-demo-data", repoRoot: REPO_ROOT });
  const protectedAfter = await protectedCounts(adapter);
  assertSameProtectedCounts(protectedBefore, protectedAfter);
  const verification = await verifySeed(adapter);
  return { ...preview, backupPath, protectedAfter, verification };
}

async function validateSeedPeople(adapter) {
  const studentIds = PROJECTS.flatMap((row) => row.students);
  const adultIds = PROJECTS.flatMap((row) => [row.mentorId, row.teacherId]);
  const quotedPeople = [...new Set([...studentIds, ...adultIds])].map(sql).join(", ");
  const people = await adapter.query(
    `SELECT u.id, u.email_norm, u.status, r.role_id, r.scope_type, r.scope_id
     FROM user_accounts u JOIN user_roles r ON r.user_id = u.id
     WHERE u.id IN (${quotedPeople})`,
  );
  for (const project of PROJECTS) {
    for (const studentId of project.students) {
      const person = people.find((row) => row.id === studentId && row.role_id === "student");
      if (!person || person.status !== "active" || !String(person.email_norm).endsWith(".test")) throw new Error(`Fake student is not ready: ${studentId}`);
    }
    const mentor = people.find((row) => row.id === project.mentorId && row.role_id === "mentor");
    if (!mentor || mentor.status !== "active" || !String(mentor.email_norm).endsWith(".test")) throw new Error(`Fake mentor is not ready: ${project.mentorId}`);
    const teacher = people.find((row) => row.id === project.teacherId && row.role_id === "program_teacher" && row.scope_id === project.programId);
    if (!teacher || teacher.status !== "active" || !String(teacher.email_norm).endsWith(".test")) throw new Error(`Fake Program Teacher is not ready: ${project.teacherId}`);
  }
}

async function protectedCounts(adapter) {
  const [row] = await adapter.query(
    `SELECT
       (SELECT COUNT(*) FROM user_accounts) AS accounts,
       (SELECT COUNT(*) FROM user_roles) AS role_assignments,
       (SELECT COUNT(*) FROM sites) AS sites,
       (SELECT COUNT(*) FROM programs) AS programs,
       (SELECT COUNT(*) FROM project_templates) AS templates,
       (SELECT COUNT(*) FROM app_settings) AS settings`,
  );
  return row;
}

function assertSameProtectedCounts(before, after) {
  for (const key of ["accounts", "role_assignments", "sites", "programs", "templates", "settings"]) {
    if (Number(before?.[key]) !== Number(after?.[key])) throw new Error(`Protected ${key} changed during the project reset.`);
  }
}

async function verifySeed(adapter) {
  const [counts] = await adapter.query(
    `SELECT
       (SELECT COUNT(*) FROM projects) AS projects,
       (SELECT COUNT(*) FROM project_members WHERE active = 1) AS members,
       (SELECT COUNT(*) FROM project_notes) AS notes,
       (SELECT COUNT(*) FROM project_notes WHERE status = 'archived') AS archived_notes,
       (SELECT COUNT(*) FROM mentor_assignments WHERE active = 1) AS student_mentor_links,
       (SELECT COUNT(*) FROM project_adult_assignments WHERE adult_role = 'mentor' AND status = 'accepted') AS mentors,
       (SELECT COUNT(*) FROM project_adult_assignments WHERE adult_role = 'program_teacher' AND status = 'accepted') AS teachers,
       (SELECT COUNT(*) FROM submissions) AS submissions,
       (SELECT COUNT(*) FROM reviews) AS reviews,
       (SELECT COUNT(*) FROM mentor_meetings) AS meetings,
       (SELECT COUNT(*) FROM presentation_slots) AS presentations`,
  );
  const expected = { projects: 8, members: 25, notes: 16, archived_notes: 1, student_mentor_links: 26, mentors: 8, teachers: 8, submissions: 8, reviews: 5, meetings: 8, presentations: 4 };
  for (const [key, value] of Object.entries(expected)) {
    if (Number(counts?.[key]) !== value) throw new Error(`Project reset verification failed for ${key}: expected ${value}, found ${counts?.[key]}.`);
  }
  return counts;
}

function buildResetSeedSql(projects = PROJECTS) {
  const statements = [
    "PRAGMA foreign_keys = ON;",
    "DELETE FROM user_notifications WHERE entity_type = 'project';",
    "DELETE FROM project_adult_assignment_events;",
    "DELETE FROM project_adult_assignments;",
    "DELETE FROM project_request_events;",
    "DELETE FROM project_request_moves;",
    "DELETE FROM project_request_members;",
    "DELETE FROM project_requests;",
    "DELETE FROM comments;",
    "DELETE FROM evidence_artifacts;",
    "DELETE FROM student_work_response_versions;",
    "DELETE FROM student_work_responses;",
    "DELETE FROM submission_versions;",
    "DELETE FROM reviews;",
    "DELETE FROM presentation_practice_feedback;",
    "DELETE FROM presentation_slots;",
    "DELETE FROM mentor_meetings;",
    "DELETE FROM status_history;",
    "DELETE FROM progress_records;",
    "DELETE FROM submissions;",
    "DELETE FROM export_artifacts;",
    "DELETE FROM exports;",
    "DELETE FROM mentor_assignments;",
    "DELETE FROM project_mentor_assignments;",
    "DELETE FROM project_notes;",
    "DELETE FROM project_members;",
    "DELETE FROM projects;",
  ];

  projects.forEach((projectRow, projectIndex) => {
    const number = projectIndex + 1;
    const baseTime = `2026-08-${String(11 + projectIndex).padStart(2, "0")}T16:00:00.000Z`;
    const submissionId = `demo-submission-${String(number).padStart(2, "0")}`;
    const progressId = `demo-progress-${String(number).padStart(2, "0")}`;
    const hasSubmitted = projectRow.submissionStatus !== "draft";
    statements.push(
      `INSERT INTO projects (id, site_id, program_id, name, summary, status, current_phase, created_by, drive_folder_url, drive_folder_added_by, drive_folder_updated_at, drive_folder_check_status, created_at, updated_at) VALUES (${sql(projectRow.id)}, ${sql(SITE_ID)}, ${sql(projectRow.programId)}, ${sql(projectRow.name)}, ${sql(projectRow.summary)}, ${sql(projectRow.status)}, ${sql(projectRow.phase)}, ${sql(projectRow.students[0])}, ${sql(`https://drive.google.com/drive/folders/DEMO_CAPSTONE_${String(number).padStart(2, "0")}`)}, ${sql(projectRow.students[0])}, ${sql(baseTime)}, 'not_checked', ${sql(baseTime)}, ${sql(baseTime)});`,
    );
    projectRow.students.forEach((studentId, studentIndex) => {
      statements.push(
        `INSERT INTO project_members (project_id, student_user_id, member_role, active, assigned_by, created_at, updated_at) VALUES (${sql(projectRow.id)}, ${sql(studentId)}, ${sql(studentIndex === 0 ? "lead" : "member")}, 1, ${sql(projectRow.teacherId)}, ${sql(baseTime)}, ${sql(baseTime)});`,
        `INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, assigned_by, active, created_at) VALUES (${sql(`demo-mentor-assignment-${number}-${studentIndex + 1}`)}, ${sql(projectRow.mentorId)}, ${sql(studentId)}, ${sql(projectRow.teacherId)}, 1, ${sql(baseTime)});`,
      );
    });
    statements.push(
      `INSERT INTO project_mentor_assignments (id, project_id, mentor_user_id, active, assigned_by, created_at, updated_at) VALUES (${sql(`demo-project-mentor-${number}`)}, ${sql(projectRow.id)}, ${sql(projectRow.mentorId)}, 1, ${sql(projectRow.teacherId)}, ${sql(baseTime)}, ${sql(baseTime)});`,
      adultAssignment(projectRow, number, "mentor", projectRow.mentorId, baseTime),
      adultAssignment(projectRow, number, "program_teacher", projectRow.teacherId, baseTime),
      `INSERT INTO submissions (id, student_id, requirement_id, status, version, submitted_at, created_at, updated_at, project_id) VALUES (${sql(submissionId)}, ${sql(projectRow.students[0])}, ${sql(projectRow.requirementId)}, ${sql(projectRow.submissionStatus)}, 1, ${hasSubmitted ? sql(baseTime) : "NULL"}, ${sql(baseTime)}, ${sql(baseTime)}, ${sql(projectRow.id)});`,
      `INSERT INTO submission_versions (id, submission_id, student_id, requirement_id, version, status, submitted_by, submitted_at, evidence_snapshot_json, notes) VALUES (${sql(`demo-submission-version-${number}`)}, ${sql(submissionId)}, ${sql(projectRow.students[0])}, ${sql(projectRow.requirementId)}, 1, ${sql(projectRow.submissionStatus)}, ${sql(projectRow.students[0])}, ${sql(baseTime)}, '[]', ${sql("Fake project example for testing.")});`,
      `INSERT INTO student_work_responses (id, submission_id, student_id, requirement_id, response_text, created_at, updated_at) VALUES (${sql(`demo-response-${number}`)}, ${sql(submissionId)}, ${sql(projectRow.students[0])}, ${sql(projectRow.requirementId)}, ${sql(projectRow.reflection)}, ${sql(baseTime)}, ${sql(baseTime)});`,
      `INSERT INTO student_work_response_versions (id, submission_id, version, response_text, created_at) VALUES (${sql(`demo-response-version-${number}`)}, ${sql(submissionId)}, 1, ${sql(projectRow.reflection)}, ${sql(baseTime)});`,
      `INSERT INTO progress_records (id, student_id, requirement_id, phase, status, updated_by, updated_at, project_id) VALUES (${sql(progressId)}, ${sql(projectRow.students[0])}, ${sql(projectRow.requirementId)}, ${sql(projectRow.phase)}, ${sql(projectRow.submissionStatus === "draft" ? "in_progress" : projectRow.submissionStatus)}, ${sql(projectRow.students[0])}, ${sql(baseTime)}, ${sql(projectRow.id)});`,
      `INSERT INTO status_history (id, student_id, entity_type, entity_id, from_status, to_status, changed_by, reason, created_at, project_id) VALUES (${sql(`demo-history-${number}`)}, ${sql(projectRow.students[0])}, 'submission', ${sql(submissionId)}, ${projectRow.submissionStatus === "draft" ? "NULL" : "'draft'"}, ${sql(projectRow.submissionStatus)}, ${sql(projectRow.students[0])}, ${sql(statusReason(projectRow.submissionStatus))}, ${sql(baseTime)}, ${sql(projectRow.id)});`,
      `INSERT INTO mentor_meetings (id, mentor_user_id, student_user_id, submission_id, status, scheduled_for, held_at, notes, created_by, created_at, updated_at, project_id) VALUES (${sql(`demo-meeting-${number}`)}, ${sql(projectRow.mentorId)}, ${sql(projectRow.students[0])}, ${sql(submissionId)}, ${sql(number <= 2 ? "scheduled" : "held")}, ${sql(`2026-09-${String(4 + number).padStart(2, "0")}T22:00:00.000Z`)}, ${number <= 2 ? "NULL" : sql(baseTime)}, ${sql(meetingNote(number))}, ${sql(projectRow.mentorId)}, ${sql(baseTime)}, ${sql(baseTime)}, ${sql(projectRow.id)});`,
    );
    if (number > 1) {
      statements.push(`INSERT INTO evidence_artifacts (id, student_id, submission_id, artifact_type, source_kind, external_url, title, review_status, created_by, created_at, project_id) VALUES (${sql(`demo-evidence-${number}`)}, ${sql(projectRow.students[0])}, ${sql(submissionId)}, 'project_work', 'external_link', ${sql(`https://docs.google.com/document/d/DEMO_CAPSTONE_WORK_${String(number).padStart(2, "0")}/edit`)}, ${sql(`${projectRow.name} work link`)}, ${sql(projectRow.submissionStatus === "approved" ? "approved" : projectRow.submissionStatus === "revision_requested" ? "revision_requested" : "pending_review")}, ${sql(projectRow.students[0])}, ${sql(baseTime)}, ${sql(projectRow.id)});`);
    }
    if (["approved", "revision_requested"].includes(projectRow.submissionStatus)) {
      statements.push(`INSERT INTO reviews (id, submission_id, reviewer_user_id, decision, feedback, created_at) VALUES (${sql(`demo-review-${number}`)}, ${sql(submissionId)}, ${sql(projectRow.teacherId)}, ${sql(projectRow.submissionStatus)}, ${sql(reviewFeedback(projectRow.submissionStatus))}, ${sql(baseTime)});`);
    }
    if (number >= 5 && number <= 8) {
      statements.push(`INSERT INTO presentation_slots (id, student_user_id, submission_id, requirement_id, scheduled_for, duration_minutes, location, status, outline_status, notes, created_by, created_at, updated_at, project_id) VALUES (${sql(`demo-presentation-${number}`)}, ${sql(projectRow.students[0])}, ${sql(submissionId)}, ${sql(projectRow.requirementId)}, ${sql(`2026-10-${String(10 + number).padStart(2, "0")}T17:00:00.000Z`)}, 15, ${sql(number % 2 ? "Library" : "Student Center")}, ${sql(number >= 6 ? "completed" : "scheduled")}, ${sql(number === 5 ? "pending" : "approved")}, ${sql("Fake presentation slot for flow testing.")}, ${sql(projectRow.teacherId)}, ${sql(baseTime)}, ${sql(baseTime)}, ${sql(projectRow.id)});`);
    }
    projectRow.notes.forEach(([authorId, noteBody, noteStatus = "active"], noteIndex) => {
      const archived = noteStatus === "archived";
      statements.push(`INSERT INTO project_notes (id, project_id, author_user_id, body, status, created_at, updated_at, archived_at, archived_by) VALUES (${sql(`demo-note-${number}-${noteIndex + 1}`)}, ${sql(projectRow.id)}, ${sql(authorId)}, ${sql(noteBody)}, ${sql(noteStatus)}, ${sql(baseTime)}, ${sql(baseTime)}, ${archived ? sql(baseTime) : "NULL"}, ${archived ? sql(authorId) : "NULL"});`);
    });
  });

  statements.push(
    `INSERT INTO mentor_assignments (id, mentor_user_id, student_user_id, assigned_by, active, created_at) VALUES ('demo-mentor-assignment-browser-proof', 'test_user_mentor_rivera', 'demo-student-001', 'demo-teacher-it-01', 1, '2026-08-11T16:00:00.000Z');`,
    `INSERT OR IGNORE INTO audit_events (id, actor_user_id, action, entity_type, entity_id, metadata_json) VALUES ('audit-project-demo-reset-2026-09-02', NULL, 'project_demo_data_reset', 'project', NULL, '{"projectCount":8,"onePerPhase":true,"fakeDataOnly":true,"accountsPreserved":true}');`,
  );
  return `${statements.join("\n")}\n`;
}

function adultAssignment(projectRow, number, role, userId, timestamp) {
  return `INSERT INTO project_adult_assignments (id, project_id, site_id, program_id, adult_role, assignee_user_id, status, nominated_by, responded_by, responded_at, created_at, updated_at) VALUES (${sql(`demo-adult-${role}-${number}`)}, ${sql(projectRow.id)}, ${sql(SITE_ID)}, ${sql(projectRow.programId)}, ${sql(role)}, ${sql(userId)}, 'accepted', ${sql(projectRow.students[0])}, ${sql(userId)}, ${sql(timestamp)}, ${sql(timestamp)}, ${sql(timestamp)});`;
}

function statusReason(status) {
  if (status === "submitted") return "The student sent the work for review.";
  if (status === "revision_requested") return "The reviewer asked for one clear change.";
  if (status === "approved") return "The reviewer approved this step.";
  return "The student started this step.";
}

function reviewFeedback(status) {
  return status === "approved"
    ? "This step is clear and complete. Move to the next step."
    : "Add the missing example, then send this step again.";
}

function meetingNote(number) {
  return number <= 2
    ? "Planned check-in. Ask what is working and choose one next step."
    : "The team shared progress, named one problem, and chose one next step.";
}

function exportRemoteBackup(now = new Date()) {
  if (!existsSync(WRANGLER_JS)) throw new Error("Wrangler is not installed.");
  const backupDirectory = path.join(REPO_ROOT, ".secrets", "project-data-backups");
  mkdirSync(backupDirectory, { recursive: true });
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDirectory, `senior-capstone-before-project-reset-${timestamp}.sql`);
  const result = spawnSync(process.execPath, [WRANGLER_JS, "d1", "export", DATABASE_NAME, "--remote", "--output", backupPath], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
    windowsHide: true,
  });
  if (result.status !== 0 || !existsSync(backupPath)) throw new Error("The project reset stopped because the remote backup could not be created.");
  return backupPath;
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

export { CONFIRMATION, PROJECTS, buildResetSeedSql, parseArgs, runReset, verifySeed };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await runReset(parseArgs());
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Project demo reset failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
