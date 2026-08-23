import { config } from "dotenv";
config();

import type { CapabilitiesConfig } from "@blazing-cms/types";

export interface BlazeUserConfig {
  projectName?: string;
  firebase: {
    projectId: string;
    apiKey?: string;
    authDomain?: string;
    storageBucket?: string;
    appId?: string;
  };
  capabilities?: CapabilitiesConfig;
}

export function defineConfig(config: BlazeUserConfig): BlazeUserConfig {
  return config;
}

function printHelp(): void {
  console.warn(`
Usage: blaze <command> [options]

Commands:
  dev               Start dev server (Vite + Firebase Emulator)
  build             Build admin panel for production
  generate          Run code generation (types, SDK, schema registry, rules, indexes)
  deploy            Deploy admin panel to Firebase Hosting
  scaffold          Scaffold a new collection, global, or component
  lint              Lint schema definitions
  doctor            Check project health
  promote           Promote a user to the admin role via custom claims

Options:
  --help            Show help
  --sync            Deprecated. Sync now runs automatically when the
                     VITE_BACKEND_MODE env var is set to firebase.
  --project <id>    Firebase project ID (for deploy/promote)
  --dir <path>      Schema directory (default: cms/)
  --name <slug>     Schema slug (for scaffold)

Promote:
  blaze promote <uid-or-email> [--check] [--project <id>]
                    Sets the role:admin custom claim on a Firebase Auth user.
                    With --check, only reports whether the user already has
                    the admin role (exit code 0 = admin, 1 = not admin).
                    Requires service-account credentials via FIREBASE_CREDENTIALS
                    or GOOGLE_APPLICATION_CREDENTIALS (or Application Default
                    Credentials). Users must re-login for the claim to appear
                    in their ID token.

Config:
  .env              Loaded via dotenv. Set VITE_FIREBASE_* variables for
                     project config and VITE_BACKEND_MODE (firebase|mock).
                    See .env.example for required vars.

Schema Sync Flow:
  TypeScript schema files (cms/collections/*.ts, cms/globals/*.ts, cms/components/*.ts)
  are the source of truth. Running "blaze generate --sync" regenerates local artifacts
  (types, validation, SDK, schema registry, Firestore rules/indexes) and writes schema
  definitions to Firestore under _schemas/. The admin panel introspects these at runtime.

  Sync is automatic when the dev server runs with the VITE_BACKEND_MODE env var
  set to firebase. Schemas are written to Firestore under _schemas/ on every generation.

  Security rules in firestore.rules protect _schemas/ (admin-only writes, all-auth reads)
  and generate per-collection content rules.
`);
}

function getFlag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : undefined;
}

export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help") {
    printHelp();
    return;
  }

  const cmd = args[0];

  switch (cmd) {
    case "dev": {
      const m = await import("./commands/dev.js");
      await m.dev({
        emulator: args.includes("--emulator"),
        host: getFlag(args, "--host"),
        port: getFlag(args, "--port") ? Number(getFlag(args, "--port")) : undefined,
        sync: args.includes("--sync"),
      });
      break;
    }
    case "build": {
      const m = await import("./commands/build.js");
      await m.build({});
      break;
    }
    case "generate": {
      const m = await import("./commands/generate.js");
      const typeNames = ["types", "validation", "sdk", "registry", "rules", "indexes"];
      const positional = args
        .slice(1)
        .filter((a, i) => !a.startsWith("-") && args.slice(1)[i - 1] !== "--dir")
        .find((a) => typeNames.includes(a));
      await m.generate({
        dir: getFlag(args, "--dir"),
        type: positional,
      });
      break;
    }
    case "deploy": {
      const m = await import("./commands/deploy.js");
      await m.deploy({ project: getFlag(args, "--project") });
      break;
    }
    case "scaffold": {
      const m = await import("./commands/scaffold.js");
      await m.scaffold({ name: getFlag(args, "--name"), type: args[1] });
      break;
    }
    case "lint": {
      const m = await import("./commands/lint.js");
      await m.lint({ dir: getFlag(args, "--dir") });
      break;
    }
    case "doctor": {
      const m = await import("./commands/doctor.js");
      await m.doctor({ dir: getFlag(args, "--dir") });
      break;
    }
    case "promote": {
      const m = await import("./commands/promote.js");
      const positional = args
        .slice(1)
        .find((a, i) => !a.startsWith("-") && args.slice(1)[i - 1] !== "--project");
      await m.promote({
        check: args.includes("--check"),
        project: getFlag(args, "--project"),
        user: positional,
      });
      break;
    }
    default:
      console.error(`Unknown command: ${cmd}`);
      printHelp();
  }
}
