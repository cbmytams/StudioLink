# Security Audit Notes

Date: 2026-04-03

## Scope
- Client app (`src/**`)
- Build/runtime configuration (`vercel.json`, env usage)
- Dependency audit (`npm audit --production --audit-level=moderate`)

## Results
- `npm audit --production --audit-level=moderate`: **0 vulnerabilities**
- Secrets scan in `src/**`: **0 runtime secrets**
- `dangerouslySetInnerHTML`, `.innerHTML =`, `eval`: **not used**
- Security headers in `vercel.json`: present
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Allowlist (False Positives)

The pattern-based secret scan used:

```bash
service_role|SUPABASE_SERVICE|sk_live|re_|phc_|sntrys_
```

Known false positives:

1. `src/lib/analytics/posthog.test.ts`
- Contains `phc_test_key` in unit tests only.
- Not a real credential, not used in runtime code.

2. `src/lib/analytics/posthog.ts`
- `capture_pageview` and `capture_pageleave` matched because of the broad `re_` token.
- These are PostHog config keys, not secrets.

No runtime secrets are exposed in client source.

