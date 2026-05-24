import type { Env } from "../../_types.ts";
import {
  handleSiteMentorAssignmentsGet,
  handleSiteMentorAssignmentsPost,
} from "../../_lib/site-mentor-assignments.ts";

export const onRequestGet: PagesFunction<Env> = ({ request, env }) => handleSiteMentorAssignmentsGet({ request, env });

export const onRequestPost: PagesFunction<Env> = ({ request, env }) => handleSiteMentorAssignmentsPost({ request, env });
