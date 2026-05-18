import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [scriptArg, ...scriptArgs] = process.argv.slice(2);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

if (!scriptArg) {
  console.error("Usage: node scripts/run-powershell-script.mjs <script.ps1> [args...]");
  process.exit(1);
}

const scriptPathCandidates = [
  resolve(process.cwd(), scriptArg),
  resolve(repoRoot, scriptArg),
];
const scriptPath = scriptPathCandidates.find((candidate) => existsSync(candidate)) ?? scriptPathCandidates[0];
if (!existsSync(scriptPath)) {
  console.error(`PowerShell script not found: ${scriptPath}`);
  process.exit(1);
}

const candidates = [
  process.env.POWERSHELL,
  process.platform === "win32" ? "powershell.exe" : "pwsh",
  process.platform === "win32" ? "pwsh" : "powershell",
].filter(Boolean);

for (const candidate of candidates) {
  const args = ["-NoProfile", "-NonInteractive"];
  if (process.platform === "win32") {
    args.push("-ExecutionPolicy", "Bypass");
  }
  args.push("-File", scriptPath, ...scriptArgs);

  const result = spawnSync(candidate, args, {
    cwd: repoRoot,
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.error?.code === "ENOENT") {
    continue;
  }

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

console.error(
  "No PowerShell runtime found. Install PowerShell or set POWERSHELL to the executable path.",
);
process.exit(1);
