# Senior Capstone Project App

Static MVP for a public companion site to the physical `Your Senior` booklet.

## What is included

- Page-referenced process guide for booklet pages 2-18.
- Expanded phase-by-phase student workflow for booklet pages 1-18.
- Quick start steps, detailed student moves, evidence reminders, adult questions, mastery checks, and common mistakes for each process stop.
- Phase-by-phase student checklist with progress saved in the browser.
- Local draft notes saved in the browser.
- Template file library for proposal, rubrics, build, mentor meetings, presentation, display, gratitude, portfolio, recognition, resume highlights, and status tracking.
- Portfolio path summary, full rubric tables, grade map, recognition section, and a 1.0 role/login roadmap.
- Written coverage audit in `AUDIT.md`.
- Public-safe generated hero image in `assets/app-hero.jpg` with no identifiable students.

## Run locally

Open `index.html` in a browser. No build step is required.

For a local server:

```powershell
& "C:\Users\bryan\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" -e "const http=require('http'),fs=require('fs'),path=require('path');const root=process.cwd();const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.md':'text/markdown'};http.createServer((req,res)=>{const clean=decodeURIComponent(req.url.split('?')[0]);let file=path.join(root,clean==='/'?'index.html':clean);if(!file.startsWith(root)){res.writeHead(403);return res.end('Forbidden')}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data)})}).listen(4173,()=>console.log('http://localhost:4173'))"
```

## Public hosting

Because the app is static, it can be hosted from the repository root on GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any basic web host.

For GitHub Pages, push the repo to GitHub and set Pages to deploy from the branch root.

## Updating official links

The student-facing data lives in `app.js`.

- Edit `templates` to replace local Markdown files with official Google Docs, Google Forms, PDFs, or class website URLs.
- Edit `phases` to adjust page references, dates, program language, or checklist items.
- Edit `auditFindings`, `grades`, `recognitions`, `portfolioFeatures`, and `rubrics` when the booklet or school requirements change.
- Keep any public images free of identifiable students unless the school has explicit permission for public web use.

## 1.0 direction

The public MVP should remain separate from private student records. For 1.0, add:

- Authentication for students, mentors, teachers, and admins.
- Student profile fields: name, email, program, graduation year, teacher, mentor, group, current phase, status, timestamps.
- Group assignments and mentor caseloads.
- Shared comments with role labels, timestamps, visibility rules, and audit history.
- Admin reporting for completion by phase, program, teacher, mentor, and recognition candidates.

Good backend options for the next step: Supabase, Firebase, or a small custom API with Postgres.
