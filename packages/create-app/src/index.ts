/* eslint-disable no-secrets/no-secrets -- generated templates use placeholder env var names, not real secrets */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline";

const AGENTS_PATH = new URL("../AGENTS.md", import.meta.url);

const AGENTS_FALLBACK = `# AGENTS.md — Blazing CMS Project

Agent-oriented documentation for this generated Blazing CMS project. Read this
before editing anything in the repo.

## What this project is

A schema-defined CMS project for Firebase. The content model is defined in
TypeScript files; the \`blaze\` CLI generates the admin panel, a typed SDK,
validation, Firestore security rules, and indexes from them. The backend is
Firebase (Firestore, Auth, Storage) accessed entirely from the client — there is
no server code in this project.

## Project layout

\`\`\`
.
  blazing-cms.config.ts     # Project name + Firebase config + capabilities
  cms/
    collections/            # Content-type schemas (one .ts file per collection)
    globals/                # Singleton content schemas (site settings, etc.)
    components/             # Reusable field-group schemas
  src/                      # App code (unused unless you add custom UI)
  .env                      # Local Firebase credentials (gitignored)
  .env.example              # Documented env template
\`\`\`

## Schema files are the source of truth

- Collections define content types with multiple entries; globals define
  singletons; components are reusable field groups.
- Field types and validation come from \`@blazing-cms/schema\` builders:
  \`text\`, \`textarea\`, \`richText\`, \`markdown\`, \`code\`, \`number\`, \`boolean\`,
  \`date\`, \`datetime\`, \`email\`, \`url\`, \`select\`, \`relation\`, \`media\`, \`upload\`,
  \`component\`, \`dynamicZone\`, \`array\`, \`object\`, \`slug\`, and more.
- Use \`validation: { required: true }\` for required fields (not a top-level
  \`required\` key) and \`slug("slug", { source: "title" })\` for slug fields.
- The CLI regenerates types, the SDK, validation, Firestore rules, and indexes
  from these files — edit the schema files, never the generated output.

## Commands

\`\`\`bash
pnpm dev           # Start the dev server + admin panel
pnpm build         # Build the admin panel for production
pnpm generate      # Regenerate types, SDK, validation, rules, indexes
pnpm scaffold      # Scaffold a new collection/global/component
pnpm deploy        # Deploy the admin panel to Firebase Hosting
\`\`\`

\`blaze dev\` and \`blaze generate\` also sync schema definitions to Firestore under
\`_schemas/\` so the admin panel can introspect them at runtime.

## Configuration

Firebase credentials are set via environment variables (\`.env\`):

- \`VITE_FIREBASE_PROJECT_ID\`, \`VITE_FIREBASE_API_KEY\`,
  \`VITE_FIREBASE_AUTH_DOMAIN\`, \`VITE_FIREBASE_STORAGE_BUCKET\`,
  \`VITE_FIREBASE_APP_ID\`
- \`VITE_BACKEND_MODE\` — \`firebase\` (live backend) or \`mock\` (in-memory, for
  local development without a Firebase project)

The project id and credentials are also mirrored in \`blazing-cms.config.ts\`.

## Next steps

- Copy \`.env.example\` to \`.env\` and fill in your Firebase config, then run
  \`pnpm dev\` and open the admin panel at \`http://localhost:5173/\`.
- Add collections under \`cms/collections/\` and globals under \`cms/globals/\`.
- Full schema, admin, and capability docs live in the Blazing CMS docs site.
`;

function createFile(dir: string, name: string, content: string) {
  writeFileSync(resolve(dir, name), content.trimStart());
  console.warn(`  ✓ Created ${name}`);
}

function makePrompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function scaffold(projectName: string): Promise<void> {
  const dir = resolve(process.cwd(), projectName);

  if (existsSync(dir)) {
    console.error(`\n  ✗ Directory "${projectName}" already exists.\n`);
    process.exit(1);
  }

  const displayName = (await makePrompt(`Project display name (${projectName}): `)) || projectName;

  console.warn(`\n  Creating Blazing CMS project: ${displayName}\n`);

  // Create directory structure
  mkdirSync(resolve(dir, "cms/collections"), { recursive: true });
  mkdirSync(resolve(dir, "cms/globals"), { recursive: true });
  mkdirSync(resolve(dir, "src"), { recursive: true });

  // package.json
  createFile(
    dir,
    "package.json",
    `
{
  "name": "${projectName}",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "blaze dev",
    "build": "blaze build",
    "deploy": "blaze deploy",
    "generate": "blaze generate",
    "scaffold": "blaze scaffold"
  },
  "dependencies": {
    "@blazing-cms/cms": "latest",
    "firebase": "^12"
  },
  "devDependencies": {
    "typescript": "^5"
  }
}
`,
  );

  // tsconfig.json
  createFile(
    dir,
    "tsconfig.json",
    `
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true
  },
  "include": ["cms"]
}
`,
  );

  // blazing-cms.config.ts
  createFile(
    dir,
    "blazing-cms.config.ts",
    `
import { defineConfig } from "@blazing-cms/cms";

export default defineConfig({
  projectName: ${JSON.stringify(displayName)},
  firebase: {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID ?? "your-project-id",
    apiKey: process.env.VITE_FIREBASE_API_KEY ?? "",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
    appId: process.env.VITE_FIREBASE_APP_ID ?? "",
  },
});
`,
  );

  // .env
  createFile(
    dir,
    ".env",
    `
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_APP_ID=your-app-id
VITE_BACKEND_MODE=firebase
`,
  );

  // .env.example
  createFile(
    dir,
    ".env.example",
    `
# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_APP_ID=

# Backend mode: "firebase" (default) or "mock"
VITE_BACKEND_MODE=firebase
`,
  );

  // .gitignore
  createFile(
    dir,
    ".gitignore",
    `
node_modules/
dist/
.env
firebase-debug.log
`,
  );

  // Example collection
  createFile(
    dir,
    "cms/collections/posts.ts",
    `
import { defineCollection, text, slug, richText, status } from "@blazing-cms/schema";

export default defineCollection({
  slug: "posts",
  labels: { singular: "Post", plural: "Posts" },
  admin: {
    group: "Content",
    useAsTitle: "title",
  },
  fields: [
    text("title", { required: true }),
    slug("slug", { sourceField: "title" }),
    richText("content"),
    status(),
  ],
});
`,
  );

  // Example global
  createFile(
    dir,
    "cms/globals/site-settings.ts",
    `
import { defineGlobal, text, image } from "@blazing-cms/schema";

export default defineGlobal({
  slug: "site-settings",
  label: "Site Settings",
  fields: [
    text("siteName"),
    image("logo"),
  ],
});
`,
  );

  // AGENTS.md — agent documentation for the generated project
  try {
    createFile(dir, "AGENTS.md", readFileSync(AGENTS_PATH, "utf-8"));
  } catch {
    createFile(dir, "AGENTS.md", AGENTS_FALLBACK);
  }

  console.warn(`\n  Project "${projectName}" created!\n`);
  console.warn("  Next steps:");
  console.warn(`    cd ${projectName}`);
  console.warn("    npm install");
  console.warn("    cp .env.example .env");
  console.warn("    # Edit .env with your Firebase config");
  console.warn("    npx blaze dev\n");
}
