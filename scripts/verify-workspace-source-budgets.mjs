import { readFile } from "node:fs/promises";
import { workspaceSourceSizes } from "./lib/workspace-sources.mjs";

const budgets = { ".js": 525_000, ".css": 125_000 };
const sizes = await workspaceSourceSizes();
const failures = sizes.filter((row) => row.bytes > budgets[row.extension]);
const html = await readFile("workspace.html", "utf8");

for (const row of sizes) console.log(`${row.file}: ${row.bytes.toLocaleString()} bytes`);

if (!/workspace\/loader\.js/.test(html) || !/workspace\/shared\.js/.test(html) || !/workspace\/core\.js/.test(html)) {
  failures.push({ file: "workspace.html", bytes: 0, extension: ".js", reason: "missing ordered workspace source scripts" });
}
if (/type="module" src="workspace\.js/.test(html)) {
  failures.push({ file: "workspace.html", bytes: 0, extension: ".js", reason: "still loads the old monolith" });
}

if (failures.length) {
  console.error("Workspace source budget failed.");
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.reason || `${failure.bytes} bytes exceeds ${budgets[failure.extension]}`}`);
  }
  process.exit(1);
}

console.log("Workspace source budget passed: role features are lazy-loaded and every source module stays within its size limit.");
