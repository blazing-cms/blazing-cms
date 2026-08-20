import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { prompt } from "./utils/prompt.js";

export interface ScaffoldOptions {
  type?: string;
  name?: string;
}

const collectionTemplate = (slug: string, label: string) => `
import { defineCollection, text, slug, richText } from "@blazing-cms/schema";

export default defineCollection({
  slug: "${slug}",
  label: "${label}",
  admin: {
    group: "Content",
  },
  fields: [
    text("title", { required: true }),
    slug("slug", { sourceField: "title" }),
    richText("content"),
  ],
});
`;

const globalTemplate = (slug: string, label: string) => `
import { defineGlobal, text, richText } from "@blazing-cms/schema";

export default defineGlobal({
  slug: "${slug}",
  label: "${label}",
  fields: [
    text("title"),
    richText("content"),
  ],
});
`;

const componentTemplate = (slug: string, label: string) => `
import { defineComponent, text } from "@blazing-cms/schema";

export default defineComponent({
  slug: "${slug}",
  label: "${label}",
  fields: [
    text("title"),
  ],
});
`;

function toLabel(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function pluralize(type: string): string {
  if (type === "global") return "globals";
  if (type === "component") return "components";
  return "collections";
}

async function resolveInput(
  type: string | undefined,
  name: string | undefined,
): Promise<{ type: string; slug: string; label: string }> {
  const resolvedType = type || (await prompt("Type? (collection/global/component): "));
  const slug = name || (await prompt("Slug (e.g. my-collection): "));
  return { label: toLabel(slug), slug, type: resolvedType };
}

const TEMPLATES: Record<string, (slug: string, label: string) => string> = {
  collection: collectionTemplate,
  component: componentTemplate,
  global: globalTemplate,
};

export async function scaffold(options: ScaffoldOptions): Promise<void> {
  const { label, slug, type } = await resolveInput(options.type, options.name);

  const cmsDir = resolve(process.cwd(), "src/cms");
  const dir = resolve(cmsDir, pluralize(type));

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const filePath = resolve(dir, `${slug}.ts`);
  if (existsSync(filePath)) {
    console.error(`  ✗ ${type} "${slug}" already exists at ${filePath}`);
    process.exit(1);
  }

  const template = TEMPLATES[type];
  if (!template) {
    console.error(`  ✗ Unknown type "${type}". Use: collection, global, or component`);
    process.exit(1);
  }

  writeFileSync(filePath, template(slug, label).trimStart());
  console.warn(`  ✓ Created ${type} "${slug}" at ${filePath}\n`);
}
