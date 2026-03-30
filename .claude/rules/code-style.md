# Code Style Rules

## Vue (merchant-portal)

- Always use `<script setup lang="ts">` — no Options API.
- Use `class` in templates, never `className` (that's React/JSX).
- Components and composables are auto-imported — no explicit imports needed for `src/components/` or Vue Composition API.
- Use path aliases: `@` → `src/`, `@components`, `@pages`, `@utils`.
- Tailwind CSS v4 for all styling; no inline styles.

## TypeScript (both projects)

- Prefer explicit return types on exported functions.
- No `any` — use `unknown` + type guards if needed.
- Use `satisfies` over `as` for type assertions where possible.

## React / Shopify (tshirt-v3)

- File-based routing: one file per route in `app/routes/`.
- All loader/action functions must be async and typed.
- Use Shopify Polaris components for all UI in the admin app.

## General

- No commented-out code in commits.
- Meaningful variable names — avoid abbreviations.
- Keep functions small and focused.
