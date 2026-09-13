import { defineCollection, text, slug, dynamicZone, component } from "@blazing-cms/schema";

export default defineCollection({
  admin: { defaultSort: "-createdAt", useAsTitle: "title" },
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    slug("slug", { source: "title", unique: true }),
    dynamicZone("blocks", {
      components: ["content-hero", "content-faq", "content-cta"],
      label: "Content Blocks",
    }),
    component("seo", { component: "seo-meta" }),
  ],
  labels: { plural: "Pages", singular: "Page" },
  slug: "pages",
  timestamps: { createdAt: true, updatedAt: true },
});
