# Public Companion Site

Date: 2026-05-18

The ECTA Senior Capstone public companion site is published separately from the app.

## Cloudflare Projects

- Public companion site: `senior-capstone-public`
- Web app and backend: `senior-capstone-app`
- App URL used by public-site redirects: `https://senior-capstone-app.pages.dev`

## Local Build

```powershell
npm run build:public-site
```

The build writes static output to `public-site/`, which is intentionally ignored by git.

The public build includes student-facing site pages, assets, templates, `styles.css`, and `app.js`. It does not include Cloudflare Pages Functions, D1 bindings, migrations, or backend app routes. The alpha console link redirects to the app project.

## Deploy

```powershell
npm run deploy:public-site
```

That deploys `public-site/` to the Cloudflare Pages project `senior-capstone-public`.

## Update Cadence

A Codex automation updates the public site every three days from recent app logs and project progress records. It should summarize meaningful app changes into the public companion site without exposing private records, credentials, fake account passwords, or backend-only implementation detail.
