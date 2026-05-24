import type { Env } from "../../../_types.ts";
import { handleSiteStudentDetailRequest } from "../../../_lib/site-student-detail.ts";

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  return handleSiteStudentDetailRequest({
    request,
    env,
    params: params as Record<string, string | string[]> | undefined,
  });
};
