import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const [scriptArg, ...scriptArgs] = process.argv.slice(2);

if (!scriptArg) {
  console.error("Usage: node scripts/run-powershell-script.mjs <script.ps1> [args...]");
  process.exit(1);
}

const scriptPath = resolve(process.cwd(), scriptArg);
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
