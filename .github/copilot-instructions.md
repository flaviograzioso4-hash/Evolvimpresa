## Quick context for AI coding agents

This is a small Next.js app using the `app/` router (server-first) and Tailwind/postcss for styling. Key facts you can rely on:

- **Framework:** `next@16` with React 19, app directory under `src/app/`.
- **Dev scripts:** `npm run dev` (runs `next dev`), `npm run build` (`next build`), `npm run start` (`next start`), `npm run lint` runs `eslint`.
- **Static export:** `next.config.mjs` sets `output: 'export'` and `distDir: 'out'` — builds are intended to produce a static site in `out/`.
- **Path alias:** `@/*` → `./src/*` (defined in `jsconfig.json`). Use `import X from '@/path/…'` when adding files under `src/`.

**Big picture / architecture**

- `src/app/layout.js` — top-level RootLayout (server component). Fonts using `next/font` are configured here. Keep layout-level concerns (fonts, metadata, global providers) in this file.
- `src/app/page.js` — main landing page. This file is a client component (`'use client'`) and contains UI helper components (e.g. `ImgWithFallback`, `GlowCard`, `VerticalSteps`). Prefer extracting reusable UI to `src/components/` if adding new code.
- Static assets live in `public/` and are referenced with root paths (e.g. `/image.png`). Some references in `page.js` point to `/mnt/data/...` or dynamically generated images — guard against broken paths (use `ImgWithFallback` pattern).

**Project-specific conventions & patterns**

- UI components live inline in `page.js` currently; prefer small, focused components under `src/components/` when adding features.
- Image fallback pattern: `ImgWithFallback` uses an inline SVG data URI as fallback on `onError`. Reuse this component when adding images that may be missing.
- Visual theme: custom colors and tokens are defined in `src/app/globals.css` (and Tailwind via `postcss.config.mjs`). Preserve these CSS tokens and color values when changing UI.
- Client vs Server: The app uses the new `app/` conventions. Add `use client` at the top of client components only. `layout.js` is server by default and imports `next/font`.

**Linting / formatting / code style**

- ESLint is configured with Next.js Core Web Vitals in `eslint.config.mjs`. Use `npm run lint` to check files. There is no dedicated formatter config (e.g. Prettier) in the repo — follow existing file formatting.

**Build & deploy notes**

- Development: `npm run dev` serves on `localhost:3000` by default.
- Production build: `npm run build` will produce an export per `next.config.mjs` — final files appear in `out/` (check `distDir`). When testing the static output locally, you can serve `out/` with a static server (`npx serve out`), or use `next start` for Next's server build (project currently configured for static export).

**Where to look when things break**

- Routing and layouts: `src/app/layout.js` and files under `src/app/`.
- Main UI and component patterns: `src/app/page.js`.
- CSS tokens and Tailwind setup: `src/app/globals.css`, `postcss.config.mjs`, and `tailwind` in `package.json`.
- Build config: `next.config.mjs`.

**Example snippets / recommendations**

- Import using alias: `import Button from '@/components/Button'` (place `Button` under `src/components/`).
- Create a new page: `src/app/my-page/page.js` (export a default React component). Server components by default; add `'use client'` at top to use hooks.
- Reuse image fallback: copy or import `ImgWithFallback` from `src/app/page.js` into `src/components/ImgWithFallback.js` if you extract it.

If anything here is unclear or you'd like more detail (tests, CI, or deployment specifics), tell me which area to expand and I will iterate.
