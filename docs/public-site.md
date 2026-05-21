# East Tech Senior Capstone Guide

Date: 2026-05-21

The East Tech Senior Capstone Guide is published separately from the Capstone Project product/app.

## Cloudflare Projects

- East Tech guide project: `senior-capstone-public`
- Capstone Project app/backend project: `senior-capstone-app`
- Future East Tech guide custom domain: TBD
- Current guide fallback: `https://senior-capstone-public.pages.dev/`

The guide is school-specific public content. It may use East Tech/Titans branding and Student Guide / Teacher Guide public modes. It is not the long-term Capstone Project product root.

## Local Build

```powershell
npm run build:public-site
```

The build writes static output to `public-companion/`, which is tracked so Cloudflare can deploy it from a separate project root without reading the app's root Wrangler configuration.

The public build includes student- and teacher-facing guide pages, assets, templates, `styles.css`, and `app.js`. It does not include Cloudflare Pages Functions, D1 bindings, migrations, backend app routes, internal alpha routes, account QA routes, or retired stakeholder option routes.

## Deploy

```powershell
npm run deploy:public-site
```

That deploys `public-companion/` to the Cloudflare Pages project `senior-capstone-public`.

`deploy:public-site` is production for the East Tech guide only. It is not the secure app/backend deploy target, and it must not proxy internal alpha, account smoke, or app API routes.

## Retired Options

The former option URLs for Titan Blend and Back To Basics are retired as active review choices. Titan direction now belongs in the canonical East Tech guide styling. Use `npm run check:site-options` to verify retired option scripts do not return.

## Update Cadence

Automation cadence is unchanged. Public-site updates should summarize meaningful app changes into the East Tech guide without exposing private records, credentials, fake account passwords, or backend-only implementation detail.
