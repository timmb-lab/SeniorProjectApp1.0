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
    pattern: /\bPermission denied\b/i,
    message: "Protected workspace should explain missing access without technical denial language.",
  },
  {
    pattern: /\bRole scoped views\b/i,
    message: "Protected workspace should use school-facing assigned-record language instead of role-scope jargon.",
  },
  {
    pattern: /\bselected-site\b/i,
    message: "Protected workspace should say current school or current site, not selected-site.",
  },
  {
    pattern: /\brole or scope\b/i,
    message: "Protected workspace should explain missing access without role/scope jargon.",
  },
  {
    pattern: /\bAssignment form unavailable\b/i,
    message: "Mentor assignment empty states should explain that no assignment can be made right now.",
  },
  {
    pattern: /\bAssignment action\b/i,
    message: "Read-only mentor coverage should not imply assignment action is available.",
  },
  {
    pattern: /\bSource record counts\b/i,
    message: "Program Teacher dashboard should describe program summaries in school-facing language.",
  },
  {
    pattern: /\bVisible in this role scope\b/i,
    message: "Program Teacher dashboard should describe assigned program or cohort visibility without role-scope jargon.",
  },
  {
    pattern: /\bassigned scope\b/i,
    message: "Program Teacher dashboard should say assigned program or cohort instead of assigned scope.",
  },
  {
    pattern: /\bScoped dashboard unavailable\b/i,
    message: "Program Teacher dashboard load failures should use plain dashboard language.",
  },
  {
    pattern: /\bScoped Student Progress\b/i,
    message: "Program Teacher dashboard heading should use assigned-student language.",
  },
  {
    pattern: /\bGlobal scope\b/i,
    message: "Protected workspace access chips should not show raw global-scope language.",
  },
  {
    pattern: /\bsite:[a-z0-9_-]+\b/i,
    message: "Protected workspace access chips should not show raw site scope ids.",
  },
  {
    pattern: /\bprogram:[a-z0-9_-]+\b/i,
    message: "Protected workspace access chips should not show raw program scope ids.",
  },
  {
    pattern: /\btotal in scope\b/i,
    message: "Protected workspace list totals should use plain availability language instead of scope jargon.",
  },
  {
    pattern: /\bcurrent site and role scope\b/i,
    message: "Student detail errors should use school-assignment language instead of role-scope jargon.",
  },
  {
    pattern: /\brole and site scope\b/i,
    message: "Student timeline errors should use account and school-assignment language.",
  },
  {
    pattern: /\brole scope\b/i,
    message: "Protected workspace should not ask users to check role scope.",
  },
  {
    pattern: /\bteacher scope\b/i,
    message: "Protected workspace should say assigned teacher list instead of teacher scope.",
  },
  {
    pattern: /\bscoped program teachers\b/i,
    message: "Read-only review copy should say assigned program teachers.",
  },
  {
    pattern: /\bScoped program teacher\b/i,
    message: "Review panels should say assigned program teacher instead of scoped program teacher.",
  },
  {
    pattern: /\bActive mentor scope\b/i,
    message: "Mentor dashboard cards should say active mentor assignments.",
  },
  {
    pattern: /\bscoped app delivery\b/i,
    message: "Archive file copy should say protected app delivery instead of scoped app delivery.",
  },
  {
    pattern: /\bNo review rows match\b/i,
    message: "Review Queue empty states should describe matching review work, not data rows.",
  },
  {
    pattern: /\bNo review items match these filters\b/i,
    message: "Review Queue empty states should use work/submission language instead of item language.",
  },
  {
    pattern: /\bNo review history is loaded yet\b/i,
    message: "Review history empty states should separate true no-data from load failure.",
  },
  {
    pattern: /\bassigned access\b/i,
    message: "Review Queue empty states should say assigned school/program review work instead of assigned access.",
  },
  {
    pattern: /\bReview actions unavailable\b/i,
    message: "Review Queue disabled decisions should explain whether the row is read-only or not submitted for review.",
  },
  {
    pattern: /\bprotected comments? available for this submission\b/i,
    message: "Review Queue comment history should show visibility counts instead of vague protected-comment availability copy.",
  },
  {
    pattern: /\bNo presentation rows match\b/i,
    message: "Operations empty states should describe matching presentation work, not data rows.",
  },
  {
    pattern: /\bNo archive rows match\b/i,
    message: "Operations empty states should describe matching archive work, not data rows.",
  },
  {
    pattern: /\bNo attention rows match\b/i,
    message: "Operations empty states should describe matching attention work, not data rows.",
  },
  {
    pattern: /\bstorage identifiers redacted\b/i,
    message: "Protected workspace should say private file details are protected instead of showing storage jargon.",
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
