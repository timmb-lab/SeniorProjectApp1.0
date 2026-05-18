const DEFAULT_NOW = "2026-05-18T12:00:00.000Z";

export const ALPHA_STATE_KEY = "alpha.demo_state.v1";

export const PERSONAS = [
  {
    id: "student",
    label: "Student",
    userId: "alpha-student-maya",
    scope: "Own proposal, evidence, revision, mentor meeting, and archive view",
  },
  {
    id: "program_teacher",
    label: "Program Teacher",
    userId: "alpha-teacher-chen",
    scope: "IT cohort review queue, feedback, revision request, approval, and dashboard counts",
  },
  {
    id: "mentor",
    label: "Mentor",
    userId: "alpha-mentor-rivera",
    scope: "Assigned-student meeting notes, presentation risk, and next coaching action",
  },
  {
    id: "admin",
    label: "Admin",
    userId: "alpha-admin-bryan",
    scope: "All-program overview, deadline notice, export/archive queue, and audit stream",
  },
  {
    id: "misc_admin",
    label: "Misc Admin",
    userId: "alpha-misc-reporting",
    scope: "Read-only reporting and narrow support checks",
  },
];

const PERMISSIONS = {
  add_evidence_link: ["student"],
  submit_proposal: ["student"],
  save_draft: ["student"],
  resubmit_revision: ["student"],
  request_revision: ["program_teacher"],
  approve_submission: ["program_teacher"],
  mark_meeting_held: ["mentor"],
  flag_presentation_risk: ["mentor"],
  queue_archive_export: ["admin"],
  add_deadline_notice: ["admin"],
  run_readiness_report: ["misc_admin", "admin"],
  reset_alpha: ["admin"],
};

export function createAlphaSeedState(now = DEFAULT_NOW) {
  return {
    version: 1,
    mode: "day-7-alpha",
    lastUpdated: now,
    alphaBoundary:
      "Seeded demo personas only. This is not production login, account lifecycle, or real student data.",
    activeStudentId: "alpha-student-maya",
    personas: PERSONAS,
    student: {
      id: "alpha-student-maya",
      displayName: "Maya Torres",
      program: "IT",
      cohort: "Class of 2026",
      mentor: "Mr. Rivera",
      programTeacher: "Ms. Chen",
      currentPhase: "Proposal + research",
      nextAction: "Submit the revised proposal with one evidence link attached.",
    },
    proposal: {
      id: "alpha-submission-proposal",
      title: "Networked Help Desk Knowledge Base",
      status: "draft",
      version: 1,
      completeness: 72,
      lastSubmittedAt: null,
      lastSavedAt: now,
      teacherFeedback: "",
      sections: [
        {
          id: "overview",
          title: "Project Overview",
          status: "complete",
          detail: "Build a searchable IT support knowledge base for common student laptop issues.",
        },
        {
          id: "cte_alignment",
          title: "CTE Skill Alignment",
          status: "complete",
          detail: "Networking, troubleshooting, documentation, and customer-support workflow.",
        },
        {
          id: "research",
          title: "Research + Sources",
          status: "needs_detail",
          detail: "Needs one stronger source on help-desk triage or knowledge-base design.",
        },
        {
          id: "timeline",
          title: "Timeline + Materials",
          status: "needs_detail",
          detail: "Timeline is drafted; materials list needs access notes for screenshots and sample tickets.",
        },
      ],
    },
    evidence: [
      {
        id: "alpha-evidence-1",
        title: "Initial ticket-category map",
        kind: "external_link",
        url: "https://example.com/help-desk-category-map",
        status: "pending_review",
        attachedTo: "alpha-submission-proposal",
        createdBy: "alpha-student-maya",
        createdAt: now,
      },
    ],
    reviews: [],
    meeting: {
      id: "alpha-meeting-1",
      status: "scheduled",
      scheduledFor: "2026-01-14T18:00:00.000Z",
      attendance: "pending",
      nextAction: "Bring proposal, timeline, top three questions, and evidence map.",
      notes: "",
    },
    presentation: {
      id: "alpha-presentation-1",
      outlineStatus: "not_started",
      slotStatus: "not_scheduled",
      conflict: false,
      checkOutStatus: "not_started",
      checkInStatus: "not_started",
    },
    exportRequest: {
      id: "alpha-export-1",
      status: "not_requested",
      requestedBy: null,
      requestedAt: null,
    },
    announcements: [],
    reportRuns: [],
    audit: [
      {
        id: makeId("audit", now, "seed"),
        at: now,
        actor: "system",
        persona: "system",
        action: "alpha_seed_loaded",
        entity: "alpha_state",
        summary: "Seeded Day 7 alpha state loaded with demo records only.",
      },
    ],
    lastResult: {
      ok: true,
      message: "Alpha seed state is ready.",
      action: "seed",
    },
  };
}

export function applyAlphaAction(inputState, input, now = new Date().toISOString()) {
  const state = normalizeState(inputState, now);
  const action = typeof input?.action === "string" ? input.action : "";
  const personaId = typeof input?.personaId === "string" ? input.personaId : "";
  const payload = input?.payload && typeof input.payload === "object" ? input.payload : {};

  if (!Object.prototype.hasOwnProperty.call(PERMISSIONS, action)) {
    return withResult(state, {
      ok: false,
      status: 400,
      action,
      message: "Unknown alpha action.",
    }, now);
  }

  if (!PERMISSIONS[action].includes(personaId)) {
    appendAudit(state, now, personaId || "unknown", action, "permission_denied", "alpha_state", "Permission denied in alpha persona scope.");
    return withResult(state, {
      ok: false,
      status: 403,
      action,
      message: `${labelForPersona(personaId)} cannot run ${action.replace(/_/g, " ")} in the alpha permission model.`,
    }, now);
  }

  if (action === "reset_alpha") {
    const resetState = createAlphaSeedState(now);
    appendAudit(resetState, now, personaId, action, "alpha_state", "Admin reset the alpha demo state.");
    return withResult(resetState, {
      ok: true,
      action,
      message: "Alpha state reset to the seeded Day 7 walkthrough.",
    }, now);
  }

  if (action === "save_draft") {
    state.proposal.lastSavedAt = now;
    state.proposal.completeness = Math.min(88, Math.max(state.proposal.completeness, 78));
    markSectionComplete(state, "research");
    appendAudit(state, now, personaId, action, "submission", state.proposal.id, "Student saved proposal draft progress.");
    return withResult(state, {
      ok: true,
      action,
      message: "Draft saved and research section moved closer to submit-ready.",
    }, now);
  }

  if (action === "add_evidence_link") {
    const title = cleanText(payload.title, "Process evidence link");
    const url = cleanText(payload.url, "");
    if (!/^https:\/\/[^ ]+\.[^ ]+/.test(url)) {
      appendAudit(state, now, personaId, action, "evidence_artifact", "rejected", "Evidence link rejected because it was not an HTTPS URL.");
      return withResult(state, {
        ok: false,
        status: 400,
        action,
        message: "Evidence link blocked: use a full HTTPS URL before the student can submit.",
      }, now);
    }
    const artifact = {
      id: makeId("alpha-evidence", now, `${state.evidence.length + 1}`),
      title,
      kind: "external_link",
      url,
      status: "pending_review",
      attachedTo: state.proposal.id,
      createdBy: "alpha-student-maya",
      createdAt: now,
    };
    state.evidence.push(artifact);
    state.proposal.completeness = Math.max(state.proposal.completeness, 86);
    appendAudit(state, now, personaId, action, "evidence_artifact", artifact.id, `Student attached evidence link: ${title}.`);
    return withResult(state, {
      ok: true,
      action,
      message: "Evidence metadata attached. File-byte upload remains a post-alpha hardening task.",
    }, now);
  }

  if (action === "submit_proposal") {
    if (state.evidence.length === 0) {
      appendAudit(state, now, personaId, action, "submission", state.proposal.id, "Submit blocked because evidence metadata is missing.");
      return withResult(state, {
        ok: false,
        status: 409,
        action,
        message: "Submit blocked until at least one evidence link or upload metadata record is attached.",
      }, now);
    }
    state.proposal.status = "submitted";
    state.proposal.lastSubmittedAt = now;
    state.proposal.completeness = Math.max(state.proposal.completeness, 90);
    state.student.nextAction = "Wait for program-teacher feedback or approval.";
    appendAudit(state, now, personaId, action, "submission", state.proposal.id, "Student submitted proposal for teacher review.");
    return withResult(state, {
      ok: true,
      action,
      message: "Proposal submitted. Teacher review queue and dashboard counts updated.",
    }, now);
  }

  if (action === "request_revision") {
    state.proposal.status = "revision_requested";
    state.proposal.teacherFeedback = "Add one stronger research source and clarify how the ticket categories will be tested.";
    state.student.nextAction = "Revise research source notes, then resubmit.";
    state.reviews.unshift({
      id: makeId("alpha-review", now, `${state.reviews.length + 1}`),
      decision: "revision_requested",
      feedback: state.proposal.teacherFeedback,
      reviewer: "Ms. Chen",
      createdAt: now,
    });
    appendAudit(state, now, personaId, action, "review", state.reviews[0].id, "Teacher requested a revision.");
    return withResult(state, {
      ok: true,
      action,
      message: "Revision requested and visible to the student persona.",
    }, now);
  }

  if (action === "resubmit_revision") {
    state.proposal.status = "submitted";
    state.proposal.version += 1;
    state.proposal.lastSubmittedAt = now;
    state.proposal.completeness = 96;
    markSectionComplete(state, "research");
    markSectionComplete(state, "timeline");
    state.student.nextAction = "Teacher can approve the revised proposal.";
    appendAudit(state, now, personaId, action, "submission", state.proposal.id, "Student resubmitted the revised proposal.");
    return withResult(state, {
      ok: true,
      action,
      message: "Revision resubmitted. Version history and dashboard state updated.",
    }, now);
  }

  if (action === "approve_submission") {
    state.proposal.status = "approved";
    state.proposal.completeness = 100;
    state.student.currentPhase = "Build + mentor preparation";
    state.student.nextAction = "Prepare for mentor meeting and build evidence capture.";
    state.reviews.unshift({
      id: makeId("alpha-review", now, `${state.reviews.length + 1}`),
      decision: "approved",
      feedback: "Approved for alpha walkthrough. Continue capturing build evidence.",
      reviewer: "Ms. Chen",
      createdAt: now,
    });
    appendAudit(state, now, personaId, action, "review", state.reviews[0].id, "Teacher approved the revised proposal.");
    return withResult(state, {
      ok: true,
      action,
      message: "Proposal approved. Student phase, dashboard aggregate, and audit timeline moved forward.",
    }, now);
  }

  if (action === "mark_meeting_held") {
    state.meeting.status = "held";
    state.meeting.attendance = "present";
    state.meeting.notes = "Mentor confirmed scope and asked student to prepare two sample support articles.";
    state.meeting.nextAction = "Draft two knowledge-base articles before presentation outline.";
    state.presentation.outlineStatus = "ready_to_draft";
    appendAudit(state, now, personaId, action, "meeting", state.meeting.id, "Mentor marked meeting attendance and next action.");
    return withResult(state, {
      ok: true,
      action,
      message: "Mentor meeting recorded with attendance and next action.",
    }, now);
  }

  if (action === "flag_presentation_risk") {
    state.presentation.conflict = true;
    state.presentation.slotStatus = "conflict_needs_resolution";
    appendAudit(state, now, personaId, action, "presentation_slot", state.presentation.id, "Mentor flagged a presentation scheduling conflict.");
    return withResult(state, {
      ok: true,
      action,
      message: "Presentation conflict state added for admin/teacher visibility.",
    }, now);
  }

  if (action === "queue_archive_export") {
    state.exportRequest.status = "queued";
    state.exportRequest.requestedBy = personaId;
    state.exportRequest.requestedAt = now;
    appendAudit(state, now, personaId, action, "export", state.exportRequest.id, "Admin queued student archive export.");
    return withResult(state, {
      ok: true,
      action,
      message: "Archive export queued. Signed download generation remains post-alpha hardening.",
    }, now);
  }

  if (action === "add_deadline_notice") {
    const title = cleanText(payload.title, "Proposal revision deadline check");
    state.announcements.unshift({
      id: makeId("alpha-notice", now, `${state.announcements.length + 1}`),
      title,
      audience: "IT cohort",
      createdBy: personaId,
      createdAt: now,
    });
    appendAudit(state, now, personaId, action, "announcement", state.announcements[0].id, "Admin added alpha deadline notice.");
    return withResult(state, {
      ok: true,
      action,
      message: "Deadline notice published to the alpha IT cohort.",
    }, now);
  }

  if (action === "run_readiness_report") {
    state.reportRuns.unshift({
      id: makeId("alpha-report", now, `${state.reportRuns.length + 1}`),
      persona: personaId,
      generatedAt: now,
      summary: `${deriveMetrics(state).approvedCount} approved, ${deriveMetrics(state).revisionCount} revision-needed, ${deriveMetrics(state).evidenceCount} evidence items.`,
    });
    appendAudit(state, now, personaId, action, "report", state.reportRuns[0].id, "Read-only readiness report generated.");
    return withResult(state, {
      ok: true,
      action,
      message: "Read-only readiness report generated for narrow support visibility.",
    }, now);
  }

  return withResult(state, {
    ok: false,
    status: 400,
    action,
    message: "Action was recognized but not implemented.",
  }, now);
}

export function deriveMetrics(state) {
  const proposalStatus = state?.proposal?.status || "draft";
  return {
    submittedCount: proposalStatus === "submitted" ? 1 : 0,
    revisionCount: proposalStatus === "revision_requested" ? 1 : 0,
    approvedCount: proposalStatus === "approved" ? 1 : 0,
    evidenceCount: Array.isArray(state?.evidence) ? state.evidence.length : 0,
    auditCount: Array.isArray(state?.audit) ? state.audit.length : 0,
    meetingHeld: state?.meeting?.status === "held" ? 1 : 0,
    exportQueued: state?.exportRequest?.status === "queued" ? 1 : 0,
  };
}

function normalizeState(inputState, now) {
  const state = clone(inputState || createAlphaSeedState(now));
  state.version = 1;
  state.lastUpdated = state.lastUpdated || now;
  state.personas = Array.isArray(state.personas) ? state.personas : PERSONAS;
  state.evidence = Array.isArray(state.evidence) ? state.evidence : [];
  state.reviews = Array.isArray(state.reviews) ? state.reviews : [];
  state.announcements = Array.isArray(state.announcements) ? state.announcements : [];
  state.reportRuns = Array.isArray(state.reportRuns) ? state.reportRuns : [];
  state.audit = Array.isArray(state.audit) ? state.audit : [];
  return state;
}

function withResult(state, result, now) {
  state.lastUpdated = now;
  state.metrics = deriveMetrics(state);
  state.lastResult = result;
  return { state, result };
}

function appendAudit(state, at, persona, action, entity, entityId, summary) {
  state.audit.unshift({
    id: makeId("audit", at, `${state.audit.length + 1}`),
    at,
    actor: labelForPersona(persona),
    persona,
    action,
    entity,
    entityId,
    summary,
  });
}

function markSectionComplete(state, sectionId) {
  const section = state.proposal.sections.find((item) => item.id === sectionId);
  if (section) {
    section.status = "complete";
  }
}

function labelForPersona(personaId) {
  return PERSONAS.find((persona) => persona.id === personaId)?.label || personaId || "Unknown persona";
}

function cleanText(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, 160) : fallback;
}

function makeId(prefix, at, suffix) {
  const compactTime = String(at || DEFAULT_NOW).replace(/[^0-9]/g, "").slice(0, 17);
  return `${prefix}-${compactTime}-${String(suffix).replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
