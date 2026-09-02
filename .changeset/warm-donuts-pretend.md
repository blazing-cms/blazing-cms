---
"@blazing-cms/cms": patch
---

Fix admin claim check returning false despite a role:admin claim: read cached ID token claims first and only force-refresh as an escalation, falling back to the cached verdict if the refresh fails. Consolidate the check into a shared loadAdminClaim helper used by both auth and RBAC providers, so a failed or stale token refresh can no longer silently report the user as not-admin.
