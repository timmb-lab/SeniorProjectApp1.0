import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAlphaAction,
  createAlphaSeedState,
  deriveAlphaNextStep,
  deriveAlphaWalkthroughSteps,
  deriveMetrics,
} from "../functions/_lib/alpha-flow-model.js";

test("alpha seed starts with demo records and no production auth dependency", () => {
  const state = createAlphaSeedState();
  assert.equal(state.mode, "day-7-alpha");
  assert.equal(state.personas.length, 5);
  assert.equal(state.proposal.status, "draft");
  assert.equal(state.evidenceProvider.fileBytesReady, false);
  assert.equal(deriveMetrics(state).evidenceCount, 1);
  const walkthrough = deriveAlphaWalkthroughSteps(state);
  assert.equal(walkthrough.length, 8);
  assert.equal(walkthrough.find((step) => step.id === "submit").status, "ready");
  assert.equal(walkthrough.find((step) => step.id === "meeting").status, "locked");
  const nextStep = deriveAlphaNextStep(state);
  assert.equal(nextStep.id, "submit");
  assert.equal(nextStep.personaId, "student");
  assert.equal(nextStep.action, "submit_proposal");
});

test("student to teacher revision to approval loop updates state and audit", () => {
  let state = createAlphaSeedState();

  ({ state } = applyAlphaAction(state, {
    personaId: "student",
    action: "submit_proposal",
  }, "2026-05-18T12:01:00.000Z"));
  assert.equal(state.proposal.status, "submitted");
  assert.equal(state.versions.length, 1);

  ({ state } = applyAlphaAction(state, {
    personaId: "program_teacher",
    action: "request_revision",
  }, "2026-05-18T12:02:00.000Z"));
  assert.equal(state.proposal.status, "revision_requested");
  assert.equal(deriveMetrics(state).revisionCount, 1);
  assert.equal(state.comments.length, 1);

  ({ state } = applyAlphaAction(state, {
    personaId: "student",
    action: "resubmit_revision",
  }, "2026-05-18T12:03:00.000Z"));
  assert.equal(state.proposal.status, "submitted");
  assert.equal(state.proposal.version, 2);
  assert.equal(state.versions.length, 2);

  ({ state } = applyAlphaAction(state, {
    personaId: "program_teacher",
    action: "approve_submission",
  }, "2026-05-18T12:04:00.000Z"));
  assert.equal(state.proposal.status, "approved");
  assert.equal(deriveMetrics(state).approvedCount, 1);
  assert.ok(state.audit.some((event) => event.action === "approve_submission"));
  assert.equal(state.statusHistory.length, 4);
});

test("alpha review history preserves comments, status timeline, and versions without storage identifiers", () => {
  let state = createAlphaSeedState();

  ({ state } = applyAlphaAction(state, {
    personaId: "student",
    action: "submit_proposal",
  }, "2026-05-18T12:01:00.000Z"));
  ({ state } = applyAlphaAction(state, {
    personaId: "program_teacher",
    action: "request_revision",
  }, "2026-05-18T12:02:00.000Z"));
  ({ state } = applyAlphaAction(state, {
    personaId: "student",
    action: "resubmit_revision",
  }, "2026-05-18T12:03:00.000Z"));
  ({ state } = applyAlphaAction(state, {
    personaId: "program_teacher",
    action: "approve_submission",
  }, "2026-05-18T12:04:00.000Z"));

  assert.deepEqual(state.versions.map((version) => version.version), [2, 1]);
  assert.equal(state.comments.length, 2);
  assert.match(state.comments[0].body, /Approved/);
  assert.deepEqual(state.statusHistory.map((entry) => entry.toStatus), [
    "approved",
    "submitted",
    "revision_requested",
    "submitted",
  ]);
  assert.ok(state.versions.every((version) => version.evidence.every((item) => item.title && item.sourceKind && item.reviewStatus)));

  const serializedHistory = JSON.stringify({
    comments: state.comments,
    versions: state.versions,
    statusHistory: state.statusHistory,
  });
  assert.doesNotMatch(serializedHistory, /drive[_A-Za-z]*id|storage(Key|Id)/i);
});

test("permission denial is explicit and audited", () => {
  const seed = createAlphaSeedState();
  const { state, result } = applyAlphaAction(seed, {
    personaId: "misc_admin",
    action: "approve_submission",
  }, "2026-05-18T12:05:00.000Z");

  assert.equal(result.ok, false);
  assert.equal(result.status, 403);
  assert.equal(state.proposal.status, "draft");
  assert.equal(state.audit[0].entity, "permission_denied");
});

test("workflow transitions reject out-of-order actions without moving state backward", () => {
  let state = createAlphaSeedState();

  let result = applyAlphaAction(state, {
    personaId: "program_teacher",
    action: "approve_submission",
  }, "2026-05-18T12:05:30.000Z");
  state = result.state;
  assert.equal(result.result.ok, false);
  assert.equal(result.result.status, 409);
  assert.equal(state.proposal.status, "draft");
  assert.equal(state.audit[0].entity, "workflow_transition_blocked");

  ({ state } = applyAlphaAction(state, {
    personaId: "student",
    action: "submit_proposal",
  }, "2026-05-18T12:06:00.000Z"));
  ({ state } = applyAlphaAction(state, {
    personaId: "program_teacher",
    action: "approve_submission",
  }, "2026-05-18T12:07:00.000Z"));
  assert.equal(state.proposal.status, "approved");

  result = applyAlphaAction(state, {
    personaId: "student",
    action: "submit_proposal",
  }, "2026-05-18T12:08:00.000Z");
  assert.equal(result.result.ok, false);
  assert.equal(result.result.status, 409);
  assert.equal(result.state.proposal.status, "approved");
});

test("walkthrough distinguishes direct approval from revision loop completion", () => {
  const approved = createApprovedState();
  const directSteps = deriveAlphaWalkthroughSteps(approved);
  assert.equal(directSteps.find((step) => step.id === "approve").status, "done");
  assert.equal(directSteps.find((step) => step.id === "revision").status, "locked");
  assert.match(directSteps.find((step) => step.id === "revision").detail, /Skipped/);
  assert.equal(directSteps.find((step) => step.id === "resubmit").status, "locked");

  let revised = createAlphaSeedState();
  ({ state: revised } = applyAlphaAction(revised, {
    personaId: "student",
    action: "submit_proposal",
  }, "2026-05-18T12:22:00.000Z"));
  ({ state: revised } = applyAlphaAction(revised, {
    personaId: "program_teacher",
    action: "request_revision",
  }, "2026-05-18T12:23:00.000Z"));
  ({ state: revised } = applyAlphaAction(revised, {
    personaId: "student",
    action: "resubmit_revision",
  }, "2026-05-18T12:24:00.000Z"));
  const revisedSteps = deriveAlphaWalkthroughSteps(revised);
  assert.equal(revisedSteps.find((step) => step.id === "revision").status, "done");
  assert.equal(revisedSteps.find((step) => step.id === "resubmit").status, "done");
});

test("next alpha step points reviewers to the right persona and action", () => {
  let state = createAlphaSeedState();
  assert.equal(deriveAlphaNextStep(state).actionLabel, "Submit Proposal");

  ({ state } = applyAlphaAction(state, {
    personaId: "student",
    action: "submit_proposal",
  }, "2026-05-18T12:30:00.000Z"));
  assert.equal(state.nextStep.id, "revision");
  assert.equal(state.nextStep.personaId, "program_teacher");
  assert.equal(state.nextStep.action, "request_revision");

  ({ state } = applyAlphaAction(state, {
    personaId: "program_teacher",
    action: "request_revision",
  }, "2026-05-18T12:31:00.000Z"));
  assert.equal(state.nextStep.id, "resubmit");
  assert.equal(state.nextStep.personaId, "student");

  ({ state } = applyAlphaAction(state, {
    personaId: "student",
    action: "resubmit_revision",
  }, "2026-05-18T12:32:00.000Z"));
  assert.equal(state.nextStep.id, "approve");
  assert.equal(state.nextStep.action, "approve_submission");
});

test("evidence link validation blocks non-https evidence", () => {
  const seed = createAlphaSeedState();
  const { state, result } = applyAlphaAction(seed, {
    personaId: "student",
    action: "add_evidence_link",
    payload: {
      title: "Bad link",
      url: "http://example.com/not-safe",
    },
  }, "2026-05-18T12:06:00.000Z");

  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.equal(state.evidence.length, 1);
  assert.equal(state.audit[0].entityId, "rejected");
});

test("mentor, admin, and misc admin actions update their narrow alpha surfaces", () => {
  let state = createApprovedState();

  ({ state } = applyAlphaAction(state, {
    personaId: "mentor",
    action: "mark_meeting_held",
  }, "2026-05-18T12:07:00.000Z"));
  assert.equal(state.meeting.status, "held");
  assert.equal(deriveMetrics(state).meetingHeld, 1);

  ({ state } = applyAlphaAction(state, {
    personaId: "admin",
    action: "queue_archive_export",
  }, "2026-05-18T12:08:00.000Z"));
  assert.equal(state.exportRequest.status, "queued");
  assert.equal(deriveMetrics(state).exportQueued, 1);

  ({ state } = applyAlphaAction(state, {
    personaId: "misc_admin",
    action: "run_readiness_report",
  }, "2026-05-18T12:09:00.000Z"));
  assert.equal(state.reportRuns.length, 1);
  assert.match(state.reportRuns[0].summary, /evidence/);
});

test("next alpha step reaches a replayable complete state after scripted checkpoints", () => {
  let state = createApprovedState();

  ({ state } = applyAlphaAction(state, {
    personaId: "mentor",
    action: "mark_meeting_held",
  }, "2026-05-18T12:40:00.000Z"));
  assert.equal(state.nextStep.id, "export");
  assert.equal(state.nextStep.personaId, "admin");

  ({ state } = applyAlphaAction(state, {
    personaId: "admin",
    action: "queue_archive_export",
  }, "2026-05-18T12:41:00.000Z"));
  assert.equal(state.nextStep.id, "report");
  assert.equal(state.nextStep.personaId, "misc_admin");

  ({ state } = applyAlphaAction(state, {
    personaId: "misc_admin",
    action: "run_readiness_report",
  }, "2026-05-18T12:42:00.000Z"));
  assert.equal(state.nextStep.id, "complete");
  assert.equal(state.nextStep.action, "reset_alpha");
});

test("duplicate mentor and export actions are blocked with clear messages", () => {
  let state = createApprovedState();

  ({ state } = applyAlphaAction(state, {
    personaId: "mentor",
    action: "mark_meeting_held",
  }, "2026-05-18T12:10:00.000Z"));
  const meetingRepeat = applyAlphaAction(state, {
    personaId: "mentor",
    action: "mark_meeting_held",
  }, "2026-05-18T12:11:00.000Z");
  assert.equal(meetingRepeat.result.ok, false);
  assert.match(meetingRepeat.result.message, /already/);

  ({ state } = applyAlphaAction(meetingRepeat.state, {
    personaId: "admin",
    action: "queue_archive_export",
  }, "2026-05-18T12:12:00.000Z"));
  const exportRepeat = applyAlphaAction(state, {
    personaId: "admin",
    action: "queue_archive_export",
  }, "2026-05-18T12:13:00.000Z");
  assert.equal(exportRepeat.result.ok, false);
  assert.equal(exportRepeat.result.status, 409);
  assert.equal(exportRepeat.state.exportRequest.status, "queued");
});

test("mentor and export actions stay locked before proposal approval", () => {
  const seed = createAlphaSeedState();

  const meeting = applyAlphaAction(seed, {
    personaId: "mentor",
    action: "mark_meeting_held",
  }, "2026-05-18T12:14:00.000Z");
  assert.equal(meeting.result.ok, false);
  assert.match(meeting.result.message, /approved|approval/);
  assert.equal(meeting.state.meeting.status, "scheduled");

  const archive = applyAlphaAction(seed, {
    personaId: "admin",
    action: "queue_archive_export",
  }, "2026-05-18T12:15:00.000Z");
  assert.equal(archive.result.ok, false);
  assert.match(archive.result.message, /approved|approval/);
});

function createApprovedState() {
  let state = createAlphaSeedState();
  ({ state } = applyAlphaAction(state, {
    personaId: "student",
    action: "submit_proposal",
  }, "2026-05-18T12:20:00.000Z"));
  ({ state } = applyAlphaAction(state, {
    personaId: "program_teacher",
    action: "approve_submission",
  }, "2026-05-18T12:21:00.000Z"));
  return state;
}
