import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const guidelinePath = "docs/design/plain-language-and-esl-ui-guidelines.md";
const studentOnboardingPath = "docs/demo/student-pilot-onboarding-checklist.md";
const staffOnboardingPath = "docs/demo/staff-pilot-onboarding-checklist.md";

function read(file) {
  return readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("plain-language and ESL UI guideline exists and covers required copy rules", () => {
  assert.equal(existsSync(guidelinePath), true);
  const guideline = read(guidelinePath);

  for (const heading of [
    "Core Rules",
    "Student Copy Rules",
    "Staff Copy Rules",
    "Admin Copy Rules",
    "Error-State Rules",
    "Empty-State Rules",
    "Status Labels",
    "Action Labels",
    "Banned Or Discouraged Student UI Phrases",
    "ESL And Lower-Reading-Level Tips",
    "Readiness And Privacy Rules",
    "Before And After Examples",
    "Contributor Checklist",
  ]) {
    assert.match(guideline, new RegExp(`## ${escapeRegex(heading)}`));
  }

  for (const phrase of [
    "What am I working on?",
    "What do I do next?",
    "Where do I click?",
    "No feedback yet.",
    "We could not load your capstone right now.",
    "Read-only access. You can view this student, but you cannot make changes.",
    "Check the highlighted fields.",
    "Not confirmed yet",
    "Needs changes",
    "Send updated work",
    "Upload Proof File",
    "Fake-account proof is not real-student pilot approval.",
  ]) {
    assert.match(guideline, new RegExp(escapeRegex(phrase), "i"));
  }
});

test("student banned phrase list and approved labels stay explicit", () => {
  const guideline = read(guidelinePath);

  for (const banned of [
    "RBAC",
    "mutation",
    "hydration",
    "manifest",
    "fake pilot",
    "proof script",
    "Forbidden",
    "Unauthorized",
    "Showing 0 of 0",
    "Admin Console",
    "Staff Workspace",
    "Submitted Work",
    "Evidence / Files",
    "Needs Revision",
  ]) {
    assert.match(guideline, new RegExp(escapeRegex(banned)));
  }

  for (const approved of [
    "Continue My Work",
    "View Feedback",
    "Turn in Work",
    "Send updated work",
    "Ask for Help",
    "Open Student",
    "Review Work",
    "View Proof Files",
  ]) {
    assert.match(guideline, new RegExp(escapeRegex(approved)));
  }
});

test("pilot onboarding docs link the guideline and use simple student steps", () => {
  const student = read(studentOnboardingPath);
  const staff = read(staffOnboardingPath);
  const readme = read("README.md");

  for (const doc of [student, staff, readme]) {
    assert.match(doc, new RegExp(escapeRegex(guidelinePath)));
  }

  for (const phrase of [
    "Sign in.",
    "Open My Capstone.",
    "Start on Today.",
    "Do the item marked next.",
    "Open Feedback if something needs changes.",
    "Ask for help if work, feedback, or proof files look wrong.",
  ]) {
    assert.match(student, new RegExp(escapeRegex(phrase)));
  }

  assert.match(staff, /what changed, what the student should fix, and when to send updated work/i);
  assert.match(staff, /missing proof files/i);
});
