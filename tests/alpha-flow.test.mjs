import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAlphaAction,
  createAlphaSeedState,
  deriveMetrics,
} from "../functions/_lib/alpha-flow-model.js";

test("alpha seed starts with demo records and no production auth dependency", () => {
  const state = createAlphaSeedState();
  assert.equal(state.mode, "day-7-alpha");
  assert.equal(state.personas.length, 5);
  assert.equal(state.proposal.status, "draft");
  assert.equal(deriveMetrics(state).evidenceCount, 1);
});

test("student to teacher revision to approval loop updates state and audit", () => {
  let state = createAlphaSeedState();

  ({ state } = applyAlphaAction(state, {
    personaId: "student",
    action: "submit_proposal",
  }, "2026-05-18T12:01:00.000Z"));
  assert.equal(state.proposal.status, "submitted");

  ({ state } = applyAlphaAction(state, {
    personaId: "program_teacher",
    action: "request_revision",
  }, "2026-05-18T12:02:00.000Z"));
  assert.equal(state.proposal.status, "revision_requested");
  assert.equal(deriveMetrics(state).revisionCount, 1);

  ({ state } = applyAlphaAction(state, {
    personaId: "student",
    action: "resubmit_revision",
  }, "2026-05-18T12:03:00.000Z"));
  assert.equal(state.proposal.status, "submitted");
  assert.equal(state.proposal.version, 2);

  ({ state } = applyAlphaAction(state, {
    personaId: "program_teacher",
    action: "approve_submission",
  }, "2026-05-18T12:04:00.000Z"));
  assert.equal(state.proposal.status, "approved");
  assert.equal(deriveMetrics(state).approvedCount, 1);
  assert.ok(state.audit.some((event) => event.action === "approve_submission"));
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
  let state = createAlphaSeedState();

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
