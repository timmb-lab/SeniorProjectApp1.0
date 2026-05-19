#!/usr/bin/env node

if (process.argv.includes("--health")) {
  process.stdout.write(JSON.stringify({ ok: true, adapter: "mock-figma-writer" }));
  process.exit(0);
}

let input = "";
for await (const chunk of process.stdin) input += chunk;
const payload = JSON.parse(input || "{}");

process.stdout.write(
  JSON.stringify({
    changedNodeId: `mock-writer:${payload.runId}:${payload.taskId}`,
    appliedChangeSummary:
      `Mock writer applied one sandbox operation for ${payload.taskId} to ` +
      `${payload.targetPage} / ${payload.targetFrame}; no real Figma file was touched.`
  }),
);
