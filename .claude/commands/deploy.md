# /project:deploy

Prepare and deploy the app to production.

## Pre-deploy checklist

1. Switch iframe src from `http://localhost:5173` to `/vue/index.html` in `tshirt-v3/app/routes/app.merchant-portal.tsx`.
2. Build the Vue SPA: `cd merchant-portal && npm run build`
3. Type-check + lint the Shopify app: `cd tshirt-v3 && npm run typecheck && npm run lint`
4. Run any pending Prisma migrations: `cd tshirt-v3 && npm run setup`
5. Deploy to Shopify: `cd tshirt-v3 && npm run deploy`

## Post-deploy

- Confirm the app loads correctly in the Shopify Admin.
- Check the theme app extension is active on the storefront.
- Revert iframe src back to `http://localhost:5173` for local dev.
