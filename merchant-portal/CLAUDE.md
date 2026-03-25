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
- **Layout**: `src/layouts/DefaultLayout.vue` is a thin wrapper that renders `<router-view />`. The main editor layout (3-column shell) lives inside `src/pages/Home.vue`.
- **Pages**: `src/pages/` — `Home.vue` (editor), `Product.vue`, `NotFound.vue`
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`. All design-system CSS (variables, layout, components) lives in `src/style.css`. Tailwind utility classes are available but the design uses custom CSS classes.
- **Auto-imports**: `unplugin-auto-import` and `unplugin-vue-components` are configured — Vue Composition API functions and components in `src/components/` are available without explicit imports.
- **Path aliases**: `@` → `src/`, `@components` → `src/components/`, `@pages` → `src/pages/`, `@utils` → `src/utils/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

### Editor Component Tree

```
Home.vue                   — assembles the shell grid
  AppTopBar.vue            — top bar (logo, breadcrumb, save actions)
  LeftSidebar.vue          — nav sections + zone list
  MainCanvas.vue           — product stage, zone draw/drag/resize
  RightPanel.vue           — feature cards + zone detail panel
    FeatureCard.vue        — reusable card with toggle + expand slot
    ToggleSwitch.vue       — v-model boolean toggle
  MobileNav.vue            — bottom tab bar (mobile only)
```

### Shared State — `src/composables/useEditorState.ts`

All editor state is a **module-level singleton** exported via `useEditorState()`. Every component calls it directly — no prop drilling, no Pinia.

Key state:
- `zones` — reactive array of `Zone` objects (draw/drag/resize updates mutate zone properties directly)
- `selectedZoneId` / `selectedZone` (computed) — currently selected zone
- `enabledFeatures` — `Set<string>` of active feature keys (`text`, `image`, `sticker`, `icon`)
- `tool` — `'draw' | 'select'`
- `mode` — `'merchant' | 'buyer'`

When adding new shared state or actions, add them to this composable and return them from `useEditorState()`.

### Integration with tshirt-v3

- `../tshirt-v3/app/routes/app.tsx` registers the `/app/merchant-portal` nav link.
- The iframe src points to `/vue/index.html`, which is the built Vue app served as a static file from `../tshirt-v3/public/vue/`.
- After making changes to the Vue app, run `npm run build` in `merchant-portal/` to update what the Shopify app serves.
- Vite is configured with `base: './'` so asset paths are relative — required for iframe serving.

---

## Developing New Features
**IMPORTANT**: When you work on a new feature, create a new git branch first. Then work on changes in that branch for the reminder of the session

### Adding a new page/route

1. Create the page component in `src/pages/MyPage.vue`
2. Add the route in `src/router/index.ts` as a child of the `DefaultLayout` route with a `meta: { title: '...' }`
3. Add a nav link in `LeftSidebar.vue` if it needs sidebar navigation

### Adding a new editor panel section

Add state/actions to `useEditorState.ts`, then consume them in the relevant component. Follow the existing pattern: computed state at the top of the composable, action functions below.

### Adding a new component

Place it in `src/components/`. It is auto-imported everywhere — no explicit import needed. Use `<script setup lang="ts">` with typed `defineProps` and `defineEmits`.

### Adding a new feature card (right panel)

Wrap it in `<FeatureCard>`. Use the `#icon` slot for the icon and the default slot for the expanded content. Connect the `enabled` prop and `@toggle` emit to `useEditorState().enabledFeatures`.

```vue
<FeatureCard name="..." description="..." :enabled="enabledFeatures.has('mykey')" @toggle="toggleFeature('mykey', $event)">
  <template #icon><!-- svg or char --></template>
  <!-- expanded sub-options -->
</FeatureCard>
```

### CSS & theming

The design uses a **Shopify Polaris-inspired light theme** defined in `src/style.css`. Always use CSS variables — never hardcode colors.

Key tokens:
| Variable | Value | Use |
|---|---|---|
| `--bg` | `#f6f6f7` | Page background |
| `--surface` | `#ffffff` | Cards, panels |
| `--surface2` | `#f1f2f3` | Subtle section bg |
| `--surface3` | `#e4e5e7` | Inputs, chips |
| `--text` | `#202223` | Primary text |
| `--text2` | `#6d7175` | Secondary text |
| `--text3` | `#b5b8bb` | Placeholder / muted |
| `--accent` | `#2c6ecb` | Interactive blue (buttons, active states) |
| `--green` | `#008060` | Shopify green (live indicators) |
| `--red` | `#d82c0d` | Destructive actions |

For SVG icons inside components, use `currentColor` or `var(--text2)` / `var(--text3)` for strokes/fills. Never hardcode old dark-theme hex values like `#55555f` or `#8a8a94`.

---

## Bug Fix Guidelines
**IMPORTANT**: When fixing a bug, please checkout and working on branch fixBug

### iframe layout — the most common source of layout bugs

The Vue app is embedded in a Shopify iframe. The height chain is:
```
html (100%) → body (100%) → #app (100%) → .shell (100%) → grid rows
```

**Rules that must not be broken:**
- All grid column elements (`.left-col`, `.main-col`, `.right-col`) must have `min-height: 0`. Without it, grid items don't respect their `1fr` track height and overflow the iframe.
- All `flex: 1` scroll children (`.left-scroll`, `.canvas-body`, `.right-scroll`) must have `min-height: 0` for the same reason.
- **Never set `height: 100%` on a grid item.** In CSS Grid, `height: 100%` on a grid item resolves to 100% of the grid *container* (full shell height), not the grid track it occupies. This makes the item overflow its row by the height of the preceding rows.
- **Never use `align-items: center` on a scrollable flex container.** When content overflows a centered flex container, half the overflow goes above `y=0` and is unreachable by scrolling. Use `align-items: flex-start` + `margin: auto` on the child for safe centering.

### Vue template pitfalls

- Use `class` not `className` — `className` is JSX/React and silently does nothing in Vue templates.
- Always use `<script setup lang="ts">` — the codebase is fully typed.
- When mutating zone properties directly (e.g., `zone.x = newX`), Vue 3's deep reactivity picks up the change automatically because `zones` is a deep `ref`. No need for `zones.value = [...zones.value]`.

### Checking for regressions

Always run `npm run build` after changes. It runs `vue-tsc` (type checking) before Vite builds, so TypeScript errors will surface before the build output is generated.
