import type { Env } from "../../_types.ts";
import { handleSiteReviewQueueRequest } from "../../_lib/site-review-queue.ts";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  return handleSiteReviewQueueRequest({ request, env });
};
