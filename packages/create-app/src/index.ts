/* eslint-disable no-secrets/no-secrets -- generated templates use placeholder env var names, not real secrets */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline";

const AGENTS_PATH = new URL("../AGENTS.md", import.meta.url);

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
  createFile(dir, "AGENTS.md", readFileSync(AGENTS_PATH, "utf-8"));

  console.warn(`\n  Project "${projectName}" created!\n`);
  console.warn("  Next steps:");
  console.warn(`    cd ${projectName}`);
  console.warn("    npm install");
  console.warn("    cp .env.example .env");
  console.warn("    # Edit .env with your Firebase config");
  console.warn("    npx blaze dev\n");
}
