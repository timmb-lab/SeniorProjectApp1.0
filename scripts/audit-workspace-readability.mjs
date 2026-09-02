import ts from "typescript";
import { readWorkspaceJavaScriptSource } from "./lib/workspace-sources.mjs";

const source = await readWorkspaceJavaScriptSource({ includeBootstrap: false });
const approvedSchoolWords = new Set([
  "account", "admin", "capstone", "dashboard", "deadline", "feedback", "google", "mentor", "password",
  "phase", "presentation", "program", "project", "proof", "reflection", "requirement", "review", "school",
  "student", "submission", "teacher", "template", "timeline", "workspace",
]);

function decodeSourceString(value) {
  return String(value || "")
    .replace(/\$\{[\s\S]*?\}/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, ". ")
    .replace(/&(?:nbsp|amp|quot|#39);/g, " ")
    .replace(/\\n|\\t|\\r/g, " ")
    .replace(/\\["'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wordsIn(value) {
  return String(value || "").match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
}

function syllablesIn(rawWord) {
  const word = String(rawWord || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!word || word.length <= 3 || approvedSchoolWords.has(word)) return 1;
  const simplified = word
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/i, "")
    .replace(/^y/i, "");
  return Math.max(1, (simplified.match(/[aeiouy]{1,2}/g) || []).length);
}

function gradeFor(value) {
  const words = wordsIn(value);
  if (!words.length) return 0;
  const sentences = Math.max(1, (String(value).match(/[.!?]+(?:\s|$)/g) || []).length);
  const syllables = words.reduce((total, word) => total + syllablesIn(word), 0);
  return Math.max(0, 0.39 * (words.length / sentences) + 11.8 * (syllables / words.length) - 15.59);
}

const candidates = [];
const sourceFile = ts.createSourceFile("workspace.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
function collectText(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    candidates.push(decodeSourceString(node.text));
  } else if (ts.isTemplateExpression(node)) {
    candidates.push(decodeSourceString(node.head.text));
    for (const span of node.templateSpans) candidates.push(decodeSourceString(span.literal.text));
  }
  ts.forEachChild(node, collectText);
}
collectText(sourceFile);

const uiCopy = [...new Set(candidates.flatMap((value) => value.split(/[.!?]+(?:\s+|$)/)).map((value) => value.trim()).filter(Boolean))]
  .filter((value) => {
    const words = wordsIn(value);
    if (words.length < 6) return false;
    if (/[/\\_=<>\[\]{}]|\b(?:const|return|function|dataset|querySelector|JSON|fetch|data-|aria-)\b/.test(value)) return false;
    const letterShare = (value.match(/[A-Za-z]/g) || []).length / Math.max(1, value.length);
    return letterShare >= 0.62;
  })
  .map((text) => ({ text, words: wordsIn(text).length, grade: gradeFor(text) }))
  .sort((left, right) => right.grade - left.grade || right.words - left.words);

const longCopy = uiCopy.filter((row) => row.words > 22);
const hardCopy = uiCopy.filter((row) => row.words >= 8 && row.grade > 6.5);
const averageGrade = gradeFor(uiCopy.map((row) => row.text).join(". "));

console.log(`Workspace readability audit: ${uiCopy.length} prose strings; average estimated grade ${averageGrade.toFixed(1)}.`);
console.log(`Long strings: ${longCopy.length}.`);
if (!process.argv.includes("--check")) {
  console.log(`Short strings above grade 6.5 for future review: ${hardCopy.length}.`);
  for (const row of longCopy) {
    console.log(`[long ${row.words} words] ${row.text}`);
  }
  for (const row of hardCopy.slice(0, 50)) {
    console.log(`[grade ${row.grade.toFixed(1)} | ${row.words} words] ${row.text}`);
  }
}

if (process.argv.includes("--check")) {
  if (averageGrade > 5.9 || longCopy.length > 0) {
    console.error("Fifth-grade language check failed. Shorten the listed copy and use simpler words.");
    process.exit(1);
  }
  console.log("Fifth-grade language check passed.");
}
