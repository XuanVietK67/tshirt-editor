# /project:review

Review the current branch's changes for correctness, style, and potential issues.

## Steps

1. Run `git diff main...HEAD` to see all changes since branching off main.
2. For each changed file:
   - Check for Vue template issues (use `class` not `className`, `<script setup lang="ts">`)
   - Check for TypeScript errors (run `npm run typecheck` in the relevant project)
   - Check for ESLint issues (`npm run lint` in `tshirt-v3/`)
3. Summarize findings grouped by: **Bugs**, **Style issues**, **Suggestions**.

## Focus areas

- Vue 3 Composition API correctness
- Shopify Admin GraphQL query correctness
- Prisma schema / migration consistency
- No hardcoded localhost URLs in production paths
