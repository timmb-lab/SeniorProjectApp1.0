# Public Companion Site

Date: 2026-05-18

The ECTA Senior Capstone public companion site is published separately from the app.

## Cloudflare Projects

- Public companion site: `senior-capstone-public`
- Stakeholder option 2, Titan Blend: `senior-capstone-option-titan`
- Stakeholder option 3, Back To Basics: `senior-capstone-option-primary`
- Web app and backend: `senior-capstone-app`
- App URL used by public-site redirects: `https://senior-capstone-app.pages.dev`
- Cloudflare Pages project created: 2026-05-18

Review URLs:

- Option 1: `https://senior-capstone-public.pages.dev/`
- Option 2: `https://senior-capstone-option-titan.pages.dev/`
- Option 3: `https://senior-capstone-option-primary.pages.dev/`

## Local Build

```powershell
npm run build:public-site
```

The build writes static output to `public-companion/`, which is tracked so Cloudflare can deploy it from a separate project root without reading the app's root Wrangler configuration.

The public build includes student-facing site pages, assets, templates, `styles.css`, and `app.js`. It does not include Cloudflare Pages Functions, D1 bindings, migrations, or backend app routes. The alpha console link redirects to the app project.

## Deploy

```powershell
npm run deploy:public-site
```

That deploys `public-companion/` to the Cloudflare Pages project `senior-capstone-public`.

## Update Cadence

A Codex automation updates the public site every three days from recent app logs and project progress records. It should summarize meaningful app changes into the public companion site without exposing private records, credentials, fake account passwords, or backend-only implementation detail.
