#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DemoProofError,
  parseArgs as parseLocalDemoArgs,
  runDemoProof,
} from "./prove-local-demo-workspace.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

function parseArgs(values = process.argv.slice(2)) {
  const args = {
    credentialFile: "",
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--credential-file") {
      args.credentialFile = values[index + 1] || "";
      index += 1;
    } else if (value === "--remote") {
      throw new DemoProofError("REMOTE_REFUSED", "Sales demo local proof is local-only and refuses --remote.");
    } else if (value === "--help" || value === "-h") {
      console.log("Usage: node scripts/prove-sales-demo-local.mjs [--credential-file .secrets/demo-staff-logins-YYYYMMDD-HHMMSS.json]");
      process.exit(0);
    } else {
      throw new DemoProofError("INVALID_ARGUMENTS", `Unknown argument: ${value}`);
    }
  }
  return args;
}

function assertSalesDemoChecks(result) {
  const requiredAdminChecks = [
    "siteDashboardPrimary250",
    "siteDashboardSecondary60",
    "siteStudentDirectoryPrimary250",
    "siteStudentDirectoryPaginationRespected",
    "siteStudentDetailRoleProof",
    "siteReviewQueueRoleProof",
    "siteMentorAssignmentRoleProof",
    "siteOperationsReadinessRoleProof",
    "noAnnouncements",
  ];
  for (const key of requiredAdminChecks) {
    if (!result.admin?.checks?.[key]) {
      throw new DemoProofError("SALES_DEMO_LOCAL_PROOF_FAILED", `Local demo proof did not satisfy ${key}.`);
    }
  }
  const requiredBlocks = [
    ["siteDashboard", result.siteDashboard?.ok],
    ["siteStudentDirectory", result.siteStudentDirectory?.ok],
    ["siteStudentDetail", result.siteStudentDetail?.ok],
    ["siteReviewQueue", result.siteReviewQueue?.ok],
    ["siteMentorAssignments", result.siteMentorAssignments?.ok],
    ["siteOperationsReadiness", result.siteOperationsReadiness?.ok],
  ];
  for (const [label, ok] of requiredBlocks) {
    if (!ok) throw new DemoProofError("SALES_DEMO_LOCAL_PROOF_FAILED", `${label} proof block did not pass.`);
  }
  if (result.multisite?.primarySiteStudents !== 250) {
    throw new DemoProofError("SALES_DEMO_LOCAL_PROOF_FAILED", "Primary site did not prove exactly 250 fake students.");
  }
  const secondaryCounts = Object.values(result.multisite?.secondarySiteCounts || {});
  if (secondaryCounts.length !== 2 || secondaryCounts.some((count) => Number(count) !== 60)) {
    throw new DemoProofError("SALES_DEMO_LOCAL_PROOF_FAILED", "Secondary sites did not prove exactly 60 fake students each.");
  }
  if (!result.siteStudentDetail?.noSensitiveDetailFields
    || !result.siteReviewQueue?.noSensitiveQueueFields
    || !result.siteMentorAssignments?.noSensitiveAssignmentFields
    || !result.siteOperationsReadiness?.noSensitiveOperationsFields) {
    throw new DemoProofError("SALES_DEMO_LOCAL_PROOF_FAILED", "One or more sales demo surfaces failed redaction proof.");
  }
}

function routeSummary(result) {
  return [
    {
      screen: "Site Dashboard",
      route: "/api/site/dashboard",
      status: result.siteDashboard?.ok ? "Proven locally" : "Not proven",
      localProof: "prove:demo:local",
    },
    {
      screen: "Student Directory",
      route: "/api/site/students",
      status: result.siteStudentDirectory?.ok ? "Proven locally" : "Not proven",
      localProof: "prove:demo:local",
    },
    {
      screen: "Student Detail / Timeline",
      route: "/api/site/students/:studentId and /api/site/students/:studentId/timeline",
      status: result.siteStudentDetail?.ok ? "Proven locally" : "Not proven",
      localProof: "prove:demo:local",
    },
    {
      screen: "Review Queue",
      route: "/api/site/review-queue",
      status: result.siteReviewQueue?.ok ? "Proven locally" : "Not proven",
      localProof: "prove:demo:local plus integration mutation tests",
    },
    {
      screen: "Mentor Assignments",
      route: "/api/site/mentor-assignments",
      status: result.siteMentorAssignments?.ok ? "Proven locally" : "Not proven",
      localProof: "prove:demo:local plus integration mutation tests",
    },
    {
      screen: "Operations Readiness",
      route: "/api/site/operations-readiness",
      status: result.siteOperationsReadiness?.ok ? "Proven locally" : "Not proven",
      localProof: "prove:demo:local",
    },
  ];
}

function buildOutput(result) {
  return {
    ok: true,
    proof: "sales_demo_local",
    repo: {
      root: result.repo?.root || REPO_ROOT,
      branch: result.repo?.branch || "main",
      remote: result.repo?.remote || "https://github.com/timmb-lab/SeniorProjectApp1.0.git",
      head: result.repo?.head || "",
    },
    claimStatus: "Proven locally",
    fakeDataOnly: true,
    hostedProofStatus: "Hosted proof blocked until remote D1 migration 0011 and remote fake-data proof are approved.",
    credentialsPrinted: false,
    credentialValuesCommitted: false,
    screenshotsGenerated: false,
    counts: {
      fakeSites: result.multisite?.sites || 0,
      fakeStudentsTotal: result.admin?.studentsTotal || 0,
      primarySiteStudents: result.multisite?.primarySiteStudents || 0,
      secondarySiteCounts: result.multisite?.secondarySiteCounts || {},
      announcements: result.multisite?.announcements || 0,
      studentCredentials: result.multisite?.studentCredentials || 0,
    },
    storyBuckets: result.multisite?.storyBuckets || {},
    routeSurfaceProof: routeSummary(result),
    roleProof: {
      viewerReadOnly: Boolean(result.siteDashboard?.viewerReadOnly
        && result.siteStudentDirectory?.viewerReadOnly
        && result.siteStudentDetail?.viewerReadOnly
        && result.siteReviewQueue?.viewerReadOnly
        && result.siteMentorAssignments?.viewerReadOnly
        && result.siteOperationsReadiness?.viewerReadOnly),
      programTeacherScoped: Boolean(result.siteStudentDirectory?.programTeacherScoped
        && result.siteStudentDetail?.programTeacherScoped
        && result.siteReviewQueue?.programTeacherScoped
        && result.siteOperationsReadiness?.programTeacherScopedReadOnly),
      mentorAssignedOnly: Boolean(result.siteStudentDetail?.mentorAssignedOnly),
    },
    redactionProof: {
      detail: Boolean(result.siteStudentDetail?.noSensitiveDetailFields),
      reviewQueue: Boolean(result.siteReviewQueue?.noSensitiveQueueFields),
      mentorAssignments: Boolean(result.siteMentorAssignments?.noSensitiveAssignmentFields),
      operationsReadiness: Boolean(result.siteOperationsReadiness?.noSensitiveOperationsFields),
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs();
    const proofArgs = parseLocalDemoArgs(args.credentialFile ? ["--credential-file", args.credentialFile] : []);
    const result = await runDemoProof(proofArgs);
    assertSalesDemoChecks(result);
    console.log(JSON.stringify(buildOutput(result), null, 2));
  } catch (error) {
    if (error instanceof DemoProofError) {
      console.error(`Sales demo local proof failed: ${error.classification}: ${error.message}`);
    } else {
      console.error(`Sales demo local proof failed: UNKNOWN: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
}

export {
  assertSalesDemoChecks,
  buildOutput,
  parseArgs,
};
