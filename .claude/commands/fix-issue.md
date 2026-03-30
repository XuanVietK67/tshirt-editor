# /project:fix-issue

Fix a specific bug or issue in the codebase.

## Usage

```
/project:fix-issue <description or issue number>
```

## Steps

1. Checkout a new branch: `git checkout -b fixBug/<short-name>`
2. Read and understand the relevant code before making changes.
3. Apply the minimal fix — do not refactor surrounding code.
4. Run type-check and lint for the affected project:
   - `tshirt-v3/`: `npm run typecheck && npm run lint`
   - `merchant-portal/`: `npm run build`
5. Summarize what was changed and why.

## Rules

- One fix per branch.
- Do not add features while fixing bugs.
- Do not skip `typecheck`/`lint` before committing.
