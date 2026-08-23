import type { App } from "firebase-admin/app";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { ADMIN_ROLE_VALUE, adminClaimStatus, adminPromotionClaims } from "../admin-claims.js";

export interface PromoteOptions {
  /** User identifier: uid or email address. */
  user?: string;
  project?: string;
  /** Only report whether the user has the admin role; do not modify claims. */
  check?: boolean;
}

function credentialPath(): string | undefined {
  const path = process.env.FIREBASE_CREDENTIALS ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) return undefined;
  const resolved = resolve(path);
  return existsSync(resolved) ? resolved : undefined;
}

async function loadAdminSdk() {
  try {
    const appMod = await import("firebase-admin/app");
    const authMod = await import("firebase-admin/auth");
    return { appMod, authMod };
  } catch {
    console.error(
      "  ✗ firebase-admin is not installed. Run `npm install firebase-admin` and retry.",
    );
    process.exit(1);
  }
}

async function resolveUser(
  getAuth: typeof import("firebase-admin/auth").getAuth,
  identifier: string,
): Promise<{ uid: string; email?: string; customClaims?: Record<string, unknown> }> {
  const auth = getAuth();
  if (identifier.includes("@")) {
    const user = await auth.getUserByEmail(identifier);
    return { customClaims: user.customClaims, email: user.email, uid: user.uid };
  }
  const user = await auth.getUser(identifier);
  return { customClaims: user.customClaims, email: user.email, uid: user.uid };
}

export async function promote(options: PromoteOptions): Promise<void> {
  const identifier = options.user;
  if (!identifier) {
    console.error(
      "  ✗ Missing user. Usage: blaze promote <uid-or-email> [--check] [--project <id>]",
    );
    process.exit(1);
  }

  console.warn("\n  Blazing CMS Promote\n");

  const { appMod, authMod } = await loadAdminSdk();
  const credPath = credentialPath();

  let app: App;
  try {
    app = credPath
      ? appMod.initializeApp({ credential: appMod.cert(credPath), projectId: options.project })
      : appMod.initializeApp({ projectId: options.project });
  } catch {
    // Reuse an already-initialized default app (e.g. repeated invocations).
    app = appMod.initializeApp();
  }

  let user: Awaited<ReturnType<typeof resolveUser>>;
  try {
    user = await resolveUser(authMod.getAuth, identifier);
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    console.error(`  ✗ User not found: ${identifier}${code ? ` (${code})` : ""}`);
    process.exit(1);
  }

  const status = adminClaimStatus(user.customClaims);

  if (options.check) {
    if (status === "admin") {
      console.warn(`  ✓ ${identifier} has the "${ADMIN_ROLE_VALUE}" role (custom claim).`);
      return;
    }
    console.warn(`  ✗ ${identifier} does not have the "${ADMIN_ROLE_VALUE}" role.`);
    process.exit(1);
  }

  if (status === "admin") {
    console.warn(
      `  ✓ ${user.email ?? user.uid} already has the "${ADMIN_ROLE_VALUE}" role. Nothing to do.`,
    );
    return;
  }

  await authMod
    .getAuth(app)
    .setCustomUserClaims(user.uid, adminPromotionClaims(user.customClaims ?? {}));

  console.warn(
    `\n  ✓ Promoted ${user.email ?? user.uid} to "${ADMIN_ROLE_VALUE}" via custom claims.`,
  );
  console.warn("  Note: the claim propagates to ID tokens on next sign-in or token refresh.");
  console.warn("  In the admin panel it takes effect after re-login (or token auto-refresh).\n");
}
