import { ALPHA_STATE_KEY, applyAlphaAction, createAlphaSeedState, deriveMetrics } from "../../_lib/alpha-flow-model.js";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

export async function onRequestGet({ env }) {
  const state = await loadAlphaState(env);
  state.metrics = deriveMetrics(state);
  return json({ state });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await readJson(request);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const current = await loadAlphaState(env);
  const now = new Date().toISOString();
  const { state, result } = applyAlphaAction(current, body, now);
  await saveAlphaState(env, state);
  await writeAlphaAudit(env, request, result, body, state);

  return json({ state, result }, result.ok ? 200 : result.status || 400);
}

async function loadAlphaState(env) {
  const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key = ?").bind(ALPHA_STATE_KEY).first();
  if (row?.value) {
    try {
      return JSON.parse(row.value);
    } catch {
      const repaired = createAlphaSeedState(new Date().toISOString());
      await saveAlphaState(env, repaired);
      return repaired;
    }
  }

  const seeded = createAlphaSeedState(new Date().toISOString());
  await saveAlphaState(env, seeded);
  return seeded;
}

async function saveAlphaState(env, state) {
  await env.DB.prepare(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at`,
  ).bind(ALPHA_STATE_KEY, JSON.stringify(state)).run();
}

async function writeAlphaAudit(env, request, result, body, state) {
  const latest = state.audit?.[0];
  try {
    await env.DB.prepare(
      `INSERT INTO audit_events (id, actor_user_id, action, entity_type, entity_id, ip_hash, user_agent_hash, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      body?.personaId || null,
      result.action || "alpha_action",
      latest?.entity || "alpha_state",
      latest?.entityId || null,
      await sha256(request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown"),
      await sha256(request.headers.get("user-agent") || "unknown"),
      JSON.stringify({
        ok: result.ok,
        message: result.message,
        alphaOnly: true,
      }),
    ).run();
  } catch {
    // Alpha state should keep working even if the durable audit insert is unavailable in a local dev setup.
  }
}

async function readJson(request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new Error("Expected JSON.");
  }
  const text = await request.text();
  if (text.length > 12_000) {
    throw new Error("Body too large.");
  }
  return JSON.parse(text);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}
