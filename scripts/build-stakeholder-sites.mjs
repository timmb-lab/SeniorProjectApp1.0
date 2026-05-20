import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = resolve(repoRoot, "stakeholder-options");
const appUrl = "https://senior-capstone-app.pages.dev";

const pages = [
  {
    slug: "program",
    file: "program.html",
    group: "Program Requirements",
    title: "Program Requirements",
    eyebrow: "Start here",
    summary:
      "Confirm the CTE program rules before students lock in a project idea. This keeps the public guide, teacher expectations, and app workflow aligned.",
    moves: [
      "Ask whether students work individually or in groups.",
      "Name the technical evidence the pathway needs to see.",
      "Capture display, safety, material, and approval rules before proposal work starts."
    ],
    evidence: ["Program requirement notes", "Teacher approval questions", "Known constraints"],
    adultRoles: ["Program teacher", "Student", "Senior project team"],
    accent: "gold"
  },
  {
    slug: "sponsorship-support",
    file: "sponsorship-support.html",
    group: "Program Requirements",
    title: "Sponsorship Support",
    eyebrow: "Community bridge",
    summary:
      "Give families, sponsors, and community partners a simple way to understand what students may need and how adults can help appropriately.",
    moves: [
      "Clarify what kind of support is allowed.",
      "List materials, donations, feedback, and audience connections separately.",
      "Keep student ownership visible even when adults support the work."
    ],
    evidence: ["Support request draft", "Sponsor thank-you note", "Allowed support checklist"],
    adultRoles: ["Sponsor", "Family", "Program teacher"],
    accent: "red"
  },
  {
    slug: "calendar",
    file: "calendar.html",
    group: "Program Requirements",
    title: "Calendar",
    eyebrow: "Milestone map",
    summary:
      "A public-facing calendar view that helps students understand the year as a sequence of decisions, builds, presentations, and reflection.",
    moves: [
      "Anchor the year around proposal, build, mentor, presentation, showcase, and portfolio milestones.",
      "Use official Remind/classroom updates for exact due dates.",
      "Make each calendar stop point to the next student action."
    ],
    evidence: ["Milestone list", "Personal pacing plan", "Teacher due-date notes"],
    adultRoles: ["Senior project team", "Program teacher", "Mentor"],
    accent: "blue"
  },
  {
    slug: "phase-1",
    file: "phase-1.html",
    group: "Phases",
    title: "Phase 1 - Kickoff",
    eyebrow: "Proposal launch",
    summary:
      "Turn a rough idea into a clear, feasible Core Concept Proposal with CTE alignment, Titan Tenets, timeline, and approval path.",
    moves: [
      "Write the project in plain language.",
      "Connect the idea to a specific CTE skill.",
      "Build a realistic timeline and material/source list."
    ],
    evidence: ["Core Concept Proposal", "Proposal rubric check", "Teacher approval notes"],
    adultRoles: ["Program teacher", "Mrs. Rawson", "Student"],
    accent: "gold"
  },
  {
    slug: "phase-2a",
    file: "phase-2a.html",
    group: "Phases",
    title: "Phase 2 - Build Part I",
    eyebrow: "Plan and gather",
    summary:
      "Move from approved proposal to visible work. Students plan sessions, gather supplies, track blockers, and prepare for the first mentor meeting.",
    moves: [
      "Break the project into work sessions with concrete results.",
      "Source materials, tools, spaces, and permissions early.",
      "Use check-ins to show progress and name blockers."
    ],
    evidence: ["Build plan", "Material list", "First progress photos or drafts"],
    adultRoles: ["Mentor", "Program teacher", "Student or group"],
    accent: "blue"
  },
  {
    slug: "gathering-supplies",
    file: "gathering-supplies.html",
    group: "Phase 2 - Build Part I",
    title: "Gathering Supplies",
    eyebrow: "Resource readiness",
    summary:
      "A focused support page for students who need materials, software, people, workspace, permissions, or outside connections before the build can move.",
    moves: [
      "Separate must-have materials from nice-to-have materials.",
      "Identify cost, safety, transportation, and access blockers.",
      "Ask early when a supply depends on an adult or outside partner."
    ],
    evidence: ["Supply list", "Request notes", "Blocker tracker"],
    adultRoles: ["Program teacher", "Sponsor", "Family"],
    accent: "green"
  },
  {
    slug: "managing-your-vision",
    file: "managing-your-vision.html",
    group: "Phase 2 - Build Part I",
    title: "Managing Your Vision",
    eyebrow: "Scope control",
    summary:
      "A student-friendly guide to keep ambition realistic without making the project small. This page helps students revise scope before time runs out.",
    moves: [
      "Name the outcome that must be finished.",
      "Cut extras that do not prove the CTE skill.",
      "Use mentor and teacher feedback to refine scope."
    ],
    evidence: ["Scope statement", "Revision notes", "Updated timeline"],
    adultRoles: ["Mentor", "Program teacher", "Student"],
    accent: "red"
  },
  {
    slug: "mentor-meeting-1",
    file: "mentor-meeting-1.html",
    group: "Phase 2 - Build Part I",
    title: "Mentor Meeting 1",
    eyebrow: "First feedback loop",
    summary:
      "Students arrive with the proposal, summary, timeline, and questions so the mentor can help the project become more realistic and stronger.",
    moves: [
      "Bring the project summary and top questions.",
      "Explain what is exciting and what might block progress.",
      "Turn mentor feedback into a next-action list."
    ],
    evidence: ["Mentor meeting notes", "Question list", "Next-action list"],
    adultRoles: ["Mentor", "Student", "Program teacher"],
    accent: "gold"
  },
  {
    slug: "phase-2b",
    file: "phase-2b.html",
    group: "Phases",
    title: "Phase 2 Continues - Build Part II",
    eyebrow: "Build to presentation",
    summary:
      "Students move from making the project to explaining the work. The second mentor meeting, outline, and presentation slot become the focus.",
    moves: [
      "Show final build progress and remaining work.",
      "Draft the presentation outline before polishing visuals.",
      "Claim the mentor-class presentation time slot."
    ],
    evidence: ["Second mentor notes", "Presentation outline", "Time slot confirmation"],
    adultRoles: ["Mentor", "Additional teachers", "Student"],
    accent: "blue"
  },
  {
    slug: "sprint-to-finish",
    file: "sprint-to-finish.html",
    group: "Phase 2 Continues - Build Part II",
    title: "Sprint To The Finish",
    eyebrow: "Final build push",
    summary:
      "A practical end-of-build checklist for students who need to finish, document, rehearse, and package the evidence before Presentation Day.",
    moves: [
      "Prioritize the work that proves the skill.",
      "Collect process evidence before it disappears.",
      "Practice the explanation while the build is still fresh."
    ],
    evidence: ["Final photos", "Process notes", "Rehearsal checklist"],
    adultRoles: ["Student", "Mentor", "Program teacher"],
    accent: "green"
  },
  {
    slug: "mentor-meeting-2",
    file: "mentor-meeting-2.html",
    group: "Phase 2 Continues - Build Part II",
    title: "Mentor Meeting 2",
    eyebrow: "Presentation readiness",
    summary:
      "The second mentor meeting turns project progress into a clear story that an audience outside the pathway can follow.",
    moves: [
      "Explain what changed since the first meeting.",
      "Show the outline and ask what is unclear.",
      "Confirm the presentation location and timing."
    ],
    evidence: ["Mentor feedback", "Presentation outline", "Updated visuals"],
    adultRoles: ["Mentor", "Student", "Host teacher"],
    accent: "red"
  },
  {
    slug: "present",
    file: "present.html",
    group: "Phases",
    title: "Phase 3 - Present",
    eyebrow: "Professional share-out",
    summary:
      "Students present the project, the CTE connection, the process, final outcome, Titan growth, and audience questions.",
    moves: [
      "Open with the purpose and program connection.",
      "Use visuals or artifacts to make the work concrete.",
      "Answer questions with process and evidence, not guesses."
    ],
    evidence: ["Presentation slides or outline", "Audience feedback", "Final artifact photos"],
    adultRoles: ["Mentor", "Audience", "Student"],
    accent: "gold"
  },
  {
    slug: "project-showcase",
    file: "project-showcase.html",
    group: "Phase 3 - Present",
    title: "Project Showcase",
    eyebrow: "Public exhibit",
    summary:
      "Students prepare a display that communicates the project quickly, professionally, and in line with program expectations.",
    moves: [
      "Build a display visitors can understand in under a minute.",
      "Show technical growth, not just finished decoration.",
      "Follow program-specific display expectations."
    ],
    evidence: ["Display plan", "Visitor talking points", "Showcase photos"],
    adultRoles: ["Student", "Program teacher", "Visitors"],
    accent: "blue"
  },
  {
    slug: "portfolio",
    file: "portfolio.html",
    group: "Phases",
    title: "Phase 4 - Portfolio + Reflection",
    eyebrow: "Archive and reflect",
    summary:
      "Students turn the year into a professional record: artifacts, reflection, resume language, thank-you notes, and final recognition evidence.",
    moves: [
      "Collect evidence from each phase.",
      "Write reflection around growth and CTE mastery.",
      "Translate the project into resume and interview language."
    ],
    evidence: ["Portfolio checklist", "Reflection draft", "Resume highlights"],
    adultRoles: ["Student", "Mentor", "Program teacher"],
    accent: "green"
  },
  {
    slug: "app-preview",
    file: "app-preview.html",
    group: "Web App",
    title: "App Workflow Preview",
    eyebrow: "Digital workflow",
    summary:
      "A stakeholder-friendly bridge into the planned app direction: student evidence, teacher review, mentor feedback, and admin visibility.",
    moves: [
      "Review how students should move through the capstone flow.",
      "Keep public copy separate from protected app data.",
      "Use internal alpha routes only for Bryan and QA review."
    ],
    evidence: ["App workflow notes", "Boundary questions", "Stakeholder feedback"],
    adultRoles: ["Admin", "Teacher", "Mentor"],
    accent: "red",
    appLink: true
  },
  {
    slug: "templates",
    file: "templates.html",
    group: "Web App",
    title: "Templates",
    eyebrow: "Ready-to-use supports",
    summary:
      "Planning templates give students a starting point for proposals, mentor meetings, presentations, displays, portfolios, and reflection.",
    moves: [
      "Use templates to reduce blank-page friction.",
      "Keep template language student-owned and editable.",
      "Connect each template to a phase milestone."
    ],
    evidence: ["Template downloads", "Completed drafts", "Teacher feedback"],
    adultRoles: ["Student", "Teacher", "Mentor"],
    accent: "blue"
  },
  {
    slug: "rubrics",
    file: "rubrics.html",
    group: "Web App",
    title: "Rubrics",
    eyebrow: "Quality targets",
    summary:
      "Rubrics help students see what mastery looks like before they submit, present, or display their final work.",
    moves: [
      "Read the rubric before making the thing.",
      "Use mastery language to revise weak sections.",
      "Check CTE alignment and feasibility explicitly."
    ],
    evidence: ["Rubric self-check", "Revision notes", "Teacher comments"],
    adultRoles: ["Student", "Program teacher", "Senior project team"],
    accent: "gold"
  },
  {
    slug: "grades",
    file: "grades.html",
    group: "Web App",
    title: "Grades",
    eyebrow: "What counts",
    summary:
      "A simple public explanation of how the major capstone pieces connect to progress, presentation, display, portfolio, and recognition.",
    moves: [
      "Separate official gradebook details from public guidance.",
      "Show students which artifacts matter.",
      "Point students back to teacher directions for exact scoring."
    ],
    evidence: ["Grade component notes", "Missing-evidence checklist", "Teacher instructions"],
    adultRoles: ["Student", "Teacher", "Senior project team"],
    accent: "green"
  }
];

const menuGroups = [
  {
    title: "Program Requirements",
    links: ["program", "sponsorship-support", "calendar"]
  },
  {
    title: "Phases",
    links: ["phase-1", "phase-2a", "gathering-supplies", "managing-your-vision", "mentor-meeting-1", "phase-2b", "sprint-to-finish", "mentor-meeting-2", "present", "project-showcase", "portfolio"]
  },
  {
    title: "Web App",
    links: ["app-preview", "templates", "rubrics", "grades"]
  }
];

const options = [
  {
    slug: "titan-blend",
    projectName: "senior-capstone-option-titan",
    optionLabel: "Option 2",
    name: "Titan Blend",
    tagline: "A polished stakeholder hub with Titan colors blended into a professional pathway dashboard.",
    audience: "Stakeholder review direction",
    filePrefix: "titan",
    heroTone: "Confident, layered, pathway-focused",
    panelTitle: "Professional, calm, and stakeholder-ready.",
    panelBody:
      "This direction borrows from current education templates: a clear phase spine, fewer competing decisions up top, and stronger visual separation between public guidance and app workflow.",
    panelBullets: [
      "Best for leadership, district, and community review.",
      "Feels closest to a modern pathway or academy microsite.",
      "Makes the website-to-app bridge feel deliberate instead of improvised."
    ],
    focusCards: [
      {
        label: "Students",
        title: "Find The Next Phase Fast",
        body: "Use the phase map and support cards to move from idea to portfolio without guessing where to click."
      },
      {
        label: "Teachers",
        title: "Point To The Right Public Page",
        body: "Requirements, pacing, rubrics, and templates stay easy to share with a class or cohort."
      },
      {
        label: "Mentors",
        title: "Step Into The Work Quickly",
        body: "Meeting pages and presentation supports make it easier to coach without reading the whole guide."
      },
      {
        label: "Stakeholders",
        title: "See The Whole System",
        body: "The site frames the public pathway while the workflow preview hints at the operational layer behind it."
      }
    ],
    css: titanCss
  },
  {
    slug: "back-to-basics",
    projectName: "senior-capstone-option-primary",
    optionLabel: "Option 3",
    name: "Back To Basics",
    tagline: "A clear, primary-color guide that feels approachable for students and families without losing structure.",
    audience: "Student and family friendly direction",
    filePrefix: "primary",
    heroTone: "Bright, simple, classroom-ready",
    panelTitle: "Friendly, direct, and easy to scan.",
    panelBody:
      "This direction leans into big blocks, primary colors, and quick comprehension so students and families can understand the project flow at a glance.",
    panelBullets: [
      "Best for younger audiences, family nights, and student-first walkthroughs.",
      "Feels approachable without turning into a childish landing page.",
      "Keeps the app relationship clear while making the public guide less intimidating."
    ],
    focusCards: [
      {
        label: "Students",
        title: "Know What To Do Today",
        body: "Big, readable sections help students jump straight to the page that matches the current problem."
      },
      {
        label: "Families",
        title: "Understand The Project Quickly",
        body: "The structure is simple enough for supporters to follow without needing internal school context."
      },
      {
        label: "Mentors",
        title: "Coach Without The Jargon",
        body: "Meeting prep, showcase guidance, and timeline cues feel straightforward and welcoming."
      },
      {
        label: "Staff",
        title: "Keep It Classroom-Friendly",
        body: "The visuals stay upbeat while the content still maps cleanly to the real capstone milestones."
      }
    ],
    css: primaryCss
  }
];

const pageBySlug = new Map(pages.map((page) => [page.slug, page]));

function assertInsideRepo(path) {
  const rel = relative(repoRoot, path);
  if (rel.startsWith("..") || rel === "" || resolve(path) === repoRoot) {
    throw new Error(`Refusing to use output path outside repo workspace: ${path}`);
  }
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfPresent(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

function withoutGeneratedAt(manifest) {
  const { generatedAt, ...rest } = manifest ?? {};
  return rest;
}

function resolveGeneratedAt(baseManifest, previousManifest) {
  if (
    previousManifest?.generatedAt &&
    JSON.stringify(withoutGeneratedAt(previousManifest)) === JSON.stringify(baseManifest)
  ) {
    return previousManifest.generatedAt;
  }

  return new Date().toISOString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function asset(path) {
  return path;
}

function listItems(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n");
}

function linkFor(slug) {
  return pageBySlug.get(slug)?.file || "index.html";
}

function navHtml(currentSlug) {
  return menuGroups
    .map((group) => {
      const links = group.links
        .map((slug) => {
          const page = pageBySlug.get(slug);
          const active = slug === currentSlug ? ' aria-current="page"' : "";
          return `<a class="nav-link accent-${page.accent}" href="${page.file}"${active}>${escapeHtml(page.title)}</a>`;
        })
        .join("\n");
      return `<section class="nav-group">
        <h2>${escapeHtml(group.title)}</h2>
        <div class="nav-links">${links}</div>
      </section>`;
    })
    .join("\n");
}

function topNavHtml(currentSlug) {
  const links = ["program", "phase-1", "phase-2a", "present", "portfolio", "app-preview"]
    .map((slug) => {
      const page = pageBySlug.get(slug);
      const active = slug === currentSlug ? ' aria-current="page"' : "";
      return `<a href="${page.file}"${active}>${escapeHtml(page.title)}</a>`;
    })
    .join("\n");
  return `<nav class="top-links" aria-label="Primary">${links}</nav>`;
}

function stageCardsHtml(option) {
  const stageSlugs = ["program", "phase-1", "phase-2a", "phase-2b", "present", "portfolio"];
  return stageSlugs
    .map((slug, index) => {
      const page = pageBySlug.get(slug);
      return `<a class="stage-card accent-${page.accent}" href="${page.file}">
        <span class="stage-number">${String(index + 1).padStart(2, "0")}</span>
        <strong>${escapeHtml(page.title)}</strong>
        <span>${escapeHtml(page.summary)}</span>
      </a>`;
    })
    .join("\n");
}

function resourceCardsHtml() {
  const slugs = ["sponsorship-support", "calendar", "gathering-supplies", "managing-your-vision", "mentor-meeting-1", "sprint-to-finish", "mentor-meeting-2", "project-showcase", "templates", "rubrics", "grades"];
  return slugs
    .map((slug) => {
      const page = pageBySlug.get(slug);
      return `<a class="resource-card accent-${page.accent}" href="${page.file}">
        <span>${escapeHtml(page.eyebrow)}</span>
        <strong>${escapeHtml(page.title)}</strong>
        <em>${escapeHtml(page.summary)}</em>
      </a>`;
    })
    .join("\n");
}

function heroMetricsHtml() {
  return `<div class="hero-metrics" aria-label="Site shape">
    <div><strong>6</strong><span>core phases</span></div>
    <div><strong>11</strong><span>support pages</span></div>
    <div><strong>1</strong><span>secure app bridge</span></div>
  </div>`;
}

function focusCardsHtml(option) {
  return `<div class="focus-grid">
    ${option.focusCards
      .map(
        (item) => `<article class="focus-card">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.body)}</p>
        </article>`
      )
      .join("\n")}
  </div>`;
}

function cadenceCardsHtml() {
  return `<div class="cadence-grid">
    <article class="cadence-card">
      <span>Kickoff</span>
      <strong>Requirements + Proposal</strong>
      <p>Clarify pathway rules, choose the idea, and secure a realistic approval path.</p>
    </article>
    <article class="cadence-card">
      <span>Build</span>
      <strong>Gather + Make Progress</strong>
      <p>Use the support pages for supplies, scope control, mentor prep, and visible evidence.</p>
    </article>
    <article class="cadence-card">
      <span>Present</span>
      <strong>Tell The Story Clearly</strong>
      <p>Move from build work to outline, presentation rehearsal, and a public showcase people can understand.</p>
    </article>
    <article class="cadence-card">
      <span>Launch</span>
      <strong>Portfolio + Reflection</strong>
      <p>Close with gratitude, resume language, portfolio evidence, and a professional finish.</p>
    </article>
  </div>`;
}

function quickFactsHtml(page) {
  return `<section class="quick-facts" aria-label="${escapeHtml(page.title)} quick facts">
    <article class="fact-card accent-${page.accent}">
      <p class="section-kicker">Open this when</p>
      <h2>Why this page matters</h2>
      <p>${escapeHtml(page.summary)}</p>
    </article>
    <article class="fact-card">
      <p class="section-kicker">First move</p>
      <h2>Start here</h2>
      <p>${escapeHtml(page.moves[0])}</p>
    </article>
    <article class="fact-card">
      <p class="section-kicker">App handoff</p>
      <h2>What happens next</h2>
      <p>Keep the public explanation here, then move workflow actions, evidence, and review into the secure app when needed.</p>
    </article>
  </section>`;
}

function indexHtml(option) {
  return layout(option, {
    currentSlug: "home",
    title: `${option.name} - ECTA Senior Capstone`,
    body: `<header class="hero home-hero">
      <div class="hero-bg" role="img" aria-label="Senior Capstone planning workspace"></div>
      <div class="hero-content">
        <div class="hero-layout">
          <div class="hero-main">
            <p class="kicker">${escapeHtml(option.optionLabel)} / ${escapeHtml(option.audience)}</p>
            <h1>${escapeHtml(option.name)} Senior Capstone</h1>
            <p class="hero-copy">${escapeHtml(option.tagline)}</p>
            <div class="hero-actions" aria-label="Key actions">
              <a class="primary-action" href="program.html">Start With Requirements</a>
              <a class="secondary-action" href="phase-1.html">View Phase Flow</a>
              <a class="secondary-action" href="${appUrl}/alpha.html">Internal Alpha QA</a>
            </div>
            ${heroMetricsHtml()}
          </div>
          <aside class="hero-panel">
            <p class="section-kicker">Why this direction</p>
            <h2>${escapeHtml(option.panelTitle)}</h2>
            <p>${escapeHtml(option.panelBody)}</p>
            <ul>${listItems(option.panelBullets)}</ul>
          </aside>
        </div>
      </div>
    </header>

    <main id="main-content">
      <section class="intro-band">
        <div>
          <p class="section-kicker">${escapeHtml(option.heroTone)}</p>
          <h2>A site option built around the real capstone workflow.</h2>
        </div>
        <p>Students can move from requirements to proposal, build, presentation, showcase, and portfolio while stakeholders can quickly see how the web guide supports the app.</p>
      </section>

      <section class="focus-section">
        <div class="section-heading">
          <p class="section-kicker">Who this helps first</p>
          <h2>Four quick ways into the site.</h2>
        </div>
        ${focusCardsHtml(option)}
      </section>

      <section class="stage-grid" aria-label="Capstone phase map">
        ${stageCardsHtml(option)}
      </section>

      <section class="cadence-section">
        <div class="section-heading">
          <p class="section-kicker">Project cadence</p>
          <h2>Make the year feel manageable.</h2>
        </div>
        ${cadenceCardsHtml()}
      </section>

      <section class="split-section">
        <div class="section-copy">
          <p class="section-kicker">Menu structure</p>
          <h2>The Google Site menu becomes a guided public path.</h2>
          <p>Program requirements, phase supports, mentor meetings, and app resources stay visible without exposing protected app data.</p>
          <ul class="sync-list">
            <li>Website: public instructions, templates, rubrics, and stakeholder context.</li>
            <li>App: evidence, review decisions, assignments, notes, and dashboards.</li>
            <li>Together: easier to manage than the current Google Site workflow.</li>
          </ul>
        </div>
        <div class="menu-panel">
          ${navHtml("home")}
        </div>
      </section>

      <section class="resource-section">
        <div class="section-heading">
          <p class="section-kicker">Student supports</p>
          <h2>Focused pages for the places students get stuck.</h2>
        </div>
        <div class="resource-grid">
          ${resourceCardsHtml()}
        </div>
      </section>
    </main>`
  });
}

function detailHtml(option, page) {
  const related = pages
    .filter((candidate) => candidate.slug !== page.slug && (candidate.group === page.group || candidate.accent === page.accent))
    .slice(0, 4);
  return layout(option, {
    currentSlug: page.slug,
    title: `${page.title} - ${option.name}`,
    body: `<header class="hero detail-hero accent-${page.accent}">
      <div class="hero-bg" role="img" aria-label="Senior Capstone planning workspace"></div>
      <div class="hero-content">
        <p class="kicker">${escapeHtml(page.eyebrow)} / ${escapeHtml(page.group)}</p>
        <h1>${escapeHtml(page.title)}</h1>
        <p class="hero-copy">${escapeHtml(page.summary)}</p>
        <div class="hero-actions">
          <a class="primary-action" href="index.html">Back To Option Home</a>
          ${page.appLink ? `<a class="secondary-action" href="${appUrl}/alpha.html">Internal Alpha QA</a>` : `<a class="secondary-action" href="templates.html">Find Templates</a>`}
        </div>
      </div>
    </header>

    <main id="main-content" class="page-shell">
      <aside class="side-menu" aria-label="Site menu">
        ${navHtml(page.slug)}
      </aside>
      <article class="page-content">
        ${quickFactsHtml(page)}
        <section class="action-layout">
          <div class="action-block accent-${page.accent}">
            <p class="section-kicker">Student moves</p>
            <h2>What happens here</h2>
            <ul>${listItems(page.moves)}</ul>
          </div>
          <div class="action-block">
            <p class="section-kicker">Evidence</p>
            <h2>What to capture</h2>
            <ul>${listItems(page.evidence)}</ul>
          </div>
          <div class="action-block">
            <p class="section-kicker">Adult roles</p>
            <h2>Who helps</h2>
            <ul>${listItems(page.adultRoles)}</ul>
          </div>
        </section>

        <section class="app-bridge">
          <div>
            <p class="section-kicker">App sync</p>
            <h2>Public guide outside, protected workflow inside.</h2>
            <p>This option keeps public-facing instructions on the site and sends workflow actions to the separate app project when needed.</p>
          </div>
          <a class="primary-action" href="${appUrl}/alpha.html">Internal Alpha QA</a>
        </section>

        <section class="related-section">
          <div class="section-heading">
            <p class="section-kicker">Keep moving</p>
            <h2>Related pages</h2>
          </div>
          <div class="resource-grid compact">
            ${related
              .map((item) => `<a class="resource-card accent-${item.accent}" href="${item.file}">
                <span>${escapeHtml(item.eyebrow)}</span>
                <strong>${escapeHtml(item.title)}</strong>
                <em>${escapeHtml(item.summary)}</em>
              </a>`)
              .join("\n")}
          </div>
        </section>
      </article>
    </main>`
  });
}

function layout(option, { currentSlug, title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(option.tagline)}">
  <link rel="stylesheet" href="styles.css">
  <script src="option.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <header class="site-header">
    <a class="brand" href="index.html" aria-label="${escapeHtml(option.name)} home">
      <span class="brand-mark">TT</span>
      <span>
        <strong>ECTA Senior Capstone</strong>
        <small>${escapeHtml(option.optionLabel)} / ${escapeHtml(option.name)}</small>
      </span>
    </a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu">Menu</button>
    ${topNavHtml(currentSlug)}
  </header>
  <div class="review-banner" role="note">Stakeholder review option. Not the canonical production site or app.</div>
  <div class="mobile-menu" id="site-menu" hidden>
    ${navHtml(currentSlug)}
  </div>
  ${body}
  <footer class="site-footer">
    <div>
      <strong>${escapeHtml(option.name)} concept</strong>
      <p>Public student guide for the East Career and Technical Academy Senior Capstone Project.</p>
    </div>
    <div class="footer-links">
      <a href="program.html">Requirements</a>
      <a href="present.html">Presentation</a>
      <a href="${appUrl}/alpha.html">Internal Alpha QA</a>
    </div>
  </footer>
</body>
</html>`;
}

function optionJs() {
  return `const menuButton = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector("#site-menu");

if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    mobileMenu.hidden = open;
  });
}
`;
}

function titanCss() {
  return `:root {
  --ink: #111827;
  --muted: #5a6475;
  --paper: #f8fafc;
  --panel: #ffffff;
  --line: #d9e2ee;
  --navy: #172a48;
  --blue: #2b65b1;
  --gold: #d7a928;
  --red: #c7483e;
  --green: #168a75;
  --shadow: 0 18px 50px rgba(17, 24, 39, 0.14);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: "Segoe UI", Arial, sans-serif;
  line-height: 1.55;
}
a { color: inherit; }
.skip-link {
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 20;
  background: var(--gold);
  color: var(--ink);
  padding: 8px 12px;
  transform: translateY(-160%);
}
.skip-link:focus { transform: translateY(0); }
.review-banner {
  padding: 9px 32px;
  background: #fff7d6;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  font-size: 0.88rem;
  font-weight: 700;
}
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 76px;
  padding: 14px 32px;
  background: rgba(248, 250, 252, 0.94);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(18px);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--navy), var(--blue) 48%, var(--gold) 49%, var(--red));
  color: #fff;
  font-weight: 800;
}
.brand strong,
.brand small { display: block; }
.brand small {
  color: var(--muted);
  font-size: 0.82rem;
}
.top-links {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.top-links a,
.menu-toggle,
.primary-action,
.secondary-action {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 9px 13px;
  text-decoration: none;
  font-weight: 700;
  border: 1px solid transparent;
}
.top-links a {
  color: var(--muted);
}
.top-links a[aria-current="page"],
.top-links a:hover {
  color: var(--ink);
  background: #edf3f9;
  border-color: var(--line);
}
.menu-toggle {
  display: none;
  background: var(--navy);
  color: #fff;
}
.hero {
  position: relative;
  min-height: 520px;
  overflow: hidden;
  isolation: isolate;
}
.detail-hero { min-height: 430px; }
.hero-bg {
  position: absolute;
  inset: 0;
  z-index: -2;
  background: linear-gradient(105deg, rgba(23, 42, 72, 0.92), rgba(43, 101, 177, 0.62) 48%, rgba(215, 169, 40, 0.2)), url("assets/app-hero.jpg") center/cover;
}
.hero::after {
  content: "";
  position: absolute;
  inset: auto 0 0;
  height: 20%;
  z-index: -1;
  background: linear-gradient(0deg, var(--paper), rgba(248, 250, 252, 0));
}
.hero-content {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 96px 0 132px;
  color: #fff;
}
.detail-hero .hero-content { padding-top: 82px; }
.kicker,
.section-kicker {
  margin: 0 0 12px;
  color: var(--gold);
  font-size: 0.83rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0;
}
h1,
h2,
h3,
p { margin-top: 0; }
h1 {
  max-width: 720px;
  margin-bottom: 18px;
  font-size: 4rem;
  line-height: 1;
  letter-spacing: 0;
}
h2 {
  font-size: 2rem;
  line-height: 1.12;
  letter-spacing: 0;
}
.hero-copy {
  max-width: 660px;
  font-size: 1.18rem;
  color: rgba(255,255,255,0.92);
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}
.hero-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) 360px;
  gap: 32px;
  align-items: end;
}
.hero-main { min-width: 0; }
.hero-panel {
  display: grid;
  gap: 14px;
  padding: 20px;
  border: 1px solid rgba(255,255,255,0.16);
  border-top: 4px solid var(--gold);
  border-radius: 8px;
  background: rgba(14, 23, 39, 0.55);
  box-shadow: 0 18px 40px rgba(0,0,0,0.16);
  backdrop-filter: blur(14px);
}
.hero-panel h2 {
  font-size: 1.65rem;
  line-height: 1.08;
}
.hero-panel p,
.hero-panel li {
  color: rgba(255,255,255,0.82);
}
.hero-panel ul {
  margin: 0;
  padding-left: 20px;
}
.hero-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}
.hero-metrics div {
  display: grid;
  gap: 3px;
  min-width: 116px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.11);
}
.hero-metrics strong {
  font-size: 1.4rem;
  line-height: 1;
}
.hero-metrics span {
  color: rgba(255,255,255,0.8);
  font-size: 0.82rem;
  text-transform: uppercase;
}
.primary-action {
  background: var(--gold);
  color: #141414;
  box-shadow: 0 10px 30px rgba(0,0,0,0.18);
}
.secondary-action {
  background: rgba(255,255,255,0.13);
  color: #fff;
  border-color: rgba(255,255,255,0.35);
}
main {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
}
.intro-band,
.split-section,
.app-bridge,
.site-footer {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 32px;
  align-items: center;
}
.intro-band {
  margin-top: -76px;
  position: relative;
  z-index: 2;
  padding: 28px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
}
.intro-band p:last-child {
  color: var(--muted);
  font-size: 1.02rem;
}
.stage-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 46px 0;
}
.focus-section,
.cadence-section {
  margin: 56px 0;
}
.focus-grid,
.cadence-grid,
.quick-facts {
  display: grid;
  gap: 16px;
}
.focus-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.cadence-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.stage-card,
.resource-card,
.action-block,
.focus-card,
.cadence-card,
.fact-card {
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: 0 8px 28px rgba(17, 24, 39, 0.08);
}
.stage-card {
  min-height: 228px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  text-decoration: none;
}
.stage-card:hover,
.resource-card:hover,
.nav-link:hover {
  transform: translateY(-2px);
}
.stage-number {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #edf3f9;
  color: var(--navy);
  font-weight: 900;
}
.stage-card strong,
.resource-card strong,
.focus-card strong,
.cadence-card strong,
.fact-card h2 {
  font-size: 1.15rem;
  line-height: 1.2;
}
.stage-card span:last-child,
.resource-card em,
.focus-card p,
.cadence-card p,
.fact-card p {
  color: var(--muted);
  font-style: normal;
}
.focus-card,
.cadence-card,
.fact-card {
  padding: 18px;
}
.focus-card {
  min-height: 184px;
  display: grid;
  gap: 10px;
}
.focus-card span,
.cadence-card span {
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--gold);
}
.cadence-card {
  display: grid;
  gap: 10px;
  min-height: 176px;
  background: linear-gradient(180deg, rgba(215, 169, 40, 0.1), rgba(255,255,255,0));
}
.split-section,
.resource-section,
.related-section,
.app-bridge {
  margin: 56px 0;
}
.sync-list {
  margin: 18px 0 0;
  padding-left: 20px;
  color: var(--muted);
}
.sync-list li + li { margin-top: 10px; }
.menu-panel,
.side-menu {
  background: #172a48;
  color: #fff;
  border-radius: 8px;
  padding: 18px;
  box-shadow: var(--shadow);
}
.nav-group + .nav-group { margin-top: 18px; }
.nav-group h2 {
  margin: 0 0 8px;
  color: var(--gold);
  font-size: 0.84rem;
  text-transform: uppercase;
}
.nav-links {
  display: grid;
  gap: 7px;
}
.nav-link {
  display: block;
  padding: 10px 11px;
  border-radius: 8px;
  color: rgba(255,255,255,0.82);
  text-decoration: none;
  border: 1px solid rgba(255,255,255,0.1);
}
.nav-link[aria-current="page"] {
  background: #fff;
  color: var(--navy);
}
.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.resource-grid.compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.resource-card {
  min-height: 174px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  text-decoration: none;
}
.resource-card span {
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}
.accent-gold { border-top: 4px solid var(--gold); }
.accent-red { border-top: 4px solid var(--red); }
.accent-blue { border-top: 4px solid var(--blue); }
.accent-green { border-top: 4px solid var(--green); }
.page-shell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 28px;
  margin-top: 42px;
}
.quick-facts {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 24px;
}
.side-menu {
  align-self: start;
  position: sticky;
  top: 96px;
}
.action-layout {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.action-block {
  padding: 22px;
}
.action-block ul {
  margin: 0;
  padding-left: 20px;
  color: var(--muted);
}
.action-block li + li { margin-top: 10px; }
.app-bridge {
  padding: 26px;
  background: var(--navy);
  color: #fff;
  border-radius: 8px;
}
.app-bridge p { color: rgba(255,255,255,0.78); }
.site-footer {
  width: min(1180px, calc(100% - 40px));
  margin: 72px auto 0;
  padding: 30px 0 40px;
  border-top: 1px solid var(--line);
}
.site-footer p {
  margin: 6px 0 0;
  color: var(--muted);
}
.footer-links {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.footer-links a {
  color: var(--navy);
  font-weight: 800;
}
.mobile-menu {
  padding: 18px;
  background: var(--navy);
}
@media (max-width: 960px) {
  .top-links { display: none; }
  .menu-toggle { display: inline-flex; }
  h1 { font-size: 3rem; }
  .hero-layout,
  .intro-band,
  .split-section,
  .app-bridge,
  .site-footer,
  .page-shell {
    grid-template-columns: 1fr;
  }
  .side-menu { position: static; }
  .stage-grid,
  .focus-grid,
  .cadence-grid,
  .quick-facts,
  .resource-grid,
  .resource-grid.compact,
  .action-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .site-header { padding: 12px 16px; }
  .brand small { display: none; }
  .hero-content { width: min(100% - 28px, 1120px); padding-top: 72px; }
  h1 { font-size: 2.35rem; }
  main,
  .site-footer { width: min(100% - 28px, 1180px); }
  .hero-actions { display: grid; }
}`;
}

function primaryCss() {
  return `:root {
  --ink: #1d2433;
  --muted: #586174;
  --paper: #fffaf0;
  --panel: #ffffff;
  --line: #1d2433;
  --red: #e84b3c;
  --blue: #2563eb;
  --yellow: #f7c948;
  --green: #24a148;
  --sky: #dff3ff;
  --shadow: 6px 6px 0 #1d2433;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  color: var(--ink);
  font-family: "Trebuchet MS", "Segoe UI", Arial, sans-serif;
  line-height: 1.55;
  background:
    linear-gradient(rgba(37,99,235,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37,99,235,0.08) 1px, transparent 1px),
    var(--paper);
  background-size: 28px 28px;
}
a { color: inherit; }
.skip-link {
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 20;
  background: var(--yellow);
  border: 2px solid var(--ink);
  padding: 8px 12px;
  transform: translateY(-160%);
}
.skip-link:focus { transform: translateY(0); }
.review-banner {
  padding: 9px 28px;
  background: var(--yellow);
  border-bottom: 3px solid var(--ink);
  color: var(--ink);
  font-size: 0.88rem;
  font-weight: 900;
}
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 76px;
  padding: 14px 28px;
  background: #fff;
  border-bottom: 3px solid var(--ink);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: conic-gradient(from 45deg, var(--red), var(--yellow), var(--green), var(--blue), var(--red));
  border: 2px solid var(--ink);
  color: #fff;
  font-weight: 900;
  text-shadow: 1px 1px 0 var(--ink);
}
.brand strong,
.brand small { display: block; }
.brand small {
  color: var(--muted);
  font-size: 0.82rem;
}
.top-links {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.top-links a,
.menu-toggle,
.primary-action,
.secondary-action {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 9px 13px;
  text-decoration: none;
  font-weight: 900;
  border: 2px solid var(--ink);
}
.top-links a {
  background: #fff;
}
.top-links a:nth-child(4n+1) { box-shadow: inset 0 -6px 0 rgba(232,75,60,0.25); }
.top-links a:nth-child(4n+2) { box-shadow: inset 0 -6px 0 rgba(37,99,235,0.22); }
.top-links a:nth-child(4n+3) { box-shadow: inset 0 -6px 0 rgba(247,201,72,0.45); }
.top-links a:nth-child(4n+4) { box-shadow: inset 0 -6px 0 rgba(36,161,72,0.25); }
.top-links a[aria-current="page"],
.top-links a:hover {
  background: var(--yellow);
}
.menu-toggle {
  display: none;
  background: var(--blue);
  color: #fff;
}
.hero {
  position: relative;
  min-height: 500px;
  overflow: hidden;
  isolation: isolate;
  border-bottom: 3px solid var(--ink);
}
.detail-hero { min-height: 400px; }
.hero-bg {
  position: absolute;
  inset: 0;
  z-index: -2;
  background:
    linear-gradient(90deg, rgba(29,36,51,0.82), rgba(37,99,235,0.34), rgba(247,201,72,0.2)),
    url("assets/app-hero.jpg") center/cover;
}
.hero::after {
  content: "";
  position: absolute;
  inset: auto 0 0;
  height: 16px;
  background: repeating-linear-gradient(90deg, var(--red) 0 80px, var(--yellow) 80px 160px, var(--blue) 160px 240px, var(--green) 240px 320px);
}
.hero-content {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 88px 0 112px;
  color: #fff;
}
.kicker,
.section-kicker {
  margin: 0 0 12px;
  color: var(--yellow);
  font-size: 0.84rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0;
}
h1,
h2,
h3,
p { margin-top: 0; }
h1 {
  max-width: 760px;
  margin-bottom: 18px;
  font-size: 3.8rem;
  line-height: 1.02;
  letter-spacing: 0;
  text-shadow: 3px 3px 0 var(--ink);
}
h2 {
  font-size: 1.9rem;
  line-height: 1.14;
  letter-spacing: 0;
}
.hero-copy {
  max-width: 660px;
  font-size: 1.16rem;
  color: rgba(255,255,255,0.95);
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}
.hero-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) 350px;
  gap: 28px;
  align-items: end;
}
.hero-main { min-width: 0; }
.hero-panel {
  display: grid;
  gap: 14px;
  padding: 20px;
  border: 3px solid var(--ink);
  border-radius: 8px;
  background: rgba(255,255,255,0.92);
  color: var(--ink);
  box-shadow: var(--shadow);
}
.hero-panel h2 {
  font-size: 1.6rem;
  line-height: 1.08;
}
.hero-panel p,
.hero-panel li {
  color: var(--ink);
}
.hero-panel ul {
  margin: 0;
  padding-left: 20px;
}
.hero-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}
.hero-metrics div {
  display: grid;
  gap: 3px;
  min-width: 112px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 2px solid var(--ink);
  background: #fff;
  color: var(--ink);
  box-shadow: 4px 4px 0 var(--ink);
}
.hero-metrics strong {
  font-size: 1.4rem;
  line-height: 1;
}
.hero-metrics span {
  color: var(--muted);
  font-size: 0.82rem;
  text-transform: uppercase;
}
.primary-action {
  background: var(--yellow);
  color: var(--ink);
  box-shadow: var(--shadow);
}
.secondary-action {
  background: #fff;
  color: var(--ink);
  box-shadow: 4px 4px 0 var(--ink);
}
main {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;
}
.intro-band,
.split-section,
.app-bridge,
.site-footer {
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  gap: 28px;
  align-items: center;
}
.intro-band {
  margin-top: 30px;
  padding: 24px;
  background: var(--panel);
  border: 3px solid var(--ink);
  border-radius: 8px;
  box-shadow: var(--shadow);
}
.intro-band p:last-child {
  color: var(--muted);
  font-size: 1.02rem;
}
.stage-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin: 42px 0;
}
.focus-section,
.cadence-section {
  margin: 54px 0;
}
.focus-grid,
.cadence-grid,
.quick-facts {
  display: grid;
  gap: 18px;
}
.focus-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.cadence-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.stage-card,
.resource-card,
.action-block,
.menu-panel,
.side-menu,
.focus-card,
.cadence-card,
.fact-card {
  border: 3px solid var(--ink);
  border-radius: 8px;
  background: #fff;
  box-shadow: var(--shadow);
}
.stage-card {
  min-height: 226px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 19px;
  text-decoration: none;
}
.stage-card:hover,
.resource-card:hover,
.nav-link:hover {
  transform: translate(-2px, -2px);
}
.stage-number {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 2px solid var(--ink);
  background: var(--yellow);
  color: var(--ink);
  font-weight: 900;
}
.stage-card strong,
.resource-card strong,
.focus-card strong,
.cadence-card strong,
.fact-card h2 {
  font-size: 1.15rem;
  line-height: 1.2;
}
.stage-card span:last-child,
.resource-card em,
.focus-card p,
.cadence-card p,
.fact-card p {
  color: var(--muted);
  font-style: normal;
}
.focus-card,
.cadence-card,
.fact-card {
  padding: 18px;
}
.focus-card {
  min-height: 184px;
  display: grid;
  gap: 10px;
}
.focus-card span,
.cadence-card span {
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--ink);
}
.cadence-card {
  display: grid;
  gap: 10px;
  min-height: 176px;
  background: linear-gradient(180deg, rgba(247,201,72,0.24), rgba(255,255,255,0));
}
.split-section,
.resource-section,
.related-section,
.app-bridge {
  margin: 54px 0;
}
.sync-list {
  margin: 18px 0 0;
  padding-left: 20px;
  color: var(--muted);
}
.sync-list li + li { margin-top: 10px; }
.menu-panel,
.side-menu {
  padding: 18px;
  background: var(--sky);
}
.nav-group + .nav-group { margin-top: 18px; }
.nav-group h2 {
  margin: 0 0 8px;
  color: var(--ink);
  font-size: 0.84rem;
  text-transform: uppercase;
}
.nav-links {
  display: grid;
  gap: 8px;
}
.nav-link {
  display: block;
  padding: 10px 11px;
  border-radius: 8px;
  color: var(--ink);
  text-decoration: none;
  border: 2px solid var(--ink);
  background: #fff;
}
.nav-link[aria-current="page"] {
  background: var(--yellow);
}
.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.resource-grid.compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.resource-card {
  min-height: 174px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  text-decoration: none;
}
.resource-card span {
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}
.accent-gold { background-image: linear-gradient(180deg, rgba(247,201,72,0.28), rgba(255,255,255,0) 80px); }
.accent-red { background-image: linear-gradient(180deg, rgba(232,75,60,0.18), rgba(255,255,255,0) 80px); }
.accent-blue { background-image: linear-gradient(180deg, rgba(37,99,235,0.17), rgba(255,255,255,0) 80px); }
.accent-green { background-image: linear-gradient(180deg, rgba(36,161,72,0.17), rgba(255,255,255,0) 80px); }
.page-shell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 28px;
  margin-top: 40px;
}
.quick-facts {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 24px;
}
.side-menu {
  align-self: start;
  position: sticky;
  top: 96px;
}
.action-layout {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.action-block {
  padding: 22px;
}
.action-block ul {
  margin: 0;
  padding-left: 20px;
  color: var(--muted);
}
.action-block li + li { margin-top: 10px; }
.app-bridge {
  padding: 24px;
  background: var(--blue);
  color: #fff;
  border: 3px solid var(--ink);
  border-radius: 8px;
  box-shadow: var(--shadow);
}
.app-bridge .section-kicker { color: var(--yellow); }
.app-bridge p { color: rgba(255,255,255,0.9); }
.site-footer {
  width: min(1180px, calc(100% - 40px));
  margin: 70px auto 0;
  padding: 28px 0 40px;
  border-top: 3px solid var(--ink);
}
.site-footer p {
  margin: 6px 0 0;
  color: var(--muted);
}
.footer-links {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.footer-links a {
  font-weight: 900;
}
.mobile-menu {
  padding: 18px;
  background: var(--sky);
  border-bottom: 3px solid var(--ink);
}
@media (max-width: 960px) {
  .top-links { display: none; }
  .menu-toggle { display: inline-flex; }
  h1 { font-size: 3rem; }
  .hero-layout,
  .intro-band,
  .split-section,
  .app-bridge,
  .site-footer,
  .page-shell {
    grid-template-columns: 1fr;
  }
  .side-menu { position: static; }
  .stage-grid,
  .focus-grid,
  .cadence-grid,
  .quick-facts,
  .resource-grid,
  .resource-grid.compact,
  .action-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .site-header { padding: 12px 16px; }
  .brand small { display: none; }
  .hero-content { width: min(100% - 28px, 1120px); padding-top: 72px; }
  h1 { font-size: 2.3rem; }
  main,
  .site-footer { width: min(100% - 28px, 1180px); }
  .hero-actions { display: grid; }
}`;
}

async function writeCommonFiles(outDir, option, previousManifest) {
  await writeFile(join(outDir, "styles.css"), option.css(), "utf8");
  await writeFile(join(outDir, "option.js"), optionJs(), "utf8");
  await writeFile(join(outDir, ".nojekyll"), "", "utf8");
  await writeFile(
    join(outDir, "_redirects"),
    "# Stakeholder option output does not proxy app API or internal alpha routes.\n",
    "utf8"
  );
  await writeFile(
    join(outDir, "_headers"),
    [
      "/*",
      "  X-Content-Type-Options: nosniff",
      "  Referrer-Policy: strict-origin-when-cross-origin",
      "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
      "",
      "/assets/*",
      "  Cache-Control: public, max-age=604800"
    ].join("\n") + "\n",
    "utf8"
  );
  await writeFile(
    join(outDir, "wrangler.jsonc"),
    JSON.stringify(
      {
        "$schema": "../../node_modules/wrangler/config-schema.json",
        name: option.projectName,
        compatibility_date: "2026-05-18",
        pages_build_output_dir: "."
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  const baseManifest = {
    option: option.name,
    projectName: option.projectName,
    appUrl,
    pages: pages.map((page) => page.file)
  };
  const manifest = {
    generatedAt: resolveGeneratedAt(baseManifest, previousManifest),
    ...baseManifest
  };
  await writeFile(
    join(outDir, "site-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8"
  );
}

async function copyAssets(outDir) {
  const source = join(repoRoot, "assets", "app-hero.jpg");
  if (!(await exists(source))) {
    throw new Error("Missing assets/app-hero.jpg");
  }
  await mkdir(join(outDir, "assets"), { recursive: true });
  await cp(source, join(outDir, "assets", "app-hero.jpg"));
}

async function buildOption(option) {
  const outDir = join(outRoot, option.slug);
  assertInsideRepo(outDir);
  const previousManifest = await readJsonIfPresent(join(outDir, "site-manifest.json"));
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await copyAssets(outDir);
  await writeCommonFiles(outDir, option, previousManifest);
  await writeFile(join(outDir, "index.html"), indexHtml(option), "utf8");
  for (const page of pages) {
    await writeFile(join(outDir, page.file), detailHtml(option, page), "utf8");
  }
  const count = (await readdir(outDir)).length;
  console.log(`Built ${option.slug} with ${count} top-level entries.`);
}

async function main() {
  assertInsideRepo(outRoot);
  await mkdir(outRoot, { recursive: true });
  for (const option of options) {
    await buildOption(option);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
