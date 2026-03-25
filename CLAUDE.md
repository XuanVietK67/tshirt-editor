# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This is a monorepo with two projects:

- `tshirt-v3/` — Shopify app built with React Router v7 + TypeScript (SSR, Prisma, Shopify Admin GraphQL)
- `merchant-portal/` — Vue 3 + TypeScript + Vite SPA (the t-shirt editor UI)

The Vue SPA builds into `tshirt-v3/public/vue/` and is served as an iframe embedded inside the Shopify app at `/app/merchant-portal`.

## Commands

### tshirt-v3 (run from `tshirt-v3/`)

```bash
npm run dev          # Start Shopify CLI dev environment (tunnel + HMR)
npm run build        # Build React Router app
npm run start        # Serve production build
npm run setup        # prisma generate + prisma migrate deploy
npm run lint         # ESLint with caching
npm run typecheck    # react-router typegen + tsc --noEmit
npm run deploy       # Deploy to Shopify App Store
```

### merchant-portal (run from `merchant-portal/`)

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # vue-tsc type-check + Vite build → ../tshirt-v3/public/vue/
npm run preview      # Preview production build locally
```

After editing Vue code, run `npm run build` in `merchant-portal/` so the Shopify app serves the updated static files.

## Architecture

### tshirt-v3 (Shopify App — React Router v7)

- **Auth**: Shopify OAuth 2.0 via `@shopify/shopify-app-react-router`. All routes under `app.tsx` require authentication. The `shopify.server.ts` singleton handles session management via Prisma adapter.
- **Database**: Prisma with SQLite for dev; configure `DATABASE_URL` for PostgreSQL/MySQL in production. Schema at `prisma/schema.prisma` (only a `Session` model for Shopify auth).
- **Routing**: File-based routing in `app/routes/`. Protected routes are children of `app.tsx` (layout + auth wrapper). `auth.$.tsx` handles OAuth callbacks.
- **Shopify API**: Admin GraphQL v2026-04. Scopes: `write_metaobject_definitions`, `write_metaobjects`, `write_products`.
- **Merchant portal route**: `app/routes/app.merchant-portal.tsx` renders an iframe pointing to `/vue/index.html`.
- **Extensions**: `extensions/personalize/` — a Shopify theme app extension with a personalize button block.

### merchant-portal (Vue 3 SPA)

- **Routing**: Vue Router in `src/router/index.ts`. All pages are lazy-loaded. Title is set via `router.afterEach()`.
- **Layout**: `src/layouts/DefaultLayout.vue` wraps all pages; `NotFound` renders outside the layout.
- **Editor state**: Shared composable at `src/composables/useEditorState.ts` — zones and features are managed here.
- **Auto-imports**: `unplugin-auto-import` + `unplugin-vue-components` — Vue Composition API functions and all `src/components/` components are available without explicit imports.
- **Path aliases**: `@` → `src/`, `@components` → `src/components/`, `@pages` → `src/pages/`, `@utils` → `src/utils/`.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`. Global styles in `src/style.css`.
- **Build output**: `base: './'` in `vite.config.ts` ensures relative asset paths required for iframe serving.

### Vue Component Conventions

- Use `class` (not `className`) in Vue templates — `className` is JSX/React syntax.
- Use `<script setup lang="ts">` for all component logic.

## Developing Features & Fixing Bugs

### Local Dev Setup

Two terminals must run simultaneously:

```bash
# Terminal 1 — Shopify app (tshirt-v3/)
npm run dev        # starts Shopify CLI tunnel + React Router HMR

# Terminal 2 — Vue editor (merchant-portal/)
npm run dev        # starts Vite at http://localhost:5173
```

The iframe in `tshirt-v3/app/routes/app.merchant-portal.tsx` is hardcoded to `http://localhost:5173` for dev. Before deploying, switch it to `/vue/index.html` and run `npm run build` in `merchant-portal/`.

### Adding a New Page to the Merchant Portal (Vue)

1. Create `merchant-portal/src/pages/YourPage.vue`.
2. Add a lazy-loaded route in `merchant-portal/src/router/index.ts`.
3. Add a nav link in `merchant-portal/src/layouts/DefaultLayout.vue` or `merchant-portal/src/components/LeftSidebar.vue` as appropriate.

### Adding a New Route to the Shopify App (React Router)

1. Create `tshirt-v3/app/routes/app.your-route.tsx` — it is automatically registered via file-based routing.
2. Add a nav link in `tshirt-v3/app/routes/app.tsx` using the Shopify Polaris `<NavMenu>`.
3. Run `npm run typecheck` to regenerate route types.

### Calling the Shopify Admin GraphQL API

Use the `authenticate.admin` helper from `shopify.server.ts` in any route loader/action:

```ts
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`#graphql
    query { shop { name } }
  `);
  return response.json();
};
```


### Adding new feature or fix some bugs
**IMPORTANT**: When you work on a new feature, create a new git branch first. Then work on changes in that branch for the reminder of the session, and if you fixBug please checkout to brand fixBug and work on it

### Adding New Shopify API Scopes

1. Add the scope to `scopes` in `tshirt-v3/shopify.app.toml`.
2. Add it to the `SCOPES` env var in `tshirt-v3/.env`.
3. Run `npm run dev` — Shopify CLI will prompt to update the app configuration.

### Database Schema Changes (Prisma)

```bash
# After editing tshirt-v3/prisma/schema.prisma:
cd tshirt-v3
npx prisma migrate dev --name describe-your-change   # creates migration + regenerates client
```

### Before Committing

```bash
# In tshirt-v3/
npm run typecheck   # React Router typegen + tsc
npm run lint

# In merchant-portal/
npm run build       # vue-tsc type-check + build (catches Vue template errors)
```
