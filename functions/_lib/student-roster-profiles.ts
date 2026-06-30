import type { Env } from "../_types.ts";

interface TableRow {
  name: string;
}

export async function studentRosterProfilesTableExists(env: Env): Promise<boolean> {
  try {
    const row = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'student_roster_profiles' LIMIT 1",
    ).first<TableRow>();
    return row?.name === "student_roster_profiles";
  } catch {
    return false;
  }
}
