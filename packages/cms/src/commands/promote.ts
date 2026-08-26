import type { App } from "firebase-admin/app";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { ADMIN_ROLE_VALUE, adminClaimStatus, adminPromotionClaims } from "../admin-claims.js";

type AdminAppModule = typeof import("firebase-admin/app");
type AdminAuthModule = typeof import("firebase-admin/auth");

export interface PromoteOptions {
  /** User identifier: uid or email address. */
  user?: string;
  project?: string;
  /** Only report whether the user has the admin role; do not modify claims. */
  check?: boolean;
}

/** Parse CLI args for the promote command (first arg after `promote` is the user). */
export function parsePromoteArgs(args: string[]): PromoteOptions {
  const rest = args.slice(1);
  const getFlag = (name: string): string | undefined => {
    const idx = rest.indexOf(name);
    return idx !== -1 ? rest[idx + 1] : undefined;
  };
  return {
    check: args.includes("--check"),
    project: getFlag("--project"),
    user: rest.find((a, i) => !a.startsWith("-") && rest[i - 1] !== "--project"),
  };
}

interface ResolvedUser {
  uid: string;
  email?: string;
  customClaims?: Record<string, unknown>;
}

async function loadAdminSdk(): Promise<{ appMod: AdminAppModule; authMod: AdminAuthModule }> {
  try {
    const [appMod, authMod] = await Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/auth"),
    ]);
    return { appMod, authMod };
  } catch {
    console.error(
      "  ✗ firebase-admin is not installed. Run `npm install firebase-admin` and retry.",
    );
    process.exit(1);
  }
}

function serviceAccountPath(): string | undefined {
  const path = process.env.FIREBASE_CREDENTIALS ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) return undefined;
  const resolved = resolve(path);
  return existsSync(resolved) ? resolved : undefined;
}

function printEnvInfo(project?: string): void {
  const projectId = project ?? process.env.VITE_FIREBASE_PROJECT_ID ?? "(not set)";
  const key = process.env.VITE_FIREBASE_API_KEY;
  const masked =
    key && key.length >= 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : (key ?? "(not set)");
  const credPath = process.env.FIREBASE_CREDENTIALS ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;
  console.warn(
    `  Firebase Environment:\n    Project ID:       ${projectId}\n    API Key:          ${masked}\n    Credentials:      ${credPath ?? "(not set — using ADC)"}\n`,
  );
}

async function initializeAdminApp(appMod: AdminAppModule, project?: string): Promise<App> {
  const serviceAccount = serviceAccountPath();
  if (!serviceAccount) {
    return appMod.initializeApp({ projectId: project });
  }
  try {
    return appMod.initializeApp({
      credential: appMod.cert(serviceAccount),
      projectId: project,
    });
  } catch {
    // Fall back to Application Default Credentials.
    return appMod.initializeApp({ projectId: project });
  }
}

async function fetchUser(authMod: AdminAuthModule, identifier: string): Promise<ResolvedUser> {
  const auth = authMod.getAuth();
  if (identifier.includes("@")) {
    const user = await auth.getUserByEmail(identifier);
    return { customClaims: user.customClaims, email: user.email, uid: user.uid };
  }
  const user = await auth.getUser(identifier);
  return { customClaims: user.customClaims, email: user.email, uid: user.uid };
}

/** Resolve a user by email or uid, exiting with a friendly error when not found. */
async function fetchUserOrExit(
  authMod: AdminAuthModule,
  identifier: string,
): Promise<ResolvedUser> {
  try {
    return await fetchUser(authMod, identifier);
  } catch (err) {
    const code = (err as { code?: string }).code;
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID ?? "unknown";
    console.error(
      code
        ? `  ✗ User not found: ${identifier} (${code}) in project "${projectId}"`
        : `  ✗ User not found: ${identifier} in project "${projectId}"`,
    );
    process.exit(1);
  }
}

function printCheckResult(isAdmin: boolean, identifier: string): void {
  if (isAdmin) {
    console.warn(`  ✓ ${identifier} has the "${ADMIN_ROLE_VALUE}" role (custom claim).`);
    return;
  }
  console.warn(`  ✗ ${identifier} does not have the "${ADMIN_ROLE_VALUE}" role.`);
  process.exit(1);
}

function printAlreadyAdmin(user: ResolvedUser): void {
  console.warn(
    `  ✓ ${user.email ?? user.uid} already has the "${ADMIN_ROLE_VALUE}" role. Nothing to do.`,
  );
}

async function setAdminClaim(authMod: AdminAuthModule, user: ResolvedUser): Promise<void> {
  await authMod
    .getAuth()
    .setCustomUserClaims(user.uid, adminPromotionClaims(user.customClaims ?? {}));
}

function userLabel(user: ResolvedUser): string {
  return user.email ?? user.uid;
}

export async function promote(options: PromoteOptions): Promise<void> {
  if (!options.user) {
    console.error(
      "  ✗ Missing user. Usage: blaze promote <uid-or-email> [--check] [--project <id>]",
    );
    process.exit(1);
  }

  console.warn("\n  Blazing CMS Promote\n");
  printEnvInfo(options.project);

  const { appMod, authMod } = await loadAdminSdk();
  await initializeAdminApp(appMod, options.project ?? process.env.VITE_FIREBASE_PROJECT_ID);
  const user = await fetchUserOrExit(authMod, options.user);
  const isAdmin = adminClaimStatus(user.customClaims) === "admin";

  if (options.check || isAdmin) {
    if (options.check) printCheckResult(isAdmin, options.user);
    else printAlreadyAdmin(user);
    return;
  }

  await setAdminClaim(authMod, user);
  console.warn(`\n  ✓ Promoted ${userLabel(user)} to "${ADMIN_ROLE_VALUE}" via custom claims.`);
  console.warn("  Note: the claim propagates to ID tokens on next sign-in or token refresh.\n");
}
