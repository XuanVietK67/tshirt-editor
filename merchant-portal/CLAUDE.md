# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This repo contains two projects:

- `merchant-portal/` — Vue 3 + TypeScript + Vite SPA (this working directory)
- `../tshirt-v3/` — Parent Shopify app built with React Router v7

The Vue app builds into `../tshirt-v3/public/vue/` and is served as an iframe embedded inside the Shopify app at the `/app/merchant-portal` route.

## Commands

All commands run from `merchant-portal/`:

```bash
npm run dev        # Start Vite dev server
npm run build      # Type-check (vue-tsc) then build to ../tshirt-v3/public/vue/
npm run preview    # Preview the production build locally
```

For the parent Shopify app (`../tshirt-v3/`):

```bash
npm run dev        # Start Shopify CLI dev environment
npm run build      # Build React Router app
npm run lint       # Run ESLint
npm run typecheck  # Run React Router typegen + tsc
```

## Architecture

### Merchant Portal (Vue 3 SPA)

- **Routing**: Vue Router with history mode. Routes are defined in `src/router/index.ts`. All pages are lazy-loaded. The router sets the page title via `router.afterEach()`.
- **Layout**: `src/layouts/DefaultLayout.vue` wraps all pages and contains the navigation bar. The catch-all `NotFound` route renders outside the layout.
- **Pages**: `src/pages/` — `Home.vue`, `Product.vue`, `NotFound.vue`
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`. Global styles in `src/style.css`.
- **Auto-imports**: `unplugin-auto-import` and `unplugin-vue-components` are configured — Vue Composition API functions and components in `src/components/` are available without explicit imports.
- **Path aliases**: `@` → `src/`, `@components` → `src/components/`, `@pages` → `src/pages/`, `@utils` → `src/utils/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

### Integration with tshirt-v3

- `../tshirt-v3/app/routes/app.tsx` registers the `/app/merchant-portal` nav link.
- The iframe src points to `/vue/index.html`, which is the built Vue app served as a static file from `../tshirt-v3/public/vue/`.
- After making changes to the Vue app, run `npm run build` in `merchant-portal/` to update what the Shopify app serves.
- Vite is configured with `base: './'` so asset paths are relative — required for iframe serving.

### Vue Component Conventions

- Use `class` (not `className`) for HTML attributes in Vue templates. `className` is React/JSX syntax and will not work.
- Use `<script setup lang="ts">` for component logic.
