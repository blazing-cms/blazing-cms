import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

import { schemaWriterPlugin } from "./vite-plugins/schema-writer";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  build: {
    emptyOutDir: true,
    outDir: path.resolve(dirname, "../../dist/admin"),
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/.pnpm/") || id.includes("node_modules/")) {
            if (
              id.includes("@tiptap") ||
              id.includes("prosemirror") ||
              id.includes("lowlight") ||
              id.includes("highlight")
            )
              return "editor-rich";
            if (id.includes("codemirror") || id.includes("@codemirror")) return "editor-code";
            if (
              id.includes("react-markdown") ||
              id.includes("remark-") ||
              id.includes("rehype-") ||
              id.includes("unified") ||
              id.includes("mdast") ||
              id.includes("hast") ||
              id.includes("micromark") ||
              id.includes("decode-named-character-reference") ||
              id.includes("character-entities") ||
              id.includes("trim-lines") ||
              id.includes("comma-separated-tokens") ||
              id.includes("property-information") ||
              id.includes("space-separated-tokens") ||
              id.includes("hast-util-") ||
              id.includes("html-void-") ||
              id.includes("zwitch") ||
              id.includes("ccount") ||
              id.includes("number-")
            )
              return "editor-markdown";
            if (id.includes("firebase/") || id.includes("@firebase")) return "firebase";
            if (id.includes("react/") || id.includes("react-dom") || id.includes("scheduler"))
              return "react-vendor";
            if (
              id.includes("@tanstack/react-router") ||
              id.includes("@tanstack/react-query") ||
              id.includes("@tanstack/query")
            )
              return "router";
            if (id.includes("lucide-react")) return "icons";
            return "vendor";
          }
        },
      },
    },
  },
  optimizeDeps: {
    // In generated projects the admin source is served from inside
    // node_modules (@blazing-cms/cms/src/admin). Vite's dep scanner then sees
    // every "@/" import that resolves to a .ts file as an npm dependency and
    // pre-bundles it into a separate chunk, duplicating module instances
    // (e.g. the DataProvider context) and breaking context hooks at runtime.
    // Excluding the alias prefix keeps all app source as regular modules.
    exclude: ["@/"],
    include: [
      "@tiptap/core",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/extension-link",
      "@tiptap/extension-placeholder",
      "@tiptap/extension-underline",
      "@tiptap/extension-code-block-lowlight",
      "lowlight",
      "codemirror",
      "@codemirror/view",
      "@codemirror/state",
      "@codemirror/language",
      "@codemirror/commands",
      "@codemirror/lang-javascript",
      "@codemirror/lang-json",
      "@codemirror/lang-css",
      "@codemirror/lang-html",
      "@codemirror/lang-markdown",
      "@codemirror/lang-xml",
      "react-markdown",
      "remark-gfm",
    ],
  },
  plugins: [react(), tailwindcss(), schemaWriterPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(dirname),
    },
  },
  root: path.resolve(dirname),
});
