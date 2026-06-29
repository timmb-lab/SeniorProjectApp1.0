import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = process.cwd();
const BASE_URL = (process.env.HOSTED_BASE_URL || 'https://senior-capstone-app.pages.dev').replace(/\/$/, '');
const WORKSPACE_ENTRY_PATH = normalizeWorkspaceEntryPath(process.env.WORKSPACE_BROWSER_ENTRY_PATH || '/workspace.html');
const CREDENTIALS_PATH = process.env.TEST_ACCOUNTS_PATH || path.join('.secrets', 'test-accounts-2026-05-18.json');
const SCREENSHOT_DIR = process.env.HOSTED_BROWSER_SCREENSHOT_DIR || path.join('docs', 'sales', 'screenshots', '2026-06-29');
const MANIFEST_PATH =
  process.env.HOSTED_BROWSER_MANIFEST_PATH ||
  path.join('docs', 'progress', 'runs', '2026-06-29-hosted-fake-pilot-browser-proof.json');

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
    expected: ['My Work', 'Upcoming deadlines'],
    authRole: 'student'
  },
  {
    id: '03-program-teacher-dashboard',
    label: 'Program Teacher dashboard',
    url: workspaceUrl('?section=programDashboard'),
    viewport: desktopViewport(),
    expected: ['Program Dashboard'],
    authRole: 'program_teacher'
  },
  {
    id: '04-mentor-dashboard',
    label: 'Mentor dashboard',
    url: workspaceUrl('?section=mentorDashboard'),
    viewport: desktopViewport(),
    expected: ['Mentor Dashboard'],
    authRole: 'mentor'
  },
  {
    id: '05-viewer-directory',
    label: 'Viewer read-only student directory',
    url: workspaceUrl('?section=students'),
    viewport: desktopViewport(),
    expected: ['Student Directory'],
    authRole: 'viewer'
  },
  {
    id: '06-site-admin-dashboard',
    label: 'Site Admin dashboard',
    url: workspaceUrl('?section=siteDashboard'),
    viewport: desktopViewport(),
    expected: ['Site Dashboard'],
    authRole: 'site_admin'
  },
  {
    id: '07-admin-command-center',
    label: 'Admin command center',
    url: workspaceUrl('?section=adminDashboard'),
    viewport: desktopViewport(),
    expected: ['Admin Command Center'],
    authRole: 'admin'
  },
  {
    id: '08-misc-admin-readiness',
    label: 'Misc Admin readiness',
    url: workspaceUrl('?section=readiness'),
    viewport: desktopViewport(),
    expected: ['Readiness'],
    authRole: 'misc_admin'
  },
  {
    id: '09-student-mobile-dashboard',
    label: 'Student mobile dashboard',
    url: workspaceUrl('?section=student'),
    viewport: mobileViewport(),
    expected: ['My Work', 'Upcoming deadlines'],
    authRole: 'student'
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
    if (email && password) byRole.set(role, { email, password });
  }
  const requiredRoles = [...new Set(SCREENSHOT_PLAN.map((item) => item.authRole).filter(Boolean))];
  const missing = requiredRoles.filter((role) => !byRole.has(role));
  if (missing.length) {
    throw new Error(`Missing hosted fake-account credentials for roles: ${missing.join(', ')}`);
  }
  return byRole;
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
  while (Date.now() < deadline) {
    const state = await client.evaluate(`(() => ({
      readyState: document.readyState,
      bodyText: document.body ? document.body.innerText.slice(0, 1000) : '',
      workspaceRoot: Boolean(document.querySelector('#workspaceRoot, [data-workspace-app]'))
    }))()`);
    const loading = /Loading (your )?workspace|Checking your session|Signing in/i.test(state.bodyText || '');
    if (state.readyState === 'complete' && !loading) {
      await sleep(600);
      return;
    }
    await sleep(300);
  }
  throw new Error('Timed out waiting for hosted workspace UI to settle.');
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
      return { status: response.status, ok: body && body.ok === true, error: body && body.error ? body.error : null };
    })()`,
    { awaitPromise: true }
  );
  if (result?.status !== 200 || result?.ok !== true) {
    throw new Error(`Login failed with HTTP ${result?.status || 'unknown'}${result?.error ? ` (${result.error})` : ''}`);
  }
  return { status: result.status, ok: result.ok };
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
  const secretMatches = SECRET_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  return {
    expectedTextPresent: missingExpectedText.length === 0,
    missingExpectedText,
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
    screenshots: [],
    failures: []
  };

  try {
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
      await navigate(client, `${BASE_URL}${planItem.url}`);
      const pageState = await collectPageState(client);
      const checks = checkPage(planItem, pageState);
      const relativePath = path.join(SCREENSHOT_DIR, `${planItem.id}.png`).replaceAll('\\', '/');
      const absolutePath = absoluteRepoPath(relativePath);
      await captureScreenshot(client, absolutePath);
      const passed = checks.expectedTextPresent && checks.noVisiblePasswordValues && checks.noSecretLikeText;
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
