# Public Companion Site

Date: 2026-05-18

The ECTA Senior Capstone public companion site is published separately from the app.

## Cloudflare Projects

- Public companion site: `senior-capstone-public`
- Web app and backend: `senior-capstone-app`
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

The public build includes student-facing site pages, assets, templates, `styles.css`, and `app.js`. It does not include Cloudflare Pages Functions, D1 bindings, migrations, backend app routes, internal alpha routes, or account QA routes.

## Deploy

```powershell
npm run deploy:public-site
```

That deploys `public-companion/` to the Cloudflare Pages project `senior-capstone-public`.

`deploy:public-site` is production for the public guide only. It is not the secure app/backend deploy target, and it must not proxy internal alpha, account smoke, or app API routes.

Stakeholder option deploy targets are documented separately in `docs/stakeholder-site-options.md` and remain review-only.

## Update Cadence

A Codex automation updates the public site every three days from recent app logs and project progress records. It should summarize meaningful app changes into the public companion site without exposing private records, credentials, fake account passwords, or backend-only implementation detail.
