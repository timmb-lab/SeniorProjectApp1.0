import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = process.cwd();
const BASE_URL = (process.env.HOSTED_BASE_URL || 'https://thecapstoneapp.com').replace(/\/$/, '');
const WORKSPACE_ENTRY_PATH = normalizeWorkspaceEntryPath(process.env.WORKSPACE_BROWSER_ENTRY_PATH || '/workspace');
const CREDENTIALS_PATH = process.env.TEST_ACCOUNTS_PATH || path.join('.secrets', 'test-accounts-2026-05-18.json');
const SCREENSHOT_DIR = process.env.HOSTED_BROWSER_SCREENSHOT_DIR || path.join('docs', 'sales', 'screenshots', '2026-06-29');
const MANIFEST_PATH =
  process.env.HOSTED_BROWSER_MANIFEST_PATH ||
  path.join('docs', 'progress', 'runs', '2026-06-29-hosted-fake-pilot-browser-proof.json');
const MISSING_0016_STATUS = 'HOSTED_PROOF_BLOCKED_REMOTE_D1_MISSING_0016';

const EDGE_CANDIDATES = [
  process.env.EDGE_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean);

const SECRET_PATTERNS = [
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /api[_-]?key/i,
  /BEGIN PRIVATE KEY/,
  /drive_file_id/i,
  /wrangler/i
];

const SCREENSHOT_PLAN = [
  {
    id: '01-signed-out-home',
    label: 'Signed-out workspace route',
    url: workspaceUrl(),
    viewport: desktopViewport(),
    expected: ['Sign in'],
    authRole: null
  },
  {
    id: '02-student-dashboard',
    label: 'Student dashboard',
    url: workspaceUrl('?section=student'),
    viewport: desktopViewport(),
    expected: ['My Capstone', 'Your next step', 'Show progress, feedback, and checklist'],
    absent: ['unavailable', 'could not load'],
    authRole: 'student'
  },
  {
    id: '03-program-teacher-dashboard',
    label: 'Program Teacher dashboard',
    url: workspaceUrl('?section=programDashboard'),
    viewport: desktopViewport(),
    expected: ['Projects that need you', 'Start here', 'Program list and reports'],
    absent: ['unavailable', 'could not load'],
    authRole: 'program_teacher'
  },
  {
    id: '04-mentor-dashboard',
    label: 'Mentor dashboard',
    url: workspaceUrl('?section=mentorDashboard'),
    viewport: desktopViewport(),
    expected: ['Your next check-in', 'Open check-in', 'Show filters and other students'],
    absent: ['unavailable', 'could not load'],
    authRole: 'mentor'
  },
  {
    id: '05-viewer-directory',
    label: 'Viewer read-only student directory',
    url: workspaceUrl('?section=students'),
    viewport: desktopViewport(),
    expected: ['Open one assigned student'],
    absent: ['unavailable', 'could not load'],
    authRole: 'viewer'
  },
  {
    id: '06-site-admin-dashboard',
    label: 'Site Admin dashboard',
    url: workspaceUrl('?section=siteDashboard'),
    viewport: desktopViewport(),
    expected: ['Start with the worklist'],
    absent: ['unavailable', 'could not load'],
    authRole: 'site_admin'
  },
  {
    id: '07-admin-command-center',
    label: 'Admin command center',
    url: workspaceUrl('?section=adminDashboard'),
    viewport: desktopViewport(),
    expected: ['Start with the worklist'],
    absent: ['unavailable', 'could not load'],
    authRole: 'admin'
  },
  {
    id: '08-misc-admin-readiness',
    label: 'Misc Admin readiness',
    url: workspaceUrl('?section=readiness'),
    viewport: desktopViewport(),
    expected: ['Check one report question'],
    absent: ['unavailable', 'could not load'],
    authRole: 'misc_admin'
  },
  {
    id: '09-student-mobile-dashboard',
    label: 'Student mobile dashboard',
    url: workspaceUrl('?section=student'),
    viewport: mobileViewport(),
    expected: ['My Capstone', 'Your next step', 'Show progress, feedback, and checklist'],
    absent: ['unavailable', 'could not load'],
    authRole: 'student'
  },
  {
    id: '10-site-admin-tablet-dashboard',
    label: 'Site Admin tablet dashboard',
    url: workspaceUrl('?section=siteDashboard'),
    viewport: tabletViewport(),
    expected: ['Site Admin', 'Start with the worklist'],
    absent: ['unavailable', 'could not load'],
    authRole: 'site_admin'
  }
];

function normalizeWorkspaceEntryPath(value) {
  const trimmed = String(value || '').trim() || '/workspace.html';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function workspaceUrl(search = '') {
  return `${WORKSPACE_ENTRY_PATH}${search}`;
}

function desktopViewport() {
  return { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false };
}

function mobileViewport() {
  return { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };
}

function tabletViewport() {
  return { width: 820, height: 900, deviceScaleFactor: 1, mobile: false };
}

function absoluteRepoPath(repoRelativePath) {
  return path.resolve(ROOT, repoRelativePath);
}

function normalizeAccountRole(role) {
  return String(role || '').trim().toLowerCase();
}

async function readAccounts() {
  const absolutePath = absoluteRepoPath(CREDENTIALS_PATH);
  const raw = await fs.readFile(absolutePath, 'utf8');
  const parsed = JSON.parse(raw);
  const accounts = Array.isArray(parsed) ? parsed : parsed.accounts || [];
  const byRole = new Map();
  for (const account of accounts) {
    const role = normalizeAccountRole(account.role || account.key);
    if (!role || byRole.has(role)) continue;
    const email = account.email || account.username;
    const password = account.password;
    if (email && password) {
      byRole.set(role, {
        email,
        password,
        mfaSecret: String(account.mfaSecret || '').trim()
      });
    }
  }
  const requiredRoles = [...new Set(SCREENSHOT_PLAN.map((item) => item.authRole).filter(Boolean))];
  const missing = requiredRoles.filter((role) => !byRole.has(role));
  if (missing.length) {
    throw new Error(`Missing hosted fake-account credentials for roles: ${missing.join(', ')}`);
  }
  return byRole;
}

async function persistFakeAccountMfaSecret(email, secret) {
  const absolutePath = absoluteRepoPath(CREDENTIALS_PATH);
  const secretsRoot = path.resolve(ROOT, '.secrets');
  const relativeToSecrets = path.relative(secretsRoot, absolutePath);
  if (relativeToSecrets.startsWith('..') || path.isAbsolute(relativeToSecrets)) {
    throw new Error('Refusing to store a fake-account MFA secret outside the ignored .secrets directory.');
  }

  const raw = await fs.readFile(absolutePath, 'utf8');
  const parsed = JSON.parse(raw);
  const accounts = Array.isArray(parsed) ? parsed : parsed.accounts || [];
  const account = accounts.find((item) => String(item.email || item.username || '').trim().toLowerCase() === String(email).trim().toLowerCase());
  if (!account) throw new Error('Could not find the fake account while saving its MFA test secret.');
  account.mfaSecret = secret;
  await fs.writeFile(absolutePath, `${JSON.stringify(parsed, null, 2)}\n`, { mode: 0o600 });
  await fs.chmod(absolutePath, 0o600).catch(() => {});
}

function findEdgePath() {
  const edgePath = EDGE_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!edgePath) {
    throw new Error(
      `Microsoft Edge was not found. Set EDGE_PATH or install Edge. Checked: ${EDGE_CANDIDATES.join(', ')}`
    );
  }
  return edgePath;
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.json();
}

async function verifyHostedMigrationReadiness(result) {
  const health = await fetchJson(`${BASE_URL}/api/health`);
  const publicFields = Object.keys(health).sort();
  const publicResponseMinimal = publicFields.length === 1 && publicFields[0] === 'ok' && health.ok === true;
  result.health = {
    publicEndpointReachable: true,
    publicResponseMinimal,
    protectedReadinessChecked: false,
    databaseReady: null,
    studentRosterProfilesReady: null,
    authMode: null,
    evidenceStorageProvider: null
  };
  if (!publicResponseMinimal) {
    result.failures.push({
      id: 'public-health-details',
      role: 'system',
      status: 'PUBLIC_HEALTH_DETAILS_EXPOSED',
      checks: {
        healthEndpointReachable: true,
        publicResponseMinimal: false,
        publicFields
      }
    });
    throw new Error('PUBLIC_HEALTH_DETAILS_EXPOSED: signed-out health must return only ok:true. Deploy the reviewed health route, then rerun hosted browser proof.');
  }
}

async function verifyProtectedMigrationReadiness(client, result) {
  const healthResult = await client.evaluate(
    `(async () => {
      const response = await fetch('/api/health', { credentials: 'include', headers: { accept: 'application/json' } });
      const body = await response.json().catch(() => ({}));
      return { status: response.status, body };
    })()`,
    { awaitPromise: true }
  );
  const readiness = healthResult?.body?.readiness;
  const ready = healthResult?.status === 200
    && healthResult?.body?.ok === true
    && readiness
    && readiness.databaseReady === true
    && readiness.studentRosterProfilesReady === true;
  result.health = {
    ...result.health,
    protectedReadinessChecked: true,
    databaseReady: readiness?.databaseReady === true,
    studentRosterProfilesReady: readiness?.studentRosterProfilesReady === true,
    authMode: readiness?.authMode || null,
    evidenceStorageProvider: readiness?.evidenceStorageProvider || null
  };
  if (!ready) {
    result.failures.push({
      id: 'migration-0016',
      role: 'admin',
      status: MISSING_0016_STATUS,
      checks: {
        protectedHealthStatus: healthResult?.status || null,
        databaseReady: readiness?.databaseReady === true,
        studentRosterProfilesReady: readiness?.studentRosterProfilesReady === true
      }
    });
    throw new Error(`${MISSING_0016_STATUS}: protected health is not ready. Sign in with the fake platform-admin account, use the approved deployment/migration gate outside the live demo if needed, then rerun hosted browser proof.`);
  }
}

async function waitForDevtools(port, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      return await fetchJson(`http://127.0.0.1:${port}/json/version`);
    } catch (error) {
      lastError = error;
      await sleep(250);
    }
  }
  throw new Error(`Timed out waiting for Edge DevTools endpoint: ${lastError?.message || 'unknown error'}`);
}

async function getPageWebSocketUrl(port) {
  const pages = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const page = pages.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl);
  if (!page) throw new Error('No debuggable Edge page target was found.');
  return page.webSocketDebuggerUrl;
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.waitingEvents = new Map();
    socket.addEventListener('message', (event) => this.handleMessage(event));
    socket.addEventListener('close', () => {
      for (const { reject } of this.pending.values()) reject(new Error('CDP socket closed'));
      this.pending.clear();
    });
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message}${message.error.data ? `: ${message.error.data}` : ''}`));
      else resolve(message.result);
      return;
    }

    if (message.method && this.waitingEvents.has(message.method)) {
      const waiters = this.waitingEvents.get(message.method);
      for (const waiter of waiters.splice(0)) waiter.resolve(message.params || {});
    }
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(payload);
    });
  }

  waitForEvent(method, timeoutMs = 15_000) {
    return new Promise((resolve, reject) => {
      const waiter = { resolve, reject };
      if (!this.waitingEvents.has(method)) this.waitingEvents.set(method, []);
      this.waitingEvents.get(method).push(waiter);
      setTimeout(() => {
        const waiters = this.waitingEvents.get(method) || [];
        const index = waiters.indexOf(waiter);
        if (index >= 0) waiters.splice(index, 1);
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs).unref();
    });
  }

  async evaluate(expression, { awaitPromise = false } = {}) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
    }
    return result.result?.value;
  }
}

async function connectToCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('Unable to connect to Edge CDP WebSocket')), { once: true });
  });
  return new CdpClient(socket);
}

async function navigate(client, targetUrl) {
  const loaded = client.waitForEvent('Page.loadEventFired', 20_000).catch(() => null);
  await client.send('Page.navigate', { url: targetUrl });
  await loaded;
  await waitForStableWorkspace(client);
}

async function waitForStableWorkspace(client) {
  const deadline = Date.now() + 20_000;
  let lastState = null;
  while (Date.now() < deadline) {
    const state = await client.evaluate(`(() => ({
      readyState: document.readyState,
      bodyText: document.body ? document.body.innerText.slice(0, 1000) : '',
      workspaceRoot: Boolean(document.querySelector('#workspaceRoot, [data-workspace-app]'))
    }))()`);
    lastState = state;
    const authShellStillLoading = /(^|\n)(Checking your session(?:\.\.\.)?|Signing in(?:\.\.\.)?|Loading your workspace(?:\.\.\.)?)(\n|$)/i.test(state.bodyText || '');
    if (state.readyState === 'complete' && !authShellStillLoading) {
      await sleep(1_000);
      return;
    }
    await sleep(300);
  }
  throw new Error(`Timed out waiting for hosted workspace UI to settle (ready=${lastState?.readyState || 'unknown'}, sample=${JSON.stringify(String(lastState?.bodyText || '').slice(0, 160))}).`);
}

async function setViewport(client, viewport) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: viewport.mobile,
    screenWidth: viewport.width,
    screenHeight: viewport.height
  });
  await client.send('Emulation.setVisibleSize', { width: viewport.width, height: viewport.height }).catch(() => {});
}

function decodeBase32(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let buffer = 0;
  const output = [];
  for (const character of String(value || '').toUpperCase().replace(/=+$/g, '')) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error('The fake account MFA secret is invalid.');
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function currentTotpCode(secret) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac('sha1', decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value = ((digest[offset] & 0x7f) << 24)
    | ((digest[offset + 1] & 0xff) << 16)
    | ((digest[offset + 2] & 0xff) << 8)
    | (digest[offset + 3] & 0xff);
  return String(value % 1_000_000).padStart(6, '0');
}

async function verifyMfa(client, challengeToken, code) {
  return client.evaluate(
    `(async () => {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ challengeToken: ${JSON.stringify(challengeToken)}, code: ${JSON.stringify(code)} })
      });
      const body = await response.json().catch(() => ({}));
      return { status: response.status, ok: body && body.ok === true, error: body && body.error ? body.error : null };
    })()`,
    { awaitPromise: true }
  );
}

async function login(client, account) {
  const result = await client.evaluate(
    `(async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: ${JSON.stringify(account.email)}, password: ${JSON.stringify(account.password)} })
      });
      const body = await response.json().catch(() => ({}));
      return {
        status: response.status,
        ok: body && body.ok === true,
        error: body && body.error ? body.error : null,
        challengeToken: body && body.challengeToken ? body.challengeToken : '',
        mfaMode: body && body.mfa && body.mfa.mode ? body.mfa.mode : '',
        mfaSecret: body && body.mfa && body.mfa.secret ? body.mfa.secret : ''
      };
    })()`,
    { awaitPromise: true }
  );
  if (result?.status === 200 && result?.ok === true) {
    return { status: result.status, ok: result.ok, mfa: false };
  }
  if (result?.status !== 202 || !['mfa_enrollment_required', 'mfa_required'].includes(result?.error)) {
    throw new Error(`Login failed with HTTP ${result?.status || 'unknown'}${result?.error ? ` (${result.error})` : ''}`);
  }

  const enrollment = result.error === 'mfa_enrollment_required';
  const secret = enrollment ? result.mfaSecret : account.mfaSecret;
  if (!result.challengeToken || !secret) {
    throw new Error(`MFA ${enrollment ? 'enrollment' : 'sign-in'} could not continue for a fake test account.`);
  }

  let verification = await verifyMfa(client, result.challengeToken, currentTotpCode(secret));
  if (verification?.error === 'invalid_mfa_code') {
    const waitMs = 30_000 - (Date.now() % 30_000) + 750;
    await sleep(waitMs);
    verification = await verifyMfa(client, result.challengeToken, currentTotpCode(secret));
  }
  if (verification?.status !== 200 || verification?.ok !== true) {
    throw new Error(`MFA verification failed with HTTP ${verification?.status || 'unknown'}${verification?.error ? ` (${verification.error})` : ''}`);
  }
  if (enrollment) {
    account.mfaSecret = secret;
    await persistFakeAccountMfaSecret(account.email, secret);
  }
  return { status: verification.status, ok: verification.ok, mfa: true, enrolled: enrollment };
}

async function logout(client) {
  await client.evaluate(
    `(async () => {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => null);
      localStorage.clear();
      sessionStorage.clear();
      return true;
    })()`,
    { awaitPromise: true }
  ).catch(() => {});
}

async function captureScreenshot(client, outputPath) {
  const result = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false
  });
  await fs.writeFile(outputPath, Buffer.from(result.data, 'base64'));
}

async function collectPageState(client) {
  return client.evaluate(`(() => {
    const text = document.body ? document.body.innerText : '';
    const visiblePasswordValues = Array.from(document.querySelectorAll('input[type="password"]'))
      .map((input) => input.value || '')
      .filter(Boolean);
    const activeNav = Array.from(document.querySelectorAll('[aria-current="page"], .active, .is-active'))
      .map((node) => node.textContent.trim())
      .filter(Boolean)
      .slice(0, 10);
    return {
      title: document.title,
      url: location.href,
      text,
      textSample: text.replace(/\\s+/g, ' ').trim().slice(0, 600),
      visiblePasswordValueCount: visiblePasswordValues.length,
      heading: (document.querySelector('h1, h2') || {}).textContent || '',
      activeNav
    };
  })()`);
}

function checkPage(planItem, pageState) {
  const text = `${pageState.heading || ''}\n${pageState.text || ''}`;
  const missingExpectedText = planItem.expected.filter((marker) => !text.includes(marker));
  const unexpectedTextPresent = (planItem.absent || []).filter((marker) => text.toLowerCase().includes(marker.toLowerCase()));
  const secretMatches = SECRET_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  return {
    expectedTextPresent: missingExpectedText.length === 0,
    missingExpectedText,
    unexpectedTextAbsent: unexpectedTextPresent.length === 0,
    unexpectedTextPresent,
    noVisiblePasswordValues: pageState.visiblePasswordValueCount === 0,
    noSecretLikeText: secretMatches.length === 0,
    secretPatternMatches: secretMatches
  };
}

async function writeManifest(result) {
  await fs.mkdir(path.dirname(absoluteRepoPath(MANIFEST_PATH)), { recursive: true });
  await fs.writeFile(absoluteRepoPath(MANIFEST_PATH), `${JSON.stringify(result, null, 2)}\n`);
}

async function run() {
  const startedAt = new Date().toISOString();
  const accountsByRole = await readAccounts();
  const edgePath = findEdgePath();
  const port = await getFreePort();
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'senior-capstone-hosted-browser-'));
  const screenshotsAbsoluteDir = absoluteRepoPath(SCREENSHOT_DIR);
  await fs.mkdir(screenshotsAbsoluteDir, { recursive: true });

  const edge = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], {
    stdio: ['ignore', 'ignore', 'pipe']
  });

  let client;
  const stderr = [];
  edge.stderr.on('data', (chunk) => {
    stderr.push(chunk.toString());
  });

  const result = {
    proof: 'hosted_fake_pilot_browser',
    verdict: 'PENDING',
    baseUrl: BASE_URL,
    workspaceEntryPath: WORKSPACE_ENTRY_PATH,
    startedAt,
    completedAt: null,
    browser: {
      executable: edgePath,
      devtoolsProtocol: null
    },
    screenshotDir: SCREENSHOT_DIR.replaceAll('\\', '/'),
    manifestPath: MANIFEST_PATH.replaceAll('\\', '/'),
    realStudentProductionStatus: 'NOT_CLAIMED_READY',
    health: null,
    screenshots: [],
    failures: []
  };

  try {
    await verifyHostedMigrationReadiness(result);
    const version = await waitForDevtools(port);
    result.browser.devtoolsProtocol = version['Protocol-Version'] || null;
    const webSocketUrl = await getPageWebSocketUrl(port);
    client = await connectToCdp(webSocketUrl);
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable');

    for (const planItem of SCREENSHOT_PLAN) {
      await setViewport(client, planItem.viewport);
      await navigate(client, `${BASE_URL}${WORKSPACE_ENTRY_PATH}`);
      await logout(client);
      let loginResult = null;
      if (planItem.authRole) {
        loginResult = await login(client, accountsByRole.get(planItem.authRole));
      }
      if (planItem.authRole === 'admin') {
        await verifyProtectedMigrationReadiness(client, result);
      }
      await navigate(client, `${BASE_URL}${planItem.url}`);
      const pageState = await collectPageState(client);
      const checks = checkPage(planItem, pageState);
      const relativePath = path.join(SCREENSHOT_DIR, `${planItem.id}.png`).replaceAll('\\', '/');
      const absolutePath = absoluteRepoPath(relativePath);
      await captureScreenshot(client, absolutePath);
      const passed = checks.expectedTextPresent && checks.unexpectedTextAbsent && checks.noVisiblePasswordValues && checks.noSecretLikeText;
      if (!passed) {
        result.failures.push({
          id: planItem.id,
          role: planItem.authRole || 'signed_out',
          checks
        });
      }
      result.screenshots.push({
        id: planItem.id,
        label: planItem.label,
        role: planItem.authRole || 'signed_out',
        url: pageState.url,
        viewport: planItem.viewport,
        screenshot: relativePath,
        login: loginResult,
        checks,
        heading: String(pageState.heading || '').trim(),
        textSample: pageState.textSample,
        activeNav: pageState.activeNav
      });
      console.log(`${passed ? 'PASS' : 'FAIL'} ${planItem.id} ${planItem.label} -> ${relativePath}`);
    }

    result.completedAt = new Date().toISOString();
    result.verdict = result.failures.length ? 'NOT_GREEN' : 'GREEN_FAKE_ACCOUNT_HOSTED_BROWSER_PROOF';
    await writeManifest(result);
    if (result.failures.length) {
      throw new Error(`Hosted browser proof failed for ${result.failures.length} screenshot(s).`);
    }
  } catch (error) {
    result.completedAt = new Date().toISOString();
    result.verdict = 'NOT_GREEN';
    result.error = error.message;
    result.edgeStderrTail = stderr.join('').split(/\r?\n/).filter(Boolean).slice(-20);
    await writeManifest(result).catch(() => {});
    throw error;
  } finally {
    if (client) {
      await client.socket.close();
    }
    if (!edge.killed) edge.kill();
    await fs.rm(userDataDir, { recursive: true, force: true }).catch(() => {});
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
