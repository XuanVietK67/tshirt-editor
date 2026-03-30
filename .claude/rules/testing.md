# Testing Rules

## Before every commit

### tshirt-v3
```bash
npm run typecheck   # React Router typegen + tsc --noEmit
npm run lint        # ESLint
```

### merchant-portal
```bash
npm run build       # vue-tsc type-check + Vite build (catches Vue template errors)
```

## Manual testing checklist

- [ ] Vue editor loads at `http://localhost:5173`
- [ ] Shopify app loads and authenticates via OAuth
- [ ] Merchant portal iframe renders correctly inside the Shopify Admin
- [ ] Theme app extension renders the personalize button on the storefront

## Notes

- There is no automated test suite yet. Type-check + lint + build serve as the primary quality gates.
- When adding a new route, verify it appears in the Shopify Admin nav.
