import type { Env, UserAccount } from "../_types.ts";
import { getCurrentUser, writeAudit } from "../_lib/auth.ts";
import { randomId } from "../_lib/crypto.ts";
import { json, readJson, requirePost } from "../_lib/http.ts";
import {
  adultAssignmentEventStatement,
  assignmentResponse,
  canManageProjectAdultTarget,
  canStudentManageProjectAdultTarget,
  canViewProjectAdultTarget,
  cleanInviteEmail,
  cleanProjectAdultRole,
  loadEligibleProjectAdults,
  loadProjectAdultAssignments,
  loadProjectAdultTarget,
  mentorSyncStatements,
  notificationStatement,
  projectAdultSetup,
  targetEntityId,
  validateEligibleProjectAdult,
  type ProjectAdultAssignmentRow,
  type ProjectAdultTarget,
} from "../_lib/project-adults.ts";

interface ProjectAdultBody {
  action?: string;
  projectId?: string;
  requestId?: string;
  assignmentId?: string;
  adultRole?: string;
  assigneeUserId?: string;
  inviteName?: string;
  inviteEmail?: string;
  reason?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const projectId = cleanId(url.searchParams.get("projectId"));
  const requestId = cleanId(url.searchParams.get("requestId"));
  if (!projectId && !requestId) {
    return json({
      ok: true,
      invitations: await loadIncomingInvitations(env, user.id),
      notifications: await loadNotifications(env, user.id),
    });
  }
  if (projectId && requestId) return json({ error: "choose_project_or_request" }, { status: 400 });
  const target = await loadProjectAdultTarget(env, projectId, requestId);
  if (!target) return json({ error: "project_or_request_not_found" }, { status: 404 });
  if (!await canViewProjectAdultTarget(env, user, target)) return json({ error: "forbidden" }, { status: 403 });
  const rows = await loadProjectAdultAssignments(
    env,
    target.projectId ? [target.projectId] : [],
    target.requestId ? [target.requestId] : [],
  );
  const canManage = await canManageProjectAdultTarget(env, user, target);
  const canNominate = canManage || await canStudentManageProjectAdultTarget(env, user, target);
  return json({
    ok: true,
    target,
    setup: projectAdultSetup(rows),
    assignments: rows.map(assignmentResponse),
    options: canNominate ? await loadEligibleProjectAdults(env, target) : { mentors: [], programTeachers: [] },
    invitations: await loadIncomingInvitations(env, user.id),
    notifications: await loadNotifications(env, user.id),
    permissions: { canNominate, canManage },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const methodError = requirePost(request);
  if (methodError) return methodError;
  const user = await getCurrentUser(request, env);
  if (!user) return json({ error: "unauthorized" }, { status: 401 });
  let body: ProjectAdultBody;
  try {
    body = await readJson<ProjectAdultBody>(request);
  } catch {
    return json({ error: "invalid_json" }, { status: 400 });
  }
  const action = cleanId(body.action);
  if (action === "nominate_adult" || action === "assign_adult") {
    return nominateAdult(env, request, user, body, action === "assign_adult");
  }
  if (action === "accept_adult_invitation" || action === "decline_adult_invitation") {
    return respondToAdultInvitation(env, request, user, body, action === "accept_adult_invitation");
  }
  if (action === "cancel_adult_invitation") return cancelAdultInvitation(env, request, user, body);
  if (action === "link_external_mentor") return linkExternalMentor(env, request, user, body);
  if (action === "mark_notifications_read") return markNotificationsRead(env, user);
  return json({ error: "invalid_project_adult_action" }, { status: 400 });
};

async function nominateAdult(
  env: Env,
  request: Request,
  user: UserAccount,
  body: ProjectAdultBody,
  directAssignment: boolean,
) {
  const projectId = cleanId(body.projectId);
  const requestId = cleanId(body.requestId);
  const role = cleanProjectAdultRole(body.adultRole);
  if ((!projectId && !requestId) || (projectId && requestId) || !role) {
    return json({ error: "project_request_and_adult_role_required" }, { status: 400 });
  }
  const target = await loadProjectAdultTarget(env, projectId, requestId);
  if (!target) return json({ error: "project_or_request_not_found" }, { status: 404 });
  const canManage = await canManageProjectAdultTarget(env, user, target);
  const canStudentNominate = await canStudentManageProjectAdultTarget(env, user, target);
  if (!canManage && !canStudentNominate) return json({ error: "forbidden" }, { status: 403 });
  if (directAssignment && !canManage) return json({ error: "staff_role_required" }, { status: 403 });

  const assigneeUserId = cleanId(body.assigneeUserId);
  const inviteName = cleanText(body.inviteName, 100);
  const inviteEmail = cleanInviteEmail(body.inviteEmail);
  const reason = cleanText(body.reason, 300);
  let assignee: { id: string; display_name: string; email: string } | null = null;
  if (assigneeUserId) {
    assignee = await validateEligibleProjectAdult(env, target, role, assigneeUserId);
    if (!assignee) return json({ error: role === "mentor" ? "mentor_not_eligible" : "program_teacher_not_eligible" }, { status: 409 });
  } else {
    if (role !== "mentor") return json({ error: "program_teacher_account_required" }, { status: 400 });
    if (!inviteName || !inviteEmail) return json({ error: "mentor_name_and_email_required" }, { status: 400 });
    const matchingAccount = await env.DB.prepare(
      "SELECT id FROM user_accounts WHERE lower(email) = ? AND status = 'active' LIMIT 1",
    ).bind(inviteEmail).first<{ id: string }>();
    if (matchingAccount) {
      assignee = await validateEligibleProjectAdult(env, target, role, matchingAccount.id);
      if (!assignee) return json({ error: "mentor_account_needs_school_mentor_access" }, { status: 409 });
    }
  }
  if (directAssignment && !assignee) return json({ error: "active_mentor_account_required_for_staff_assignment" }, { status: 400 });

  const currentRows = await loadProjectAdultAssignments(
    env,
    target.projectId ? [target.projectId] : [],
    target.requestId ? [target.requestId] : [],
  );
  const accepted = currentRows.find((row) => row.adult_role === role && row.status === "accepted") || null;
  const pending = currentRows.find((row) => row.adult_role === role && row.status === "pending") || null;
  if (accepted?.assignee_user_id && accepted.assignee_user_id === assignee?.id) {
    return json({ error: "adult_already_confirmed" }, { status: 409 });
  }
  if (pending?.assignee_user_id && pending.assignee_user_id === assignee?.id) {
    return json({ error: "adult_invitation_already_waiting" }, { status: 409 });
  }
  if (directAssignment && accepted && !reason) return json({ error: "replacement_reason_required" }, { status: 400 });

  const assignmentId = randomId("project-adult");
  const status = directAssignment ? "accepted" : "pending";
  const statements: D1PreparedStatement[] = [];
  if (pending) {
    statements.push(
      env.DB.prepare(
        "UPDATE project_adult_assignments SET status = 'cancelled', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND status = 'pending'",
      ).bind(pending.id),
      adultAssignmentEventStatement(env, pending.id, user.id, "cancelled", { replacedByNewInvitation: true }),
    );
  }
  if (directAssignment && accepted) {
    statements.push(
      env.DB.prepare(
        `UPDATE project_adult_assignments
         SET status = 'replaced', staff_reason = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND status = 'accepted'`,
      ).bind(reason, accepted.id),
      adultAssignmentEventStatement(env, accepted.id, user.id, "replaced", { replacementId: assignmentId, reason }),
    );
  }
  statements.push(
    env.DB.prepare(
      `INSERT INTO project_adult_assignments (
         id, project_id, request_id, site_id, program_id, adult_role,
         assignee_user_id, invited_name, invited_email, status, nominated_by,
         responded_by, responded_at, replacement_for_id, staff_reason
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
         CASE WHEN ? = 'accepted' THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') ELSE NULL END,
         ?, ?)`,
    ).bind(
      assignmentId,
      target.projectId || null,
      target.requestId || null,
      target.siteId,
      target.programId || null,
      role,
      assignee?.id || null,
      assignee?.display_name || inviteName,
      assignee?.email || inviteEmail,
      status,
      user.id,
      directAssignment ? user.id : null,
      status,
      accepted?.id || null,
      reason || null,
    ),
    adultAssignmentEventStatement(env, assignmentId, user.id, directAssignment ? "accepted" : "nominated", {
      adultRole: role,
      externalInvite: !assignee,
      directAssignment,
    }),
  );
  if (directAssignment && accepted) {
    statements.push(
      env.DB.prepare("UPDATE project_adult_assignments SET replaced_by_id = ? WHERE id = ?")
        .bind(assignmentId, accepted.id),
    );
  }
  if (assignee) {
    statements.push(notificationStatement(
      env,
      assignee.id,
      directAssignment ? "project_adult_accepted" : "project_adult_invitation",
      directAssignment ? `You were added to ${target.name}` : `${target.name} needs your answer`,
      directAssignment
        ? `You are the confirmed ${roleLabel(role)} for this project.`
        : `A student tagged you as the ${roleLabel(role)}. Open the project and accept or decline.`,
      targetEntityId(target),
      target.requestId ? "project_request" : "project",
    ));
  }
  if (directAssignment && target.projectId && role === "mentor" && assignee) {
    statements.push(...mentorSyncStatements(env, target.projectId, assignee.id, user.id));
  }
  await env.DB.batch(statements);
  await auditAdultAction(env, request, user, directAssignment ? "project_adult_assigned" : "project_adult_nominated", target, assignmentId, {
    adultRole: role,
    assigneeUserId: assignee?.id || null,
    externalInvite: !assignee,
  });
  return json({
    ok: true,
    assignmentId,
    status,
    message: directAssignment
      ? `${roleLabel(role)} confirmed.`
      : assignee
        ? `${roleLabel(role)} tagged. They need to accept.`
        : "Mentor request saved. This did not send an email. A School Admin must add and connect the account before the Mentor can accept.",
  }, { status: 201 });
}

async function respondToAdultInvitation(
  env: Env,
  request: Request,
  user: UserAccount,
  body: ProjectAdultBody,
  accept: boolean,
) {
  const assignmentId = cleanId(body.assignmentId);
  if (!assignmentId) return json({ error: "assignment_id_required" }, { status: 400 });
  const assignment = await loadAssignment(env, assignmentId);
  if (!assignment) return json({ error: "adult_invitation_not_found" }, { status: 404 });
  if (assignment.status !== "pending") return json({ error: "adult_invitation_already_answered" }, { status: 409 });
  if (assignment.assignee_user_id !== user.id) return json({ error: "forbidden" }, { status: 403 });
  const target = await loadProjectAdultTarget(env, assignment.project_id || "", assignment.request_id || "");
  if (!target) return json({ error: "project_or_request_not_found" }, { status: 404 });
  const eligible = await validateEligibleProjectAdult(env, target, assignment.adult_role, user.id);
  if (!eligible) return json({ error: "adult_role_or_scope_changed" }, { status: 409 });

  const statements: D1PreparedStatement[] = [];
  if (accept) {
    const rows = await loadProjectAdultAssignments(
      env,
      target.projectId ? [target.projectId] : [],
      target.requestId ? [target.requestId] : [],
    );
    const accepted = rows.find((row) => row.adult_role === assignment.adult_role && row.status === "accepted") || null;
    if (accepted) {
      statements.push(
        env.DB.prepare(
          `UPDATE project_adult_assignments
           SET status = 'replaced', replaced_by_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = ? AND status = 'accepted'`,
        ).bind(assignment.id, accepted.id),
        adultAssignmentEventStatement(env, accepted.id, user.id, "replaced", { replacementId: assignment.id }),
      );
    }
    statements.push(
      env.DB.prepare(
        `UPDATE project_adult_assignments
         SET status = 'accepted', responded_by = ?, responded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND status = 'pending'`,
      ).bind(user.id, assignment.id),
      adultAssignmentEventStatement(env, assignment.id, user.id, "accepted", {}),
    );
    if (target.projectId && assignment.adult_role === "mentor") {
      statements.push(...mentorSyncStatements(env, target.projectId, user.id, user.id));
    }
  } else {
    statements.push(
      env.DB.prepare(
        `UPDATE project_adult_assignments
         SET status = 'declined', responded_by = ?, responded_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND status = 'pending'`,
      ).bind(user.id, assignment.id),
      adultAssignmentEventStatement(env, assignment.id, user.id, "declined", {}),
    );
  }
  statements.push(env.DB.prepare(
    `UPDATE user_notifications
     SET read_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE user_id = ?
       AND kind = 'project_adult_invitation'
       AND entity_type = ?
       AND entity_id = ?
       AND read_at IS NULL`,
  ).bind(
    user.id,
    target.requestId ? "project_request" : "project",
    targetEntityId(target),
  ));
  statements.push(...targetMemberNotificationStatements(
    env,
    target,
    accept ? "project_adult_accepted" : "project_adult_declined",
    `${roleLabel(assignment.adult_role)} ${accept ? "accepted" : "declined"}`,
    accept
      ? `${eligible.display_name} accepted the ${roleLabel(assignment.adult_role)} role.`
      : `${eligible.display_name} declined. Tag another ${roleLabel(assignment.adult_role)}.`,
  ));
  await env.DB.batch(statements);
  await auditAdultAction(env, request, user, accept ? "project_adult_invitation_accepted" : "project_adult_invitation_declined", target, assignment.id, {
    adultRole: assignment.adult_role,
  });
  return json({ ok: true, status: accept ? "accepted" : "declined", message: accept ? "Role accepted." : "Role declined." });
}

async function cancelAdultInvitation(env: Env, request: Request, user: UserAccount, body: ProjectAdultBody) {
  const assignmentId = cleanId(body.assignmentId);
  if (!assignmentId) return json({ error: "assignment_id_required" }, { status: 400 });
  const assignment = await loadAssignment(env, assignmentId);
  if (!assignment) return json({ error: "adult_invitation_not_found" }, { status: 404 });
  if (assignment.status !== "pending") return json({ error: "only_waiting_invites_can_be_cancelled" }, { status: 409 });
  const target = await loadProjectAdultTarget(env, assignment.project_id || "", assignment.request_id || "");
  if (!target) return json({ error: "project_or_request_not_found" }, { status: 404 });
  const canManage = await canManageProjectAdultTarget(env, user, target);
  const canStudent = await canStudentManageProjectAdultTarget(env, user, target);
  if (!canManage && !canStudent) return json({ error: "forbidden" }, { status: 403 });
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE project_adult_assignments SET status = 'cancelled', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND status = 'pending'",
    ).bind(assignment.id),
    adultAssignmentEventStatement(env, assignment.id, user.id, "cancelled", {}),
  ]);
  await auditAdultAction(env, request, user, "project_adult_invitation_cancelled", target, assignment.id, { adultRole: assignment.adult_role });
  return json({ ok: true, message: "Invitation cancelled. Tag another adult when you are ready." });
}

async function linkExternalMentor(env: Env, request: Request, user: UserAccount, body: ProjectAdultBody) {
  const assignmentId = cleanId(body.assignmentId);
  const assigneeUserId = cleanId(body.assigneeUserId);
  if (!assignmentId || !assigneeUserId) return json({ error: "assignment_and_mentor_required" }, { status: 400 });
  const assignment = await loadAssignment(env, assignmentId);
  if (!assignment || assignment.adult_role !== "mentor" || assignment.status !== "pending" || assignment.assignee_user_id) {
    return json({ error: "external_mentor_invitation_not_found" }, { status: 404 });
  }
  const target = await loadProjectAdultTarget(env, assignment.project_id || "", assignment.request_id || "");
  if (!target) return json({ error: "project_or_request_not_found" }, { status: 404 });
  if (!await canManageProjectAdultTarget(env, user, target)) return json({ error: "forbidden" }, { status: 403 });
  const mentor = await validateEligibleProjectAdult(env, target, "mentor", assigneeUserId);
  if (!mentor) return json({ error: "mentor_not_eligible" }, { status: 409 });
  if (cleanInviteEmail(assignment.invited_email) !== cleanInviteEmail(mentor.email)) {
    return json({ error: "mentor_email_does_not_match_invite" }, { status: 409 });
  }
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE project_adult_assignments
       SET assignee_user_id = ?, invited_name = ?, invited_email = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ? AND status = 'pending' AND assignee_user_id IS NULL`,
    ).bind(mentor.id, mentor.display_name, mentor.email, assignment.id),
    adultAssignmentEventStatement(env, assignment.id, user.id, "linked_to_account", { mentorUserId: mentor.id }),
    notificationStatement(
      env,
      mentor.id,
      "project_adult_invitation",
      `${target.name} needs your answer`,
      "A student tagged you as the Mentor. Open the project and accept or decline.",
      targetEntityId(target),
      target.requestId ? "project_request" : "project",
    ),
  ]);
  await auditAdultAction(env, request, user, "project_external_mentor_linked", target, assignment.id, { mentorUserId: mentor.id });
  return json({ ok: true, message: "Mentor account connected. They can now accept the invitation." });
}

async function markNotificationsRead(env: Env, user: UserAccount) {
  await env.DB.prepare(
    "UPDATE user_notifications SET read_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE user_id = ? AND read_at IS NULL",
  ).bind(user.id).run();
  return json({ ok: true, message: "Notifications marked as read." });
}

async function loadAssignment(env: Env, assignmentId: string): Promise<ProjectAdultAssignmentRow | null> {
  const row = await env.DB.prepare(
    `SELECT
       project_adult_assignments.*,
       assignee.display_name AS assignee_name,
       assignee.email AS assignee_email,
       nominator.display_name AS nominator_name,
       COALESCE(projects.name, project_requests.proposed_name) AS target_name
     FROM project_adult_assignments
     LEFT JOIN user_accounts assignee ON assignee.id = project_adult_assignments.assignee_user_id
     LEFT JOIN user_accounts nominator ON nominator.id = project_adult_assignments.nominated_by
     LEFT JOIN projects ON projects.id = project_adult_assignments.project_id
     LEFT JOIN project_requests ON project_requests.id = project_adult_assignments.request_id
     WHERE project_adult_assignments.id = ?
     LIMIT 1`,
  ).bind(assignmentId).first<ProjectAdultAssignmentRow>();
  return row || null;
}

async function loadIncomingInvitations(env: Env, userId: string) {
  const rows = await env.DB.prepare(
    `SELECT
       project_adult_assignments.*,
       assignee.display_name AS assignee_name,
       assignee.email AS assignee_email,
       nominator.display_name AS nominator_name,
       COALESCE(projects.name, project_requests.proposed_name) AS target_name
     FROM project_adult_assignments
     LEFT JOIN user_accounts assignee ON assignee.id = project_adult_assignments.assignee_user_id
     LEFT JOIN user_accounts nominator ON nominator.id = project_adult_assignments.nominated_by
     LEFT JOIN projects ON projects.id = project_adult_assignments.project_id
     LEFT JOIN project_requests ON project_requests.id = project_adult_assignments.request_id
     WHERE project_adult_assignments.assignee_user_id = ?
       AND project_adult_assignments.status = 'pending'
     ORDER BY project_adult_assignments.created_at
     LIMIT 50`,
  ).bind(userId).all<ProjectAdultAssignmentRow>();
  return (rows.results || []).map(assignmentResponse);
}

async function loadNotifications(env: Env, userId: string) {
  const rows = await env.DB.prepare(
    `SELECT id, kind, title, message, entity_type, entity_id, read_at, created_at
     FROM user_notifications
     WHERE user_id = ?
     ORDER BY CASE WHEN read_at IS NULL THEN 0 ELSE 1 END, created_at DESC
     LIMIT 30`,
  ).bind(userId).all<Record<string, string | null>>();
  return (rows.results || []).map((row) => ({
    notificationId: row.id,
    kind: row.kind,
    title: row.title,
    message: row.message,
    entityType: row.entity_type,
    entityId: row.entity_id || "",
    read: Boolean(row.read_at),
    createdAt: row.created_at,
  }));
}

function targetMemberNotificationStatements(
  env: Env,
  target: ProjectAdultTarget,
  kind: string,
  title: string,
  message: string,
): D1PreparedStatement[] {
  if (target.projectId) {
    return [env.DB.prepare(
      `INSERT INTO user_notifications (id, user_id, kind, title, message, entity_type, entity_id)
       SELECT 'notice-' || lower(hex(randomblob(16))), student_user_id, ?, ?, ?, 'project', ?
       FROM project_members
       WHERE project_id = ? AND active = 1`,
    ).bind(kind, title, message, target.projectId, target.projectId)];
  }
  return [env.DB.prepare(
    `INSERT INTO user_notifications (id, user_id, kind, title, message, entity_type, entity_id)
     SELECT 'notice-' || lower(hex(randomblob(16))), student_user_id, ?, ?, ?, 'project_request', ?
     FROM project_request_members
     WHERE request_id = ? AND invitation_status = 'accepted'`,
  ).bind(kind, title, message, target.requestId, target.requestId)];
}

async function auditAdultAction(
  env: Env,
  request: Request,
  user: UserAccount,
  action: string,
  target: ProjectAdultTarget,
  assignmentId: string,
  metadata: Record<string, unknown>,
) {
  await writeAudit(env, {
    actorUserId: user.id,
    action,
    entityType: "project_adult_assignment",
    entityId: assignmentId,
    request,
    metadata: {
      ...metadata,
      projectId: target.projectId || null,
      requestId: target.requestId || null,
      siteId: target.siteId,
      programId: target.programId || null,
    },
  });
}

function roleLabel(role: "mentor" | "program_teacher"): string {
  return role === "mentor" ? "Mentor" : "Program Teacher";
}

function cleanId(value: unknown): string {
  const normalized = String(value || "").trim();
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(normalized) ? normalized : "";
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}
