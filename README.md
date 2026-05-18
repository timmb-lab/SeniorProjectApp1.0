# Senior Capstone Project Guide

Public companion site for the East Career and Technical Academy Senior Capstone Project.

The site is written for students. It maps the physical `Your Senior` booklet into separate pages with:

- one page for each project stop;
- page references back to the booklet;
- official-link reminders;
- program requirement checks;
- pacing guidance;
- weak/better/strongest examples;
- vocabulary and reflection supports;
- templates for planning and evidence;
- portfolio, rubric, grade, and recognition guidance.

Students should always follow the current directions, deadlines, and links shared through Senior Remind, the class website, and their senior project team.

## Public Website

Open `index.html` or the Cloudflare/GitHub Pages URL for the public ECTA Senior Capstone website. The root page links into program requirements, the phase menu, focused student supports, templates, product app preview, and Day 7 alpha flow.

## Day 7 Alpha

The working MVP alpha shell is `alpha.html`. It uses seeded personas for student, program teacher, mentor, admin, and misc admin roles while production accounts are still hardening.

Run it locally with:

```powershell
npm run dev:alpha
```

Then open `http://localhost:8788/alpha.html`. This requires Node/npm plus Wrangler from the project dev dependencies. The alpha loads `/api/alpha/state` from a Cloudflare Pages Function when available and falls back to `data/alpha-demo-state.json` for static review. Do not enter real student records.

## MVP Backend Foundation

The first Cloudflare MVP foundation is scaffolded with Pages Functions, D1, hardened username/password auth endpoints, and Google Drive evidence-repository metadata. Setup notes and live resource IDs are tracked in `docs/backend-setup.md`.

## Day 7 Alpha

The working alpha flow lives at `alpha.html` and uses `/api/alpha/state` for D1-backed seeded demo state. The runbook is `docs/alpha-runbook.md`.

## Teacher Companion

Teacher planning notes live in `teacher-companion/implementation-guide.md`. They are not linked from the student guide.
