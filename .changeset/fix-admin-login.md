---
"@blazing-cms/cms": patch
---

Fix admin login race condition: force-refresh ID token on admin-claim check, replace stale-closure post-login handler with effect-driven navigation, and add loading state during claim check
