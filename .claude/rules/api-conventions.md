# API Conventions

## Shopify Admin GraphQL

- API version: `2026-04`
- Always use the `authenticate.admin` helper — never call GraphQL directly without auth.
- Use `#graphql` tag on template literals for syntax highlighting and tooling.

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

## Adding API Scopes

1. Add to `scopes` in `tshirt-v3/shopify.app.toml`
2. Add to `SCOPES` in `tshirt-v3/.env`
3. Run `npm run dev` — Shopify CLI will prompt to update

## Current scopes

- `write_metaobject_definitions`
- `write_metaobjects`
- `write_products`

## Vue ↔ Shopify communication

The Vue SPA runs in an iframe. Any data exchange with the Shopify app backend should go through `postMessage` or dedicated API routes in `tshirt-v3/app/routes/`.
