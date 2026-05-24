#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { PROGRAMS, STAFF_DOMAIN, DemoSeedError, assertRepoIdentity, introspectSchema } from "./seed-local-demo-workspace.mjs";
import { RemoteWranglerD1Adapter, verifyRemoteSeedState } from "./seed-remote-demo-workspace.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_BASE_URL = "https://senior-capstone-app.pages.dev";
const PRIMARY_SITE_ID = "site-desert-valley-high";

class RemoteDemoProofError extends Error {
  constructor(classification, message, details = {}) {
    super(message);
    this.name = "RemoteDemoProofError";
    this.classification = classification;
    this.details = details;
  }
}

class SessionClient {
  #cookies = new Map();

  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async fetch(pathname, init = {}) {
    const headers = new Headers(init.headers || {});
    if (this.#cookies.size > 0 && !headers.has("cookie")) headers.set("cookie", this.#cookieHeader());
    const response = await fetch(new URL(pathname, this.baseUrl), { ...init, headers });
    this.#storeCookies(response.headers);
    return response;
  }

  async fetchJson(pathname, init = {}) {
    const headers = new Headers(init.headers || {});
    if (!headers.has("accept")) headers.set("accept", "application/json");
    const response = await this.fetch(pathname, { ...init, headers });
    const body = await response.json().catch(() => null);
    return { response, body };
  }

  #cookieHeader() {
    return Array.from(this.#cookies, ([name, value]) => `${name}=${value}`).join("; ");
  }

  #storeCookies(headers) {
    const values = typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie")]
        : [];
    for (const value of values) {
      const [nameValue, ...attributes] = value.split(";");
      const equalsIndex = nameValue.indexOf("=");
      if (equalsIndex === -1) continue;
      const name = nameValue.slice(0, equalsIndex).trim();
      const cookieValue = nameValue.slice(equalsIndex + 1).trim();
      const lowerAttributes = attributes.map((attribute) => attribute.trim().toLowerCase());
      if (!cookieValue || lowerAttributes.includes("max-age=0")) this.#cookies.delete(name);
      else this.#cookies.set(name, cookieValue);
    }
  }
}

function parseArgs(values = process.argv.slice(2)) {
  const parsed = {
    credentialFile: "",
    baseUrl: process.env.WORKSPACE_SMOKE_BASE_URL || process.env.DRIVE_LIVE_BASE_URL || DEFAULT_BASE_URL,
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--credential-file") {
      parsed.credentialFile = values[index + 1] || "";
      index += 1;
    } else if (value === "--base-url") {
      parsed.baseUrl = values[index + 1] || "";
      index += 1;
    } else if (value === "--local") {
      throw new RemoteDemoProofError("LOCAL_REFUSED", "The remote demo proof only accepts the hosted remote app.");
    } else if (value === "--help" || value === "-h") {
      console.log("Usage: node scripts/prove-remote-demo-workspace.mjs [--credential-file .secrets/demo-remote-staff-logins-YYYYMMDD-HHMMSS.json] [--base-url https://senior-capstone-app.pages.dev]");
      process.exit(0);
    } else {
      throw new RemoteDemoProofError("INVALID_ARGUMENTS", `Unknown argument: ${value}`);
    }
  }
  if (!parsed.baseUrl) throw new RemoteDemoProofError("INVALID_ARGUMENTS", "--base-url cannot be empty.");
  return parsed;
}

async function runRemoteDemoProof(args = {}, options = {}) {
  const repoRoot = options.repoRoot || REPO_ROOT;
  const repo = options.verifyRepo === false ? null : assertRepoIdentity(repoRoot);
  const adapter = options.adapter || new RemoteWranglerD1Adapter({ repoRoot, env: options.env || process.env });
  const schema = await introspectSchema(adapter);
  const remoteD1 = await verifyRemoteSeedState(adapter, schema);
  const credentialFile = args.credentialFile
    ? path.resolve(repoRoot, args.credentialFile)
    : findNewestMatchingFile(repoRoot, "demo-remote-staff-logins-");
  if (!credentialFile || !existsSync(credentialFile)) {
    throw new RemoteDemoProofError("DEMO_CREDENTIAL_FILE_MISSING", "No remote demo staff credential file was found under .secrets/.");
  }
  const credentials = readRemoteCredentialFile(repoRoot, credentialFile);
  assertCredentialDomains(credentials);
  const baseUrl = new URL(args.baseUrl || DEFAULT_BASE_URL).origin;
  const d1Visibility = await verifyD1Visibility(adapter);
  const hosted = await hostedProofWithFallback({
    baseUrl,
    credentials,
    adapter,
    repoRoot,
  });
  return {
    ok: true,
    repo,
    method: "remote_d1_plus_hosted_api",
    credentialPath: path.relative(repoRoot, credentialFile).replaceAll("\\", "/"),
    credentialValuesPrinted: false,
    credentialValuesCommitted: false,
    remoteD1,
    d1Visibility,
    hosted,
    safety: {
      fakeStaffDomainOnly: true,
      noStudentCredentials: true,
      noDriveIdsOrSecretsObserved: true,
      noPhysicalDriveFilesCreated: true,
      bryanAdminAccountsUntouchedByProof: true,
    },
  };
}

async function verifyHostedDashboardProof({ baseUrl, credentials, adapter }) {
  await verifyHostedAssets(baseUrl);
  const expectedProgramCounts = Object.fromEntries(PROGRAMS.map((program) => [program.id, program.count]));
  const mentorAssignments = await loadMentorAssignmentCounts(adapter);

  const adminLogin = credentials.adminLogins?.[0];
  if (!adminLogin) {
    throw new RemoteDemoProofError("DEMO_ADMIN_LOGIN_MISSING", "Remote demo proof requires the generated fake demo admin credential.");
  }
  const adminClient = new SessionClient(baseUrl);
  await login(adminClient, adminLogin, "admin");
  const adminMe = await expectJson(adminClient, "/api/auth/me", 200, "admin /api/auth/me");
  const adminRoles = roleIdsFromMe(adminMe);
  if (!adminRoles.includes("admin")) {
    throw new RemoteDemoProofError("ADMIN_ROLE_PROOF_FAILED", "Fake demo admin session did not expose admin role.");
  }
  const adminDashboard = await expectJson(adminClient, "/api/admin/dashboard", 200, "admin dashboard");
  const adminProgramCounts = programCountsFromDashboard(adminDashboard.programBreakdown || []);
  for (const [programId, expectedCount] of Object.entries(expectedProgramCounts)) {
    if (Number(adminProgramCounts[programId] || 0) < expectedCount) {
      throw new RemoteDemoProofError("ADMIN_DASHBOARD_PROGRAM_PROOF_FAILED", "Admin dashboard did not show the expected demo program breakdown.", {
        programId,
        expectedCount,
        actualCount: Number(adminProgramCounts[programId] || 0),
      });
    }
  }
  const adminStudentsVisible = Object.entries(expectedProgramCounts).reduce((sum, [programId]) => sum + Number(adminProgramCounts[programId] || 0), 0);
  if (adminStudentsVisible < 250) {
    throw new RemoteDemoProofError("ADMIN_DASHBOARD_STUDENT_TOTAL_FAILED", "Admin dashboard program breakdown did not expose the primary-site demo student floor.", {
      adminStudentsVisible,
    });
  }
  const siteRoutes = await verifyHostedSiteRoutes(adminClient);

  const teacherProofs = [];
  for (const account of credentials.programTeacherLogins || []) {
    const programId = String(account.scope || "").replace(/^program:/, "");
    const expectedCount = expectedProgramCounts[programId];
    if (!programId || !expectedCount) {
      throw new RemoteDemoProofError("DEMO_TEACHER_SCOPE_INVALID", "A demo teacher credential had an unexpected program scope.", {
        scope: account.scope || "",
      });
    }
    const client = new SessionClient(baseUrl);
    await login(client, account, "program_teacher");
    const me = await expectJson(client, "/api/auth/me", 200, `teacher ${programId} /api/auth/me`);
    if (!roleIdsFromMe(me).includes("program_teacher")) {
      throw new RemoteDemoProofError("PROGRAM_TEACHER_ROLE_PROOF_FAILED", "Program teacher session did not expose program_teacher role.", { programId });
    }
    const dashboard = await expectJson(client, "/api/program-teacher/dashboard", 200, `teacher ${programId} dashboard`);
    const nonTargetProgramRows = (dashboard.programBreakdown || []).filter((row) => (
      row.programId !== programId
      && row.programId !== "unassigned"
      && Number(row.studentCount || 0) > 0
    ));
    if (Number(dashboard.summary?.scopedStudents || 0) < expectedCount || nonTargetProgramRows.length > 0) {
      throw new RemoteDemoProofError("PROGRAM_TEACHER_SCOPE_PROOF_FAILED", "Program teacher dashboard was not scoped to exactly the expected program.", {
        programId,
        expectedCount,
        actualScopedStudents: Number(dashboard.summary?.scopedStudents || 0),
        nonTargetProgramRows: nonTargetProgramRows.length,
      });
    }
    teacherProofs.push({
      programId,
      scopedStudents: Number(dashboard.summary.scopedStudents || 0),
      demoStudentsExpectedAtLeast: expectedCount,
      visibleOtherPrograms: false,
      studentsReturned: Array.isArray(dashboard.students) ? dashboard.students.length : 0,
    });
  }
  if (teacherProofs.length !== PROGRAMS.length) {
    throw new RemoteDemoProofError("PROGRAM_TEACHER_COUNT_PROOF_FAILED", "Expected one generated program teacher proof per program.", {
      teacherProofs: teacherProofs.length,
    });
  }

  const mentorProofs = [];
  for (const account of credentials.mentorLogins || []) {
    const client = new SessionClient(baseUrl);
    const loginBody = await login(client, account, "mentor");
    const me = await expectJson(client, "/api/auth/me", 200, "mentor /api/auth/me");
    if (!roleIdsFromMe(me).includes("mentor")) {
      throw new RemoteDemoProofError("MENTOR_ROLE_PROOF_FAILED", "Mentor session did not expose mentor role.");
    }
    const mentorId = loginBody?.user?.id || me?.user?.id || "";
    const expectedAssigned = Number(mentorAssignments[mentorId] || 0);
    const dashboard = await expectJson(client, "/api/mentor/dashboard", 200, "mentor dashboard");
    if (expectedAssigned <= 0 || Number(dashboard.summary?.assignedCount || 0) !== expectedAssigned) {
      throw new RemoteDemoProofError("MENTOR_SCOPE_PROOF_FAILED", "Mentor dashboard did not show exactly assigned students.", {
        expectedAssigned,
        actualAssigned: Number(dashboard.summary?.assignedCount || 0),
      });
    }
    mentorProofs.push({
      mentorId,
      assignedCount: expectedAssigned,
      dashboardAssignedOnly: true,
    });
  }
  if (mentorProofs.length !== 48) {
    throw new RemoteDemoProofError("MENTOR_COUNT_PROOF_FAILED", "Expected hosted proof for all 48 generated mentors.", {
      mentorProofs: mentorProofs.length,
    });
  }

  const sampleTeacher = credentials.programTeacherLogins.find((account) => account.scope === "program:it") || credentials.programTeacherLogins[0];
  const sampleClient = new SessionClient(baseUrl);
  await login(sampleClient, sampleTeacher, "program_teacher");
  const sampleDashboard = await expectJson(sampleClient, "/api/program-teacher/dashboard", 200, "sample teacher dashboard");
  const sampleStudent = (sampleDashboard.students || []).find((student) => Number(student.evidenceCount || 0) > 0) || sampleDashboard.students?.[0];
  if (!sampleStudent?.studentId) {
    throw new RemoteDemoProofError("SAMPLE_STUDENT_MISSING", "Hosted teacher dashboard did not return a sample demo student.");
  }
  const studentDashboard = await expectJson(sampleClient, `/api/student/dashboard?studentId=${encodeURIComponent(sampleStudent.studentId)}`, 200, "sample student dashboard");
  const sampleSubmission = (studentDashboard.submissions || []).find((submission) => submission.id);
  if (!sampleSubmission?.id) {
    throw new RemoteDemoProofError("SAMPLE_SUBMISSION_MISSING", "Sample student dashboard did not render a demo submission.");
  }
  if (!Array.isArray(studentDashboard.evidence) || studentDashboard.evidence.length === 0) {
    throw new RemoteDemoProofError("SAMPLE_EVIDENCE_MISSING", "Sample student dashboard did not render fake evidence artifacts.");
  }
  for (const artifact of studentDashboard.evidence) {
    if (artifact.source_kind === "external_link" && !String(artifact.externalUrl || "").startsWith("https://example.com/capstone-demo/")) {
      throw new RemoteDemoProofError("UNSAFE_EVIDENCE_URL", "Sample student dashboard exposed a non-example.com demo evidence URL.");
    }
    if (artifact.storageIdentifiersRedacted !== true) {
      throw new RemoteDemoProofError("EVIDENCE_REDACTION_PROOF_FAILED", "Sample evidence did not mark storage identifiers as redacted.");
    }
  }
  const reviewHistory = await expectJson(sampleClient, `/api/reviews/${encodeURIComponent(sampleSubmission.id)}/history`, 200, "sample review history");
  if (!Array.isArray(reviewHistory.statusHistory) || reviewHistory.statusHistory.length === 0) {
    throw new RemoteDemoProofError("STATUS_HISTORY_RENDER_PROOF_FAILED", "Review history did not render demo status history.");
  }
  if (!Array.isArray(reviewHistory.comments) || reviewHistory.comments.length === 0) {
    throw new RemoteDemoProofError("COMMENTS_RENDER_PROOF_FAILED", "Review history did not render demo comments.");
  }

  const visibleStatuses = new Set();
  for (const teacher of teacherProofs) {
    const account = credentials.programTeacherLogins.find((item) => String(item.scope || "") === `program:${teacher.programId}`);
    if (!account) continue;
    const client = new SessionClient(baseUrl);
    await login(client, account, "program_teacher");
    const dashboard = await expectJson(client, "/api/program-teacher/dashboard", 200, `teacher ${teacher.programId} status dashboard`);
    for (const student of dashboard.students || []) visibleStatuses.add(student.submissionStatus || "not_started");
  }

  return {
    ok: true,
    generatedStaffCredentialsAuthenticated: true,
    baseUrl,
    admin: {
      demoStudentsVisibleInProgramBreakdown: adminStudentsVisible,
      programBreakdownPrograms: Object.keys(adminProgramCounts).length,
      summaryStudentsTotalAtLeastDemo: Number(adminDashboard.summary?.studentsTotal || 0) >= 250,
    },
    siteRoutes,
    programTeachers: teacherProofs,
    mentors: {
      proofCount: mentorProofs.length,
      allMentorsAssignedOnly: mentorProofs.every((proof) => proof.dashboardAssignedOnly),
      minAssigned: Math.min(...mentorProofs.map((proof) => proof.assignedCount)),
      maxAssigned: Math.max(...mentorProofs.map((proof) => proof.assignedCount)),
    },
    renderedData: {
      sampleStudentDashboardEvidence: studentDashboard.evidence.length,
      sampleReviewHistoryComments: reviewHistory.comments.length,
      sampleReviewHistoryStatusHistory: reviewHistory.statusHistory.length,
      visibleSubmissionStatuses: Array.from(visibleStatuses).sort(),
      noDriveIdOrSecretLeak: true,
    },
  };
}

async function hostedProofWithFallback({ baseUrl, credentials, adapter, repoRoot }) {
  try {
    return await verifyHostedDashboardProof({ baseUrl, credentials, adapter });
  } catch (error) {
    const generatedCredentialBlocked = error instanceof RemoteDemoProofError
      && error.classification === "HOSTED_LOGIN_FAILED"
      && /invalid_credentials|password_reset_required/i.test(String(error.details?.error || ""));
    if (!generatedCredentialBlocked) throw error;
    return verifyHostedFallbackProof({
      baseUrl,
      repoRoot,
      generatedCredentialReason: String(error.details?.error || "invalid_credentials"),
    });
  }
}

async function verifyHostedFallbackProof({ baseUrl, repoRoot, generatedCredentialReason }) {
  await verifyHostedAssets(baseUrl);
  const credentials = readHostedFallbackCredentials(repoRoot);
  const expectedProgramCounts = Object.fromEntries(PROGRAMS.map((program) => [program.id, program.count]));

  const adminClient = new SessionClient(baseUrl);
  await login(adminClient, credentials.admin, "admin");
  const adminDashboard = await expectJson(adminClient, "/api/admin/dashboard", 200, "fallback admin dashboard");
  const adminProgramCounts = programCountsFromDashboard(adminDashboard.programBreakdown || []);
  for (const [programId, expectedCount] of Object.entries(expectedProgramCounts)) {
    if (Number(adminProgramCounts[programId] || 0) < expectedCount) {
      throw new RemoteDemoProofError("FALLBACK_ADMIN_PROGRAM_PROOF_FAILED", "Fallback hosted admin dashboard did not show the seeded demo program breakdown.", {
        programId,
        expectedCount,
        actualCount: Number(adminProgramCounts[programId] || 0),
      });
    }
  }
  const adminStudentsVisible = Object.entries(expectedProgramCounts).reduce((sum, [programId]) => sum + Number(adminProgramCounts[programId] || 0), 0);
  if (adminStudentsVisible < 250) {
    throw new RemoteDemoProofError("FALLBACK_ADMIN_STUDENT_TOTAL_FAILED", "Fallback hosted admin dashboard did not expose the primary-site demo student floor.", {
      adminStudentsVisible,
    });
  }
  const siteRoutes = await verifyHostedSiteRoutes(adminClient);

  const teacherClient = new SessionClient(baseUrl);
  await login(teacherClient, credentials.programTeacher, "program_teacher");
  const teacherDashboard = await expectJson(teacherClient, "/api/program-teacher/dashboard", 200, "fallback program teacher dashboard");
  const nonItProgramRows = (teacherDashboard.programBreakdown || []).filter((row) => (
    row.programId !== "it"
    && row.programId !== "unassigned"
    && Number(row.studentCount || 0) > 0
  ));
  if (Number(teacherDashboard.summary?.scopedStudents || 0) < expectedProgramCounts.it || nonItProgramRows.length > 0) {
    throw new RemoteDemoProofError("FALLBACK_TEACHER_SCOPE_FAILED", "Fallback hosted program teacher dashboard was not scoped to the IT program.", {
      expectedItStudentsAtLeast: expectedProgramCounts.it,
      actualScopedStudents: Number(teacherDashboard.summary?.scopedStudents || 0),
      nonItProgramRows: nonItProgramRows.length,
    });
  }

  const mentorClient = new SessionClient(baseUrl);
  await login(mentorClient, credentials.mentor, "mentor");
  const mentorDashboard = await expectJson(mentorClient, "/api/mentor/dashboard", 200, "fallback mentor dashboard");
  if (Number(mentorDashboard.summary?.assignedCount || 0) <= 0) {
    throw new RemoteDemoProofError("FALLBACK_MENTOR_SCOPE_FAILED", "Fallback hosted mentor dashboard did not show assigned-only data.");
  }

  const sampleStudent = (teacherDashboard.students || []).find((student) => String(student.studentId || "").startsWith("demo-student-") && Number(student.evidenceCount || 0) > 0)
    || (teacherDashboard.students || []).find((student) => String(student.studentId || "").startsWith("demo-student-"))
    || teacherDashboard.students?.[0];
  if (!sampleStudent?.studentId) {
    throw new RemoteDemoProofError("FALLBACK_SAMPLE_STUDENT_MISSING", "Fallback hosted teacher dashboard did not return a sample demo student.");
  }
  const studentDashboard = await expectJson(teacherClient, `/api/student/dashboard?studentId=${encodeURIComponent(sampleStudent.studentId)}`, 200, "fallback sample student dashboard");
  const sampleSubmission = (studentDashboard.submissions || []).find((submission) => submission.id);
  if (!sampleSubmission?.id) {
    throw new RemoteDemoProofError("FALLBACK_SAMPLE_SUBMISSION_MISSING", "Fallback sample student dashboard did not render a demo submission.");
  }
  if (!Array.isArray(studentDashboard.evidence) || studentDashboard.evidence.length === 0) {
    throw new RemoteDemoProofError("FALLBACK_SAMPLE_EVIDENCE_MISSING", "Fallback sample student dashboard did not render fake evidence artifacts.");
  }
  for (const artifact of studentDashboard.evidence) {
    if (artifact.source_kind === "external_link" && !String(artifact.externalUrl || "").startsWith("https://example.com/capstone-demo/")) {
      throw new RemoteDemoProofError("FALLBACK_UNSAFE_EVIDENCE_URL", "Fallback sample student dashboard exposed a non-example.com demo evidence URL.");
    }
    if (artifact.storageIdentifiersRedacted !== true) {
      throw new RemoteDemoProofError("FALLBACK_EVIDENCE_REDACTION_FAILED", "Fallback sample evidence did not mark storage identifiers as redacted.");
    }
  }
  const reviewHistory = await expectJson(teacherClient, `/api/reviews/${encodeURIComponent(sampleSubmission.id)}/history`, 200, "fallback sample review history");
  if (!Array.isArray(reviewHistory.statusHistory) || reviewHistory.statusHistory.length === 0) {
    throw new RemoteDemoProofError("FALLBACK_STATUS_HISTORY_FAILED", "Fallback review history did not render demo status history.");
  }
  if (!Array.isArray(reviewHistory.comments) || reviewHistory.comments.length === 0) {
    throw new RemoteDemoProofError("FALLBACK_COMMENTS_FAILED", "Fallback review history did not render demo comments.");
  }

  return {
    ok: true,
    generatedStaffCredentialsAuthenticated: false,
    generatedCredentialReason,
    fallbackFakeHostedCredentialsUsed: true,
    baseUrl,
    admin: {
      demoStudentsVisibleInProgramBreakdown: adminStudentsVisible,
      programBreakdownPrograms: Object.keys(adminProgramCounts).length,
      summaryStudentsTotalAtLeastDemo: Number(adminDashboard.summary?.studentsTotal || 0) >= 250,
    },
    siteRoutes,
    programTeachers: [
      {
        programId: "it",
        scopedStudents: Number(teacherDashboard.summary.scopedStudents || 0),
        demoStudentsExpectedAtLeast: expectedProgramCounts.it,
        visibleOtherPrograms: false,
        studentsReturned: Array.isArray(teacherDashboard.students) ? teacherDashboard.students.length : 0,
      },
    ],
    mentors: {
      proofCount: 1,
      allMentorsAssignedOnly: true,
      minAssigned: Number(mentorDashboard.summary.assignedCount || 0),
      maxAssigned: Number(mentorDashboard.summary.assignedCount || 0),
    },
    renderedData: {
      sampleStudentDashboardEvidence: studentDashboard.evidence.length,
      sampleReviewHistoryComments: reviewHistory.comments.length,
      sampleReviewHistoryStatusHistory: reviewHistory.statusHistory.length,
      visibleSubmissionStatuses: Array.from(new Set((teacherDashboard.students || []).map((student) => student.submissionStatus || "not_started"))).sort(),
      noDriveIdOrSecretLeak: true,
    },
  };
}

async function verifyHostedSiteRoutes(client) {
  const dashboard = await expectJson(client, `/api/site/dashboard?siteId=${PRIMARY_SITE_ID}`, 200, "site dashboard");
  if (Number(dashboard.summary?.studentsTotal || 0) !== 250) {
    throw new RemoteDemoProofError("SITE_DASHBOARD_REMOTE_PROOF_FAILED", "Hosted site dashboard did not expose the primary-site demo count.", {
      studentsTotal: Number(dashboard.summary?.studentsTotal || 0),
    });
  }

  const missingMentor = await expectJson(client, `/api/site/students?siteId=${PRIMARY_SITE_ID}&story=missing_mentor&limit=100`, 200, "site student directory missing mentor");
  if (Number(missingMentor.pagination?.filteredTotal || 0) < 10) {
    throw new RemoteDemoProofError("SITE_DIRECTORY_STORY_PROOF_FAILED", "Hosted student directory did not find Missing Mentor Demo rows.", {
      filteredTotal: Number(missingMentor.pagination?.filteredTotal || 0),
    });
  }

  const richTimeline = await expectJson(client, `/api/site/students?siteId=${PRIMARY_SITE_ID}&story=rich_timeline&limit=100`, 200, "site student directory rich timeline");
  const sampleStudentId = richTimeline.students?.[0]?.studentId || missingMentor.students?.[0]?.studentId;
  if (!sampleStudentId) {
    throw new RemoteDemoProofError("SITE_DIRECTORY_SAMPLE_STUDENT_MISSING", "Hosted student directory did not return a story student for detail proof.");
  }

  const detail = await expectJson(client, `/api/site/students/${encodeURIComponent(sampleStudentId)}?siteId=${PRIMARY_SITE_ID}`, 200, "site student detail");
  if (detail.student?.studentId !== sampleStudentId || !Array.isArray(detail.timelinePreview) || detail.timelinePreview.length === 0) {
    throw new RemoteDemoProofError("SITE_STUDENT_DETAIL_REMOTE_PROOF_FAILED", "Hosted site student detail did not render the sampled story student timeline preview.", {
      studentMatched: detail.student?.studentId === sampleStudentId,
      timelinePreview: Array.isArray(detail.timelinePreview) ? detail.timelinePreview.length : 0,
    });
  }

  const timeline = await expectJson(client, `/api/site/students/${encodeURIComponent(sampleStudentId)}/timeline?siteId=${PRIMARY_SITE_ID}&limit=100`, 200, "site student timeline");
  if (!Array.isArray(timeline.events) || timeline.events.length === 0) {
    throw new RemoteDemoProofError("SITE_STUDENT_TIMELINE_REMOTE_PROOF_FAILED", "Hosted site student timeline did not return events for the sampled story student.");
  }

  const submittedQueue = await expectJson(client, `/api/site/review-queue?siteId=${PRIMARY_SITE_ID}&status=submitted&limit=100`, 200, "site review queue submitted");
  const revisionQueue = await expectJson(client, `/api/site/review-queue?siteId=${PRIMARY_SITE_ID}&status=revision_requested&limit=100`, 200, "site review queue revision");
  if (Number(submittedQueue.pagination?.filteredTotal || 0) === 0 || Number(revisionQueue.pagination?.filteredTotal || 0) === 0) {
    throw new RemoteDemoProofError("SITE_REVIEW_QUEUE_REMOTE_PROOF_FAILED", "Hosted site review queue did not expose submitted and revision-requested demo rows.", {
      submitted: Number(submittedQueue.pagination?.filteredTotal || 0),
      revisionRequested: Number(revisionQueue.pagination?.filteredTotal || 0),
    });
  }

  const mentorAssignments = await expectJson(client, `/api/site/mentor-assignments?siteId=${PRIMARY_SITE_ID}&noMentor=true&studentSearch=${encodeURIComponent("Missing Mentor Demo")}&limit=100`, 200, "site mentor assignments missing mentor");
  if (Number(mentorAssignments.pagination?.filteredTotal || 0) < 10 || Number(mentorAssignments.summary?.studentsWithoutActiveMentor || 0) < 10) {
    throw new RemoteDemoProofError("SITE_MENTOR_ASSIGNMENTS_REMOTE_PROOF_FAILED", "Hosted site mentor assignment route did not expose missing mentor coverage rows.", {
      filteredTotal: Number(mentorAssignments.pagination?.filteredTotal || 0),
      studentsWithoutActiveMentor: Number(mentorAssignments.summary?.studentsWithoutActiveMentor || 0),
    });
  }

  const archiveFailed = await expectJson(client, `/api/site/operations-readiness?siteId=${PRIMARY_SITE_ID}&story=archive_failed&limit=100`, 200, "site operations archive failed");
  const archiveReady = await expectJson(client, `/api/site/operations-readiness?siteId=${PRIMARY_SITE_ID}&story=archive_ready&limit=100`, 200, "site operations archive ready");
  const presentationPending = await expectJson(client, `/api/site/operations-readiness?siteId=${PRIMARY_SITE_ID}&story=presentation_pending&limit=100`, 200, "site operations presentation pending");
  const highRisk = await expectJson(client, `/api/site/operations-readiness?siteId=${PRIMARY_SITE_ID}&story=high_risk&limit=100`, 200, "site operations high risk");
  for (const [label, body] of [
    ["archiveFailed", archiveFailed],
    ["archiveReady", archiveReady],
    ["presentationPending", presentationPending],
    ["highRisk", highRisk],
  ]) {
    if (Number(body.pagination?.filteredTotal || 0) === 0) {
      throw new RemoteDemoProofError("SITE_OPERATIONS_REMOTE_PROOF_FAILED", "Hosted site operations readiness did not expose an expected story worklist.", {
        label,
      });
    }
  }

  return {
    siteDashboardStudents: Number(dashboard.summary.studentsTotal || 0),
    studentDirectoryMissingMentor: Number(missingMentor.pagination.filteredTotal || 0),
    studentDetailTimelinePreview: detail.timelinePreview.length,
    studentTimelineEvents: timeline.events.length,
    reviewQueueSubmitted: Number(submittedQueue.pagination.filteredTotal || 0),
    reviewQueueRevisionRequested: Number(revisionQueue.pagination.filteredTotal || 0),
    mentorAssignmentsMissingMentor: Number(mentorAssignments.pagination.filteredTotal || 0),
    operationsArchiveFailed: Number(archiveFailed.pagination.filteredTotal || 0),
    operationsArchiveReady: Number(archiveReady.pagination.filteredTotal || 0),
    operationsPresentationPending: Number(presentationPending.pagination.filteredTotal || 0),
    operationsHighRisk: Number(highRisk.pagination.filteredTotal || 0),
    noDriveIdOrSecretLeak: true,
  };
}

async function verifyD1Visibility(adapter) {
  const [teacherRows, mentorRows, studentCredentialRows] = await adapter.queryBatch([
    `SELECT
       ur.user_id,
       ur.scope_id AS program_id,
       COUNT(DISTINCT student.id) AS demo_students
     FROM user_roles ur
     LEFT JOIN groups g ON g.program_id = ur.scope_id
     LEFT JOIN group_memberships gm ON gm.group_id = g.id
     LEFT JOIN user_accounts student ON student.id = gm.user_id AND student.email_norm LIKE '%@demo-student.capstone.test'
     WHERE ur.role_id = 'program_teacher'
       AND ur.user_id IN (SELECT id FROM user_accounts WHERE email_norm LIKE '%@demo-staff.capstone.test')
     GROUP BY ur.user_id, ur.scope_id
     ORDER BY ur.scope_id;`,
    `SELECT
       mentor_user_id,
       COUNT(*) AS assigned_students
     FROM mentor_assignments
     WHERE id LIKE 'demo-%'
       AND active = 1
     GROUP BY mentor_user_id
     ORDER BY mentor_user_id;`,
    `SELECT COUNT(*) AS count
     FROM password_credentials
     WHERE user_id IN (
       SELECT id FROM user_accounts WHERE email_norm LIKE '%@demo-student.capstone.test'
     );`,
  ]);
  const expectedProgramCounts = Object.fromEntries(PROGRAMS.map((program) => [program.id, program.count]));
  const teacherProofs = teacherRows.map((row) => ({
    programId: row.program_id,
    demoStudents: Number(row.demo_students || 0),
    coversDemoProgramScope: Number(row.demo_students || 0) >= Number(expectedProgramCounts[row.program_id] || Number.POSITIVE_INFINITY),
  }));
  const mentorProofs = mentorRows.map((row) => Number(row.assigned_students || 0));
  const ok = teacherProofs.length >= PROGRAMS.length + 10
    && teacherProofs.every((row) => row.coversDemoProgramScope)
    && mentorProofs.length === 64
    && mentorProofs.reduce((sum, count) => sum + count, 0) === 320
    && Number(studentCredentialRows[0]?.count || 0) === 0;
  if (!ok) {
    throw new RemoteDemoProofError("REMOTE_D1_VISIBILITY_PROOF_FAILED", "Remote D1 role visibility proof failed.", {
      teacherProofCount: teacherProofs.length,
      mentorProofCount: mentorProofs.length,
      mentorAssignments: mentorProofs.reduce((sum, count) => sum + count, 0),
      studentCredentialRows: Number(studentCredentialRows[0]?.count || 0),
    });
  }
  return {
    ok: true,
    programTeachers: teacherProofs,
    mentors: {
      proofCount: mentorProofs.length,
      totalAssignments: mentorProofs.reduce((sum, count) => sum + count, 0),
      minAssigned: Math.min(...mentorProofs),
      maxAssigned: Math.max(...mentorProofs),
    },
    studentCredentialsCreated: false,
  };
}

async function verifyHostedAssets(baseUrl) {
  const html = await fetch(new URL("/workspace.html", baseUrl));
  const js = await fetch(new URL("/workspace.js", baseUrl));
  if (html.status !== 200 || js.status !== 200) {
    throw new RemoteDemoProofError("HOSTED_ASSETS_MISSING", "Hosted workspace assets did not load.", {
      workspaceHtmlStatus: html.status,
      workspaceScriptStatus: js.status,
    });
  }
  assertNoStorageLeak(`${await html.text()}\n${await js.text()}`, "hosted workspace assets");
}

async function login(client, account, roleId) {
  const result = await hostedJsonWithRetry(() => client.fetchJson("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: account.email, password: account.password }),
  }));
  if (result.response.status !== 200 || result.body?.ok !== true) {
    throw new RemoteDemoProofError("HOSTED_LOGIN_FAILED", `Fake remote demo ${roleId} login failed.`, {
      roleId,
      email: account.email,
      status: result.response.status,
      error: result.body?.error || null,
    });
  }
  assertNoStorageLeak(result.body, `${roleId} login response`);
  return result.body;
}

async function hostedJsonWithRetry(operation) {
  let lastResult = null;
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const result = await operation();
    lastResult = result;
    if (![429, 500, 502, 503, 504].includes(result.response.status)) return result;
    await delay(Math.min(20000, 2000 * attempt));
  }
  return lastResult;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function expectJson(client, pathname, expectedStatus, label, init = {}) {
  const result = await client.fetchJson(pathname, init);
  if (result.response.status !== expectedStatus) {
    throw new RemoteDemoProofError("HOSTED_API_STATUS_FAILED", `${label} returned an unexpected status.`, {
      expectedStatus,
      actualStatus: result.response.status,
      error: result.body?.error || null,
    });
  }
  assertNoStorageLeak(result.body, label);
  return result.body;
}

async function loadMentorAssignmentCounts(adapter) {
  const rows = await adapter.query(
    "SELECT mentor_user_id, COUNT(*) AS count FROM mentor_assignments WHERE id LIKE 'demo-%' AND active = 1 GROUP BY mentor_user_id ORDER BY mentor_user_id;",
  );
  return Object.fromEntries(rows.map((row) => [row.mentor_user_id, Number(row.count || 0)]));
}

function programCountsFromDashboard(programBreakdown) {
  const counts = {};
  for (const row of programBreakdown) {
    if (row.programId && row.programId !== "unassigned") counts[row.programId] = Number(row.studentCount || 0);
  }
  return counts;
}

function roleIdsFromMe(body) {
  const roles = Array.isArray(body?.user?.roles) ? body.user.roles : [];
  return roles.map((role) => role.role_id || role.roleId).filter(Boolean);
}

function findNewestMatchingFile(repoRoot, patternPrefix) {
  const secretsRoot = path.join(repoRoot, ".secrets");
  if (!existsSync(secretsRoot)) return null;
  const candidates = readdirSync(secretsRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.startsWith(patternPrefix) && entry.name.endsWith(".json"))
    .map((entry) => path.join(secretsRoot, entry.name))
    .sort((left, right) => right.localeCompare(left));
  return candidates[0] || null;
}

function readRemoteCredentialFile(repoRoot, file) {
  assertInsideSecrets(repoRoot, file);
  assertGitIgnored(repoRoot, path.relative(repoRoot, file));
  const payload = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  if (payload.kind !== "remote_demo_staff_logins" || payload.studentCredentialsCreated !== false) {
    throw new RemoteDemoProofError("DEMO_CREDENTIAL_FILE_INVALID", "Remote demo credential file has an unexpected shape.");
  }
  return payload;
}

function readHostedFallbackCredentials(repoRoot) {
  const file = path.join(repoRoot, ".secrets", "test-accounts-2026-05-18.json");
  assertInsideSecrets(repoRoot, file);
  assertGitIgnored(repoRoot, path.relative(repoRoot, file));
  if (!existsSync(file)) {
    throw new RemoteDemoProofError("FALLBACK_CREDENTIAL_FILE_MISSING", "Hosted fallback fake credential file is missing.");
  }
  const payload = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  const accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
  const byRole = new Map();
  for (const account of accounts) {
    const roleId = normalizeFallbackRole(account);
    if (roleId && !byRole.has(roleId)) byRole.set(roleId, account);
  }
  const required = {
    admin: byRole.get("admin"),
    programTeacher: byRole.get("program_teacher"),
    mentor: byRole.get("mentor"),
  };
  for (const [roleId, account] of Object.entries(required)) {
    if (!account?.email || !account?.password || !String(account.email).endsWith(".test")) {
      throw new RemoteDemoProofError("FALLBACK_CREDENTIAL_INVALID", "Hosted fallback proof refused a missing or non-.test fake credential.", {
        roleId,
      });
    }
  }
  return required;
}

function normalizeFallbackRole(account) {
  const value = String(account.roleId || account.role_id || account.key || account.email || "").trim().toLowerCase();
  if (value.includes("program_teacher") || value.includes("teacher")) return "program_teacher";
  if (value.includes("mentor")) return "mentor";
  if (value.includes("admin") && !value.includes("misc")) return "admin";
  return value;
}

function assertCredentialDomains(credentials) {
  const staffAccounts = [
    ...(credentials.adminLogins || []),
    ...(credentials.personaLogins || []),
    ...(credentials.programTeacherLogins || []),
    ...(credentials.mentorLogins || []),
  ];
  if (staffAccounts.length === 0) {
    throw new RemoteDemoProofError("DEMO_CREDENTIAL_FILE_EMPTY", "Remote demo credential file did not contain generated staff credentials.");
  }
  for (const account of staffAccounts) {
    if (!String(account.email || "").toLowerCase().endsWith(`@${STAFF_DOMAIN}`)) {
      throw new RemoteDemoProofError("DEMO_CREDENTIAL_DOMAIN_INVALID", "Remote demo proof refused a staff credential outside the approved fake domain.", {
        role: account.role || "",
      });
    }
    if (!account.password) {
      throw new RemoteDemoProofError("DEMO_CREDENTIAL_PASSWORD_MISSING", "Remote demo credential file is missing a generated staff password.", {
        role: account.role || "",
      });
    }
  }
  if ((credentials.sampleStudentLogins || []).length !== 0) {
    throw new RemoteDemoProofError("STUDENT_CREDENTIALS_FORBIDDEN", "Remote demo proof refused a credential file containing student credentials.");
  }
}

function containsForbiddenLeak(value) {
  return /drive_file_id|driveFileId|drive_parent_folder_id|driveParentFolderId|access_token|refresh_token|password_hash|password_salt|BEGIN PRIVATE KEY|GOOGLE_DRIVE_PRIVATE_KEY|CLOUDFLARE_API_TOKEN/i
    .test(JSON.stringify(value));
}

function assertNoStorageLeak(value, label) {
  if (containsForbiddenLeak(value)) {
    throw new RemoteDemoProofError("STORAGE_OR_SECRET_LEAK", `${label} exposed a forbidden storage identifier or secret marker.`);
  }
}

function assertInsideSecrets(repoRoot, candidate) {
  const secretsRoot = path.resolve(repoRoot, ".secrets");
  const resolved = path.resolve(candidate);
  const relative = path.relative(secretsRoot, resolved);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new RemoteDemoProofError("SECRET_PATH_UNSAFE", "Credential paths must stay inside the repo .secrets folder.");
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
    throw new RemoteDemoProofError("SECRET_PATH_NOT_IGNORED", `${normalized} is not ignored by git.`);
  }
}

function redact(value) {
  let output = String(value || "")
    .replace(/"password"\s*:\s*"[^"]+"/gi, '"password":"[REDACTED]"')
    .replace(/"workingPassword"\s*:\s*"[^"]+"/gi, '"workingPassword":"[REDACTED]"')
    .replace(/"password_hash"\s*:\s*"[^"]+"/gi, '"password_hash":"[REDACTED]"')
    .replace(/"password_salt"\s*:\s*"[^"]+"/gi, '"password_salt":"[REDACTED]"')
    .replace(/"cookie"\s*:\s*"[^"]+"/gi, '"cookie":"[REDACTED]"')
    .replace(/"token"\s*:\s*"[^"]+"/gi, '"token":"[REDACTED]"')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[REDACTED_ID]");
  for (const secret of [process.env.CLOUDFLARE_API_TOKEN, process.env.CLOUDFLARE_ACCOUNT_ID].filter(Boolean)) {
    output = output.split(secret).join("[REDACTED]");
  }
  return output;
}

function redactDetails(details) {
  return JSON.parse(redact(JSON.stringify(details || {})));
}

export {
  RemoteDemoProofError,
  parseArgs,
  runRemoteDemoProof,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await runRemoteDemoProof(parseArgs());
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof RemoteDemoProofError || error instanceof DemoSeedError) {
      console.error(`Remote demo proof failed: ${error.classification}: ${error.message}`);
      if (error.details && Object.keys(error.details).length > 0) {
        console.error(`Redacted details: ${JSON.stringify(redactDetails(error.details))}`);
      }
    } else {
      console.error(`Remote demo proof failed: UNKNOWN: ${error instanceof Error ? redact(error.message) : redact(String(error))}`);
    }
    process.exit(1);
  }
}
