import { readFileSync } from "node:fs";

const protectedUiFiles = ["workspace.html", "workspace.js"];
const reviewOnlyFiles = ["app.js", "public-companion/app.js"];

const hardFailures = [
  {
    pattern: /\bDatabase-backed MVP\b/i,
    message: "Protected workspace must not describe itself as a database-backed MVP.",
  },
  {
    pattern: /\bCloudflare target\b/i,
    message: "Protected workspace must not show infrastructure target language.",
  },
  {
    pattern: /\bAudit-sensitive admin\b/i,
    message: "Protected workspace must not show internal audit posture language as a product chip.",
  },
  {
    pattern: /\bSenior Capstone Product\b/i,
    message: "Protected workspace should use school-facing product naming.",
  },
  {
    pattern: /\bRBAC denied\b/i,
    message: "Protected workspace must not show RBAC jargon to users.",
  },
  {
    pattern: /\bNo tenant context found\b/i,
    message: "Protected workspace must not show tenant-debug language to users.",
  },
  {
    pattern: /\bprompt-generated\b/i,
    message: "Protected workspace must not show prompt-generated language.",
  },
  {
    pattern: /\bdeveloper prototype\b/i,
    message: "Protected workspace must not show developer prototype language.",
  },
  {
    pattern: /\bhref=(['"])#\1/i,
    message: "Protected workspace must not include dead hash links.",
  },
  {
    pattern: /\bhref=(['"])\1/i,
    message: "Protected workspace must not include empty links.",
  },
];

const reviewPatterns = [
  {
    pattern: /final hosted app still needs database-backed accounts/i,
    message: "Public app-preview still contains implementation-readiness copy; keep queued for a public-site language slice.",
  },
  {
    pattern: /Targets active Figma file/i,
    message: "Public app-preview contains design-artifact language; keep queued for a public-site language slice.",
  },
  {
    pattern: /unauthorized\.denied/i,
    message: "Public app-preview contains technical event language; keep queued for a public-site language slice.",
  },
];

const failures = [];
const notices = [];

for (const file of protectedUiFiles) {
  const text = readFileSync(file, "utf8");
  for (const rule of hardFailures) {
    if (rule.pattern.test(text)) {
      failures.push(`${file}: ${rule.message}`);
    }
  }
}

for (const file of reviewOnlyFiles) {
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const rule of reviewPatterns) {
    if (rule.pattern.test(text)) {
      notices.push(`${file}: ${rule.message}`);
    }
  }
}

for (const notice of notices) {
  console.log(`Review notice: ${notice}`);
}

if (failures.length) {
  console.error("Functionality language verification failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Functionality language verification passed.");
console.log(`Checked protected UI files: ${protectedUiFiles.join(", ")}`);
if (notices.length) console.log(`Review-only notices: ${notices.length}`);
