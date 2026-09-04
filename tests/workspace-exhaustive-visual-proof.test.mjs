import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(".");
const proofScriptPath = "scripts/prove-workspace-ui-polish.mjs";
const provisionScriptPath = "scripts/provision-local-visual-audit-account.mjs";
const manifestPath = "docs/progress/runs/2026-09-03-exhaustive-visual-pass/browser-proof.json";

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8").replace(/^\uFEFF/, "");
}

function quotedValues(source) {
  return [...source.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

test("exhaustive visual plan covers every current top-level section and role", () => {
  const proof = read(proofScriptPath);
  const core = read("workspace/core.js");
  const sectionStart = core.indexOf("const WORKSPACE_SECTION_IDS");
  const sectionEnd = core.indexOf("]);", sectionStart);
  const currentSections = quotedValues(core.slice(sectionStart, sectionEnd));

  const matrixStart = proof.indexOf("const EXHAUSTIVE_ROLE_SURFACES");
  const matrixEnd = proof.indexOf("const EXHAUSTIVE_RESPONSIVE_PROFILES", matrixStart);
  const matrix = proof.slice(matrixStart, matrixEnd);
  const matrixSections = [...matrix.matchAll(/(?:workspace|admin): \[([^\]]*)\]/g)]
    .flatMap((match) => quotedValues(match[1]));

  assert.deepEqual([...new Set(matrixSections)].sort(), [...new Set(currentSections)].sort());
  assert.equal(matrixSections.length, 122, "role/mode section matrix drifted");
  for (const role of ["student", "mentor", "viewer", "program_teacher", "administration", "site_admin", "admin"]) {
    assert.match(matrix, new RegExp(`^  ${role}: \\{`, "m"), `${role} role surface matrix`);
  }
  assert.match(proof, /WORKSPACE_UI_POLISH_EXHAUSTIVE/);
  assert.match(proof, /openAllDisclosures/);
  assert.match(proof, /everyDisclosureExpandedPerRoleSurfaceInDarkDesktop/);
  assert.doesNotMatch(proof, /normalized === "administration"\) return "misc_admin"/);

  const profileStart = proof.indexOf("const EXHAUSTIVE_RESPONSIVE_PROFILES");
  const profileEnd = proof.indexOf("function exhaustiveWorkspaceUrl", profileStart);
  const profiles = proof.slice(profileStart, profileEnd);
  for (const width of [360, 390, 820, 1366]) assert.match(profiles, new RegExp(`width: ${width}\\b`));
  for (const name of ["chromebook-light", "chromebook-dark", "short-light", "short-dark", "tablet-light", "tablet-dark", "narrow-phone-light", "narrow-phone-dark", "phone-light", "phone-dark"]) {
    assert.match(profiles, new RegExp(`"${name}"`));
  }
});

test("local visual-audit account helper is synthetic and loopback-only", () => {
  const source = read(provisionScriptPath);
  assert.match(source, /127\.0\.0\.1:8788/);
  assert.match(source, /assertLoopback/);
  assert.match(source, /senior-capstone\.test/);
  assert.match(source, /syntheticOnly: true/);
  assert.match(source, /role: "administration"/);
  assert.doesNotMatch(source, /thecapstoneproject\.com|--remote|db:migrate:remote|deploy/);
});

test("fresh exhaustive browser proof is green and maps every audited pane", () => {
  assert.equal(existsSync(path.join(repoRoot, manifestPath)), true, "run the fresh exhaustive browser proof");
  const manifest = JSON.parse(read(manifestPath));
  assert.equal(manifest.proof, "workspace_ui_polish_local_browser");
  assert.equal(manifest.verdict, "GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF");
  assert.deepEqual(manifest.failures, []);
  assert.equal(manifest.coverage?.mode, "exhaustive");
  assert.equal(manifest.coverage?.canonicalInteractiveCases, 107);
  assert.equal(manifest.coverage?.generatedAuditCases, 544);
  assert.equal(manifest.coverage?.roles?.length, 7);
  assert.equal(manifest.coverage?.topLevelSections?.length, 30);
  assert.equal(manifest.coverage?.responsiveProfiles?.length, 10);
  assert.equal(manifest.screenshots?.length, 651);

  let captured = 0;
  let auditOnly = 0;
  for (const screen of manifest.screenshots) {
    assert.equal(screen.checks?.expectedTextPresent, true, `${screen.id} expected text`);
    assert.equal(screen.checks?.noUnexpectedText, true, `${screen.id} unexpected text`);
    assert.equal(screen.checks?.noHorizontalOverflow, true, `${screen.id} overflow`);
    assert.equal(screen.checks?.topbarLayoutSafe, true, `${screen.id} topbar`);
    assert.equal(screen.checks?.expectedThemeApplied, true, `${screen.id} theme`);
    assert.equal(screen.checks?.readableBaseType, true, `${screen.id} type`);
    assert.equal(screen.checks?.wcagTextContrast, true, `${screen.id} contrast`);
    assert.equal(screen.checks?.noTinyTargets, true, `${screen.id} targets`);
    assert.equal(screen.checks?.allDisclosuresOpenWhenRequested, true, `${screen.id} disclosures`);
    if (screen.screenshot) {
      captured += 1;
      const screenshotPath = path.join(repoRoot, screen.screenshot);
      assert.equal(existsSync(screenshotPath), true, `${screen.screenshot} exists`);
      assert.ok(statSync(screenshotPath).size > 10_000, `${screen.screenshot} is not blank`);
    } else {
      auditOnly += 1;
    }
  }
  assert.equal(captured, 319);
  assert.equal(auditOnly, 332);
});
