import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MONTH_INDEX = new Map([
  ["january", 0],
  ["february", 1],
  ["march", 2],
  ["april", 3],
  ["may", 4],
  ["june", 5],
  ["july", 6],
  ["august", 7],
  ["september", 8],
  ["october", 9],
  ["november", 10],
  ["december", 11],
]);

export function extractCohortYear(cohortLabel) {
  if (!cohortLabel || typeof cohortLabel !== "string") return null;
  const match = cohortLabel.match(/(19|20)\d{2}/);
  if (!match) return null;
  return Number.parseInt(match[0], 10);
}

function isoDateUtc(year, monthIndex, day, hour = 0) {
  const date = new Date(Date.UTC(year, monthIndex, day, hour, 0, 0, 0));
  return date.toISOString().replace(".000Z", "Z");
}

function lastDayOfMonthUtc(year, monthIndex) {
  const date = new Date(Date.UTC(year, monthIndex + 1, 0, 0, 0, 0, 0));
  return isoDateUtc(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function academicYearForMonth(cohortYear, monthIndex) {
  const monthNumber = monthIndex + 1;
  if (monthNumber >= 8 && monthNumber <= 12) {
    return cohortYear - 1;
  }
  return cohortYear;
}

export function parseDueLabelToDates(dueLabel, cohortYear) {
  const label = (dueLabel || "").trim();
  if (!label) return { dates: [], warnings: ["missing_due_label"] };

  if (/^Before using cycle documents\b/i.test(label)) {
    // Relative due labels become an early fall checkpoint for the cohort year.
    const fallYear = cohortYear - 1;
    return {
      dates: [{ dueAt: isoDateUtc(fallYear, MONTH_INDEX.get("september"), 1), kind: "estimated" }],
      warnings: ["relative_due_label"],
    };
  }

  if (/^December or January\b/i.test(label)) {
    // Teacher-dependent window: record a conservative latest date for sorting.
    return {
      dates: [{ dueAt: lastDayOfMonthUtc(cohortYear, MONTH_INDEX.get("january")), kind: "estimated" }],
      warnings: ["ambiguous_due_label"],
    };
  }

  const monthMatch = label.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
  );
  if (!monthMatch) {
    return { dates: [], warnings: ["unparseable_due_label"] };
  }
  const monthName = monthMatch[1].toLowerCase();
  const monthIndex = MONTH_INDEX.get(monthName);
  const year = academicYearForMonth(cohortYear, monthIndex);

  const monthsInLabel = [...label.matchAll(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi,
  )].map((match) => match[1].toLowerCase());
  const uniqueMonthsInLabel = [...new Set(monthsInLabel)];

  // Supports:
  // - "October 1 and 2"
  // - "October 9 and 10"
  // - "January 14, make-up January 16"
  // - "April 8 and 9"
  const matches = [];
  const dateRegex = new RegExp(
    "(January|February|March|April|May|June|July|August|September|October|November|December)\\s+(\\d{1,2})",
    "gi",
  );
  for (const match of label.matchAll(dateRegex)) {
    matches.push({ month: match[1].toLowerCase(), day: Number.parseInt(match[2], 10) });
  }

  const days = [];
  if (matches.length > 0) {
    for (const entry of matches) {
      const entryMonthIndex = MONTH_INDEX.get(entry.month);
      const entryYear = academicYearForMonth(cohortYear, entryMonthIndex);
      days.push({ year: entryYear, monthIndex: entryMonthIndex, day: entry.day });
    }

    // If the label only names one month (e.g. "October 1 and 2"), treat any additional day numbers
    // as belonging to that month.
    if (uniqueMonthsInLabel.length === 1) {
      for (const match of label.matchAll(/\b(\d{1,2})\b/g)) {
        days.push({ year, monthIndex, day: Number.parseInt(match[1], 10) });
      }
    }
  } else {
    const dayMatches = label.matchAll(/\b(\d{1,2})\b/g);
    for (const match of dayMatches) {
      days.push({ year, monthIndex, day: Number.parseInt(match[1], 10) });
    }
  }

  if (days.length === 0) {
    return { dates: [], warnings: ["unparseable_due_label"] };
  }

  // De-dupe and sort.
  const unique = new Map();
  for (const d of days) {
    if (!Number.isFinite(d.day) || d.day < 1 || d.day > 31) continue;
    const key = `${d.year}-${d.monthIndex}-${d.day}`;
    unique.set(key, d);
  }
  const sorted = [...unique.values()].sort((a, b) => {
    const aKey = `${a.year}`.padStart(4, "0") + `${a.monthIndex}`.padStart(2, "0") + `${a.day}`.padStart(2, "0");
    const bKey = `${b.year}`.padStart(4, "0") + `${b.monthIndex}`.padStart(2, "0") + `${b.day}`.padStart(2, "0");
    return aKey.localeCompare(bKey);
  });

  return {
    dates: sorted.map((d) => ({ dueAt: isoDateUtc(d.year, d.monthIndex, d.day), kind: "parsed" })),
    warnings: [],
  };
}

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlBool(value) {
  return value ? "1" : "0";
}

export function buildFrameworkSeedPlan(framework, options = {}) {
  if (!framework || typeof framework !== "object") {
    throw new Error("framework_seed:invalid_framework_object");
  }

  const cohortYear = options.cohortYear ?? extractCohortYear(framework?.metadata?.cohortLabel);
  if (!cohortYear || !Number.isFinite(cohortYear)) {
    throw new Error("framework_seed:missing_cohort_year");
  }

  const requirementIdPrefix = options.requirementIdPrefix ?? "req-";
  const deadlineIdPrefix = options.deadlineIdPrefix ?? "deadline-";
  const sectionIdPrefix = options.sectionIdPrefix ?? "section-";
  const checkIdPrefix = options.checkIdPrefix ?? "qc-";

  const warnings = [];
  const requirements = [];
  const deadlines = [];
  const qualityChecks = [];
  const reviewGates = [];
  const creditOwners = [];
  const dashboardSignals = [];
  const studentEvidence = [];
  const requirementSections = [];

  const phaseBySlug = new Map((framework.phaseGroups || []).map((group) => [group.slug, group.title]));

  const requirementList = framework.requirements || [];
  for (let index = 0; index < requirementList.length; index += 1) {
    const req = requirementList[index];
    if (!req?.slug || !req?.title || !req?.phaseGroup) {
      warnings.push({ kind: "invalid_requirement_record", slug: req?.slug ?? null });
      continue;
    }

    const requirementId = `${requirementIdPrefix}${req.slug}`;
    const phaseTitle = phaseBySlug.get(req.phaseGroup) || req.phaseGroup;
    const descriptionParts = [];
    if (Array.isArray(req.appWorkflow) && req.appWorkflow.length > 0) {
      descriptionParts.push(req.appWorkflow[0]);
    } else {
      descriptionParts.push(`Seeded from capstone framework (${framework?.metadata?.cohortLabel || "unknown cohort"}).`);
    }

    requirements.push({
      id: requirementId,
      programId: null,
      phase: req.phaseGroup,
      title: req.title,
      description: descriptionParts.join(" ").trim(),
      required: true,
      sortOrder: index + 1,
      phaseTitle,
      sourceSlug: req.slug,
    });

    if (Array.isArray(req.studentEvidence)) {
      for (const evidenceText of req.studentEvidence) {
        if (!evidenceText) continue;
        studentEvidence.push({ requirementId, evidenceText });
      }
    }

    if (Array.isArray(req.dashboardSignals)) {
      for (const signalText of req.dashboardSignals) {
        if (!signalText) continue;
        dashboardSignals.push({ requirementId, signalText });
      }
    }

    if (Array.isArray(req.creditOwners)) {
      for (const ownerLabel of req.creditOwners) {
        if (!ownerLabel) continue;
        creditOwners.push({ requirementId, ownerLabel });
      }
    }

    if (req.reviewGate && req.reviewGate.required) {
      reviewGates.push({
        id: `gate-${requirementId}`,
        requirementId,
        required: true,
        reviewerRoles: Array.isArray(req.reviewGate.reviewerRoles) ? req.reviewGate.reviewerRoles : [],
        approvalMeaning: req.reviewGate.approvalMeaning || null,
      });
    }

    const dueParse = parseDueLabelToDates(req.dueLabel, cohortYear);
    if (dueParse.warnings.length > 0) {
      warnings.push({ kind: "due_label_warning", slug: req.slug, dueLabel: req.dueLabel, warnings: dueParse.warnings });
    }

    if (dueParse.dates.length === 0) {
      warnings.push({ kind: "missing_deadlines", slug: req.slug, dueLabel: req.dueLabel });
    }

    for (let dIndex = 0; dIndex < dueParse.dates.length; dIndex += 1) {
      const deadlineId = `${deadlineIdPrefix}${req.slug}-${dIndex + 1}`;
      deadlines.push({
        id: deadlineId,
        requirementId,
        programId: null,
        cohortId: null,
        title: req.dueLabel,
        dueAt: dueParse.dates[dIndex].dueAt,
        timezone: "America/Los_Angeles",
        active: true,
        dueKind: dueParse.dates[dIndex].kind,
      });
    }

    if (Array.isArray(req.qualityNudges)) {
      for (let qIndex = 0; qIndex < req.qualityNudges.length; qIndex += 1) {
        const prompt = req.qualityNudges[qIndex];
        if (!prompt) continue;
        qualityChecks.push({
          id: `${checkIdPrefix}${req.slug}-${qIndex + 1}`,
          requirementId,
          requirementSectionId: null,
          severity: "nudge",
          prompt,
          checkType: "nudge",
          sortOrder: qIndex + 1,
          active: true,
        });
      }
    }

    // Placeholder sections so the schema is ready when the framework adds structured sections.
    requirementSections.push({
      id: `${sectionIdPrefix}${req.slug}-root`,
      requirementId,
      title: req.title,
      description: null,
      sortOrder: 1,
      active: true,
    });
  }

  return {
    cohortYear,
    metadata: framework.metadata || {},
    warnings,
    plan: {
      requirements,
      deadlines,
      requirementSections,
      creditOwners,
      studentEvidence,
      dashboardSignals,
      reviewGates,
      qualityChecks,
    },
    counts: {
      requirements: requirements.length,
      deadlines: deadlines.length,
      requirementSections: requirementSections.length,
      creditOwners: creditOwners.length,
      studentEvidence: studentEvidence.length,
      dashboardSignals: dashboardSignals.length,
      reviewGates: reviewGates.length,
      qualityChecks: qualityChecks.length,
      warnings: warnings.length,
    },
  };
}

export function planToSql(seedPlan) {
  const { plan } = seedPlan;
  const lines = [];
  lines.push("-- Seed: capstone framework (generated by scripts/framework-seed.mjs)");

  for (const req of plan.requirements) {
    lines.push(
      `INSERT INTO requirements (id, program_id, phase, title, description, required, sort_order) VALUES (` +
        `${sqlString(req.id)}, ` +
        `NULL, ` +
        `${sqlString(req.phase)}, ` +
        `${sqlString(req.title)}, ` +
        `${sqlString(req.description)}, ` +
        `${sqlBool(req.required)}, ` +
        `${Number(req.sortOrder)}` +
        `) ON CONFLICT(id) DO UPDATE SET ` +
        `program_id=excluded.program_id, ` +
        `phase=excluded.phase, ` +
        `title=excluded.title, ` +
        `description=excluded.description, ` +
        `required=excluded.required, ` +
        `sort_order=excluded.sort_order;`,
    );
  }

  for (const section of plan.requirementSections) {
    lines.push(
      `INSERT INTO requirement_sections (id, requirement_id, title, description, sort_order, active) VALUES (` +
        `${sqlString(section.id)}, ` +
        `${sqlString(section.requirementId)}, ` +
        `${sqlString(section.title)}, ` +
        `${sqlString(section.description)}, ` +
        `${Number(section.sortOrder)}, ` +
        `${sqlBool(section.active)}` +
        `) ON CONFLICT(id) DO UPDATE SET ` +
        `requirement_id=excluded.requirement_id, ` +
        `title=excluded.title, ` +
        `description=excluded.description, ` +
        `sort_order=excluded.sort_order, ` +
        `active=excluded.active;`,
    );
  }

  for (const deadline of plan.deadlines) {
    lines.push(
      `INSERT INTO deadlines (id, requirement_id, program_id, cohort_id, title, due_at, timezone, active) VALUES (` +
        `${sqlString(deadline.id)}, ` +
        `${sqlString(deadline.requirementId)}, ` +
        `NULL, ` +
        `NULL, ` +
        `${sqlString(deadline.title)}, ` +
        `${sqlString(deadline.dueAt)}, ` +
        `${sqlString(deadline.timezone)}, ` +
        `${sqlBool(deadline.active)}` +
        `) ON CONFLICT(id) DO UPDATE SET ` +
        `requirement_id=excluded.requirement_id, ` +
        `program_id=excluded.program_id, ` +
        `cohort_id=excluded.cohort_id, ` +
        `title=excluded.title, ` +
        `due_at=excluded.due_at, ` +
        `timezone=excluded.timezone, ` +
        `active=excluded.active;`,
    );
  }

  for (const owner of plan.creditOwners) {
    lines.push(
      `INSERT INTO requirement_credit_owners (requirement_id, owner_label) VALUES (` +
        `${sqlString(owner.requirementId)}, ${sqlString(owner.ownerLabel)}` +
        `) ON CONFLICT(requirement_id, owner_label) DO NOTHING;`,
    );
  }

  for (const evidence of plan.studentEvidence) {
    lines.push(
      `INSERT INTO requirement_student_evidence (requirement_id, evidence_text) VALUES (` +
        `${sqlString(evidence.requirementId)}, ${sqlString(evidence.evidenceText)}` +
        `) ON CONFLICT(requirement_id, evidence_text) DO NOTHING;`,
    );
  }

  for (const signal of plan.dashboardSignals) {
    lines.push(
      `INSERT INTO requirement_dashboard_signals (requirement_id, signal_text) VALUES (` +
        `${sqlString(signal.requirementId)}, ${sqlString(signal.signalText)}` +
        `) ON CONFLICT(requirement_id, signal_text) DO NOTHING;`,
    );
  }

  for (const gate of plan.reviewGates) {
    lines.push(
      `INSERT INTO requirement_review_gates (id, requirement_id, required, reviewer_roles_json, approval_meaning) VALUES (` +
        `${sqlString(gate.id)}, ` +
        `${sqlString(gate.requirementId)}, ` +
        `${sqlBool(gate.required)}, ` +
        `${sqlString(JSON.stringify(gate.reviewerRoles || []))}, ` +
        `${sqlString(gate.approvalMeaning)}` +
        `) ON CONFLICT(id) DO UPDATE SET ` +
        `requirement_id=excluded.requirement_id, ` +
        `required=excluded.required, ` +
        `reviewer_roles_json=excluded.reviewer_roles_json, ` +
        `approval_meaning=excluded.approval_meaning;`,
    );
  }

  for (const check of plan.qualityChecks) {
    lines.push(
      `INSERT INTO quality_checks (` +
        `id, requirement_id, requirement_section_id, severity, prompt, check_type, sort_order, active` +
        `) VALUES (` +
        `${sqlString(check.id)}, ` +
        `${sqlString(check.requirementId)}, ` +
        `${sqlString(check.requirementSectionId)}, ` +
        `${sqlString(check.severity)}, ` +
        `${sqlString(check.prompt)}, ` +
        `${sqlString(check.checkType)}, ` +
        `${Number(check.sortOrder)}, ` +
        `${sqlBool(check.active)}` +
        `) ON CONFLICT(id) DO UPDATE SET ` +
        `requirement_id=excluded.requirement_id, ` +
        `requirement_section_id=excluded.requirement_section_id, ` +
        `severity=excluded.severity, ` +
        `prompt=excluded.prompt, ` +
        `check_type=excluded.check_type, ` +
        `sort_order=excluded.sort_order, ` +
        `active=excluded.active;`,
    );
  }

  lines.push("-- End seed");
  return lines.join("\n") + "\n";
}

async function loadFrameworkFromFile(inputPath) {
  const raw = await readFile(inputPath, "utf8");
  return JSON.parse(raw);
}

function parseArgs(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const entry = argv[i];
    if (!entry.startsWith("--")) continue;
    const [key, valueFromEquals] = entry.slice(2).split("=");
    const value = valueFromEquals ?? argv[i + 1];
    if (!valueFromEquals && value && !value.startsWith("--")) i += 1;
    args.set(key, valueFromEquals ? valueFromEquals : value ?? "true");
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = args.get("input") || "data/capstone-framework.json";
  const format = (args.get("format") || "summary").toLowerCase();
  const out = args.get("out") || "";
  const cohortYear = args.get("cohort-year") ? Number.parseInt(args.get("cohort-year"), 10) : undefined;

  const framework = await loadFrameworkFromFile(input);
  const seed = buildFrameworkSeedPlan(framework, { cohortYear });

  let output = "";
  if (format === "sql") {
    output = planToSql(seed);
  } else if (format === "json") {
    output = JSON.stringify(seed, null, 2) + "\n";
  } else {
    output = [
      "Framework seed summary",
      `- cohortYear: ${seed.cohortYear}`,
      `- requirements: ${seed.counts.requirements}`,
      `- deadlines: ${seed.counts.deadlines}`,
      `- reviewGates: ${seed.counts.reviewGates}`,
      `- qualityChecks: ${seed.counts.qualityChecks}`,
      `- warnings: ${seed.counts.warnings}`,
      "",
    ].join("\n");
  }

  if (out) {
    const resolvedOut = path.resolve(out);
    await writeFile(resolvedOut, output, "utf8");
    process.stdout.write(`Wrote ${format} to ${resolvedOut}\n`);
    return;
  }

  process.stdout.write(output);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    process.stderr.write(`${err?.stack || err}\n`);
    process.exitCode = 1;
  });
}
