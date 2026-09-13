import { createRoute } from "@tanstack/react-router";
import { Construction, Copy, Check } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appLayoutRoute } from "@/routes/app-layout";

export const newSchemaRoute = createRoute({
  component: NewSchema,
  getParentRoute: () => appLayoutRoute,
  path: "/schemas/new",
});

type SchemaType = "collection" | "global" | "component";

function toLabel(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const collectionTemplate = (slug: string, label: string) =>
  `import { defineCollection, text, slug, richText, status } from "@blazing-cms/schema";\n\nexport default defineCollection({\n  slug: "${slug}",\n  label: "${label}",\n  admin: {\n    group: "Content",\n  },\n  fields: [\n    text("title", { validation: { required: true } }),\n    slug("slug", { sourceField: "title" }),\n    richText("content"),\n    status(),\n  ],\n});\n`;

const globalTemplate = (slug: string, label: string) =>
  `import { defineGlobal, text, richText } from "@blazing-cms/schema";\n\nexport default defineGlobal({\n  slug: "${slug}",\n  label: "${label}",\n  fields: [\n    text("title"),\n    richText("content"),\n  ],\n});\n`;

const componentTemplate = (slug: string, label: string) =>
  `import { defineComponent, text } from "@blazing-cms/schema";\n\nexport default defineComponent({\n  slug: "${slug}",\n  label: "${label}",\n  fields: [\n    text("title"),\n  ],\n});\n`;

const templates: Record<SchemaType, (slug: string, label: string) => string> = {
  collection: collectionTemplate,
  component: componentTemplate,
  global: globalTemplate,
};

function pluralize(type: SchemaType): string {
  if (type === "global") return "globals";
  if (type === "component") return "components";
  return "collections";
}

function ProductionGuard() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <Construction className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-2xl font-bold">Schema Builder</h2>
      <p className="max-w-md text-muted-foreground">
        The schema builder is only available in local development mode.
      </p>
    </div>
  );
}

function SchemaTypeSelector({
  onSelect,
  type,
}: {
  type: SchemaType;
  onSelect: (type: SchemaType) => void;
}) {
  return (
    <div>
      <Label htmlFor="type">Type</Label>
      <div className="mt-1 flex gap-2">
        {(["collection", "global", "component"] as SchemaType[]).map((t) => (
          <Button key={t} variant={type === t ? "default" : "outline"} onClick={() => onSelect(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  );
}

function CodePreview({
  code,
  copied,
  onCopy,
}: {
  code: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label>Generated Code</Label>
        <Button variant="outline" size="sm" onClick={onCopy}>
          {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-sm leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

function NewSchema() {
  const { addToast } = useToast();
  const [type, setType] = useState<SchemaType>("collection");
  const [slug, setSlug] = useState("");
  const [copied, setCopied] = useState(false);

  if (import.meta.env.PROD) {
    return <ProductionGuard />;
  }

  const label = slug ? toLabel(slug) : "My Schema";
  const code = slug ? templates[type](slug, label) : "";
  const filePath = `cms/${pluralize(type)}/${slug || "{slug}"}.ts`;

  async function handleCopy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      addToast({
        description: "Schema code copied. Paste it into your project.",
        title: "Copied!",
        variant: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({
        description: "Could not access clipboard",
        title: "Copy failed",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">New Schema</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a schema file to place in your{" "}
          <code className="rounded bg-secondary px-1 py-0.5">cms/</code> directory.
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <SchemaTypeSelector type={type} onSelect={setType} />

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            placeholder="e.g. my-schema"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">{filePath}</p>
        </div>
      </div>

      {code && <CodePreview code={code} onCopy={handleCopy} copied={copied} />}
    </div>
  );
}
