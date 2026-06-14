import { spawnSync } from "node:child_process";

const stages = [
  {
    label: "Import users and account lifecycle",
    tests: ["tests/admin-users-import.integration.test.mjs", "tests/admin-password-reset.integration.test.mjs"],
  },
  {
    label: "Student proof upload/link and submission",
    tests: ["tests/evidence-link.integration.test.mjs", "tests/evidence-drive-file.integration.test.mjs", "tests/review-loop.integration.test.mjs"],
  },
  {
    label: "Program Teacher revision, resubmit, and approval loop",
    tests: ["tests/review-loop.integration.test.mjs", "tests/site-review-queue.integration.test.mjs"],
  },
  {
    label: "Mentor meeting proof",
    tests: ["tests/mentor-meetings.integration.test.mjs"],
  },
  {
    label: "Presentation readiness and check-in/out",
    tests: ["tests/presentation-slots.integration.test.mjs"],
  },
  {
    label: "Final files, archive readiness, and package download",
    tests: ["tests/archive-readiness.integration.test.mjs"],
  },
];

const uniqueTests = Array.from(new Set(stages.flatMap((stage) => stage.tests)));
const result = spawnSync(process.execPath, ["--test", ...uniqueTests], {
  cwd: process.cwd(),
  encoding: "utf8",
});

console.log("# Local Fake-Account Pilot Flow Proof");
for (const stage of stages) {
  console.log(`- ${stage.label}: ${stage.tests.join(", ")}`);
}

if (result.stdout) console.log(result.stdout.trim());
if (result.stderr) console.error(result.stderr.trim());

if (result.status !== 0) {
  console.error("Local fake-account pilot flow proof failed.");
  process.exit(result.status || 1);
}

console.log("Local fake-account pilot flow proof passed.");
