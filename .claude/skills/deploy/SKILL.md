# Deploy Skill

Guide through deploying both the Vue SPA and Shopify app to production.

## Trigger

Use when asked to "deploy", "ship", "release", or "push to production".

## Steps

1. **Switch iframe src** in `tshirt-v3/app/routes/app.merchant-portal.tsx`:
   - Change `http://localhost:5173` → `/vue/index.html`

2. **Build Vue SPA**:
   ```bash
   cd merchant-portal && npm run build
   ```
   Output lands in `tshirt-v3/public/vue/`.

3. **Validate Shopify app**:
   ```bash
   cd tshirt-v3
   npm run typecheck
   npm run lint
   npm run setup   # prisma migrate deploy
   ```

4. **Deploy**:
   ```bash
   cd tshirt-v3 && npm run deploy
   ```

5. **Revert iframe src** back to `http://localhost:5173` for local dev.

## Notes

- Never deploy with the localhost iframe src committed.
- Confirm Prisma migrations ran without errors before deploying.
