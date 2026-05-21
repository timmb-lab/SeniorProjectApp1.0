import type { Env } from "../../_types.ts";
import { safeAuthConfig } from "../../_lib/auth-config.ts";
import { json } from "../../_lib/http.ts";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return json(safeAuthConfig(env));
};
