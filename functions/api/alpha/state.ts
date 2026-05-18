import type { Env } from "../../_types";
import { createAlphaState } from "../../_lib/alphaDemo";
import { json } from "../../_lib/http";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const state = createAlphaState();

  try {
    const programCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM programs").first<{ count: number }>();
    return json({
      ...state,
      runtime: {
        source: "pages_function",
        d1ProgramCount: programCount?.count ?? null,
        databaseBound: true,
      },
    });
  } catch {
    return json({
      ...state,
      runtime: {
        source: "pages_function_seed_only",
        d1ProgramCount: null,
        databaseBound: false,
      },
    });
  }
};
