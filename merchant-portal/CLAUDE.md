# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `merchant-portal/`:

```bash
npm run dev        # Start Vite dev server at http://localhost:5173
npm run build      # vue-tsc type-check then Vite build → ../tshirt-v3/public/vue/
npm run preview    # Preview the production build locally
```

`npm run build` is the only type-checker — always run it after changes. `vue-tsc` runs first and will fail before Vite if there are TypeScript or template errors.

For the parent Shopify app (`../tshirt-v3/`):

```bash
npm run dev        # Start Shopify CLI tunnel + React Router HMR
npm run typecheck  # react-router typegen + tsc --noEmit
npm run lint       # ESLint
```

## Architecture

### Vue 3 SPA

- **Routing**: `src/router/index.ts` — history mode, all pages lazy-loaded, title set via `router.afterEach()`. `NotFound` is registered outside the `DefaultLayout` route so it renders without the shell.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`. All design-system CSS (variables, layout, component classes) lives in `src/style.css`. Tailwind utilities are available but the design primarily uses custom CSS classes.
- **Path aliases**: `@` → `src/`, `@components` → `src/components/`, `@pages` → `src/pages/`, `@utils` → `src/utils/` (configured in `vite.config.ts` and `tsconfig.app.json`).
- **Imports**: `unplugin-auto-import` and `unplugin-vue-components` are in `devDependencies` but are **not wired up** in `vite.config.ts`. All Vue APIs (`ref`, `computed`, etc.) and all components must be imported explicitly.

### Editor Component Tree

```
Home.vue                   — assembles the 3-column shell grid
  AppTopBar.vue            — top bar (logo, breadcrumb, save actions)
  LeftSidebar.vue          — nav sections + zone list + "Add zone" button
  MainCanvas.vue           — product stage: zone draw / drag / resize / touch
  RightPanel.vue           — global feature cards + selected-zone detail panel
    FeatureCard.vue        — toggle card with #icon slot and collapsible body
    ToggleSwitch.vue       — v-model boolean toggle
  MobileNav.vue            — bottom tab bar (mobile only)
```

### Shared State — `src/composables/useEditorState.ts`

Module-level singleton, no Pinia. Every component calls `useEditorState()` directly.

| Export | Type | Description |
|---|---|---|
| `zones` | `Ref<Zone[]>` | All zones; mutate properties directly — deep reactivity picks up changes |
| `selectedZoneId` / `selectedZone` | `Ref` / `Computed` | Currently selected zone |
| `enabledFeatures` | `Ref<Set<string>>` | Active feature keys: `text`, `image`, `sticker`, `icon` |
| `tool` | `Ref<'draw' \| 'select'>` | Active canvas tool |
| `mode` | `Ref<'merchant' \| 'buyer'>` | Editor mode; buyer mode locks zones and clears selection |
| `addZone(canvas, x, y, w, h)` | function | Creates zone, auto-selects it, triggers entrance animation |
| `addDefaultZone()` | function | Calls `addZone` with preset coords (used by sidebar button) |

Add new shared state and actions to this composable and return them from `useEditorState()`.

### Canvas Interaction Model (`MainCanvas.vue`)

Zones are **always directly selectable and draggable** regardless of the active tool. The draw/select toolbar only controls whether clicking empty canvas starts drawing.

- **Click/touch any zone** → selects it and begins drag immediately
- **Draw tool + drag on empty canvas** → creates a new zone
- **Select tool + click empty canvas** → no draw (safe mode, deselection handled by `.canvas-inner` click)
- **Resize handle** (bottom-right corner) → resize; works with both mouse and touch
- Touch is handled via `touchstart`/`touchmove` (registered `{ passive: false }` to allow `preventDefault` during drag) / `touchend`

**Cursor feedback:**
- Zone: `grab` normally, `grabbing` while dragging (via reactive `isDragging` ref)
- Canvas: `crosshair` in draw mode, `default` in select mode

**New-zone entrance animation:** When a zone is added, `MainCanvas.vue` sets `newZoneId` for 700 ms, applying `.z-new` which runs the `@keyframes z-born` expanding-ring CSS animation defined in `style.css`.

### Integration with tshirt-v3

- Build output goes to `../tshirt-v3/public/vue/` (configured in `vite.config.ts`).
- `base: './'` in `vite.config.ts` makes asset paths relative — required for iframe serving.
- The iframe src in `tshirt-v3/app/routes/app.merchant-portal.tsx` is hardcoded to `http://localhost:5173` for dev; switch to `/vue/index.html` before deploying.

---

## Developing New Features

**IMPORTANT**: Create a new git branch before starting any feature work and stay on it for the session.(add new feature start prompt by: feat:, fix bug start prompt by fixbug:) if start prompt is not feat or fixbug, please working on current branch

### Adding a new page/route

1. Create `src/pages/MyPage.vue`
2. Add a lazy-loaded route in `src/router/index.ts` as a child of `DefaultLayout` with `meta: { title: '...' }`
3. Add a nav link in `LeftSidebar.vue` if needed

### Adding a new feature card (right panel)

Wrap content in `<FeatureCard>`. Wire `enabled` and `@toggle` to `useEditorState().enabledFeatures`:

```vue
<FeatureCard name="..." description="..." :enabled="enabledFeatures.has('mykey')" @toggle="toggleFeature('mykey', $event)">
  <template #icon><!-- svg --></template>
  <!-- expanded sub-options -->
</FeatureCard>
```

### CSS & theming

Always use CSS variables — never hardcode colors. Key tokens:

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
| `--green` | `#008060` | Shopify green |
| `--red` | `#d82c0d` | Destructive actions |

For SVG icons, use `currentColor` or `var(--text2)` / `var(--text3)` for strokes/fills.

---

## Bug Fix Guidelines

**IMPORTANT**: Checkout branch `fixBug` before fixing any bug and work on it throughout the session.

### iframe layout rules

The Vue app runs inside a Shopify iframe. The height chain must be unbroken:
```
html (100%) → body (100%) → #app (100%) → .shell (100%) → grid rows
```

**Never break these rules:**
- All grid column elements (`.left-col`, `.main-col`, `.right-col`) must have `min-height: 0` — without it, grid items overflow their `1fr` track.
- All `flex: 1` scroll containers (`.left-scroll`, `.canvas-body`, `.right-scroll`) must also have `min-height: 0`.
- **Never set `height: 100%` on a grid item.** It resolves to the full grid container height, not the track, causing overflow by the height of preceding rows.
- **Never use `align-items: center` on a scrollable flex container.** Overflow above `y=0` is unreachable by scroll. Use `align-items: flex-start` + `margin: auto` on the child instead.

### Vue template pitfalls

- Use `class` not `className` — `className` is JSX and silently does nothing in Vue templates.
- Always use `<script setup lang="ts">`.
- Mutating zone properties directly (e.g., `zone.x = newX`) is correct — Vue 3 deep reactivity on `zones` ref picks up the change without array reassignment.
