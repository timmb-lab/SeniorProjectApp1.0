import crypto from "node:crypto";
import fs from "node:fs/promises";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const TOKEN_AUDIENCE = "https://oauth2.googleapis.com/token";

function base64UrlEncode(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function quoteSheetName(sheetName) {
  const escaped = String(sheetName).replace(/'/g, "''");
  return `'${escaped}'`;
}

function getEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && String(value).trim()) return String(value);
  }
  return "";
}

function normalizePrivateKey(value) {
  return String(value).replace(/\\n/g, "\n");
}

async function readJson(path) {
  const raw = await fs.readFile(path, "utf8");
  const normalized = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return JSON.parse(normalized);
}

async function getAccessToken({ clientEmail, privateKey }) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: SHEETS_SCOPE,
    aud: TOKEN_AUDIENCE,
    iat: now,
    exp: now + 60 * 60,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(signingInput, "utf8"), privateKey);
  const assertion = `${signingInput}.${base64UrlEncode(signature)}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  }).toString();

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Token exchange failed (${response.status}): ${text || response.statusText}`);
  }

  const json = await response.json();
  if (!json.access_token) throw new Error("Token exchange did not return access_token.");
  return String(json.access_token);
}

async function appendRow({ accessToken, spreadsheetId, tabName, values }) {
  const range = `${quoteSheetName(tabName)}!A1`;
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append`,
  );
  url.searchParams.set("valueInputOption", "USER_ENTERED");
  url.searchParams.set("insertDataOption", "INSERT_ROWS");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ values: [values] }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Sheets append failed (${response.status}): ${text || response.statusText}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = { dryRun: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--payload") {
      options.payloadPath = args[index + 1];
      index += 1;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.help) {
    console.log("Usage: node scripts/log_automation_to_sheet.mjs --payload <path> [--dry-run]");
    return;
  }

  const mock = getEnv("AUTOMATION_SHEETS_MOCK");
  if (mock) {
    if (mock === "success") return;
    if (mock === "fail") throw new Error("AUTOMATION_SHEETS_MOCK=fail");
    throw new Error(`Unknown AUTOMATION_SHEETS_MOCK value: ${mock}`);
  }

  if (!options.payloadPath) throw new Error("--payload is required.");

  const payload = await readJson(options.payloadPath);
  const spreadsheetId =
    payload?.sheet?.spreadsheet_id || getEnv("AUTOMATION_SHEETS_SPREADSHEET_ID");
  const tabName = payload?.sheet?.tab_name || getEnv("AUTOMATION_SHEETS_TAB_NAME");
  const values = payload?.row?.values;

  if (!spreadsheetId) {
    throw new Error(
      "Missing spreadsheet_id (payload.sheet.spreadsheet_id or AUTOMATION_SHEETS_SPREADSHEET_ID).",
    );
  }
  if (!tabName) {
    throw new Error("Missing tab_name (payload.sheet.tab_name or AUTOMATION_SHEETS_TAB_NAME).");
  }
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Payload is missing row.values array.");
  }

  const clientEmail = getEnv("GOOGLE_SHEETS_CLIENT_EMAIL", "GOOGLE_DRIVE_CLIENT_EMAIL");
  const privateKeyRaw = getEnv("GOOGLE_SHEETS_PRIVATE_KEY", "GOOGLE_DRIVE_PRIVATE_KEY");
  if (!clientEmail) {
    throw new Error("Missing GOOGLE_SHEETS_CLIENT_EMAIL (or GOOGLE_DRIVE_CLIENT_EMAIL fallback).");
  }
  if (!privateKeyRaw) {
    throw new Error("Missing GOOGLE_SHEETS_PRIVATE_KEY (or GOOGLE_DRIVE_PRIVATE_KEY fallback).");
  }
  const privateKey = normalizePrivateKey(privateKeyRaw);

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        { spreadsheetId, tabName, valuesCount: values.length, payloadPath: options.payloadPath },
        null,
        2,
      ),
    );
    return;
  }

  const accessToken = await getAccessToken({ clientEmail, privateKey });
  await appendRow({ accessToken, spreadsheetId, tabName, values });
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});

