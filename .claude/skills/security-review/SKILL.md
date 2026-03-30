# Security Review Skill

Perform a security review of the current changes or a specified file/directory.

## Trigger

Use when asked to "security review", "audit for vulnerabilities", or "check for security issues".

## Steps

1. Scan for common vulnerabilities:
   - **XSS**: Unescaped user input rendered in templates (`v-html`, `innerHTML`)
   - **CSRF**: Unprotected mutations/actions
   - **SQL Injection**: Raw Prisma queries with interpolated user input
   - **Secrets leakage**: Hardcoded API keys, tokens, or credentials in source
   - **Auth bypass**: Routes that skip `authenticate.admin`

2. Check iframe security:
   - Verify `Content-Security-Policy` headers if configured
   - Check that the iframe only loads trusted origins

3. Check Shopify-specific:
   - OAuth flow handled entirely by `@shopify/shopify-app-react-router` (do not bypass)
   - Session data only accessed via `authenticate.admin`

## Output

Report findings grouped by severity: **Critical**, **High**, **Medium**, **Low**, **Info**.
