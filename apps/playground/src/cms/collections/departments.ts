import { defineCollection, text, textarea, slug } from "@blazing-cms/schema";

export default defineCollection({
  admin: { defaultSort: "name", useAsTitle: "name" },
  fields: [
    text("name", { label: "Name", validation: { required: true } }),
    slug("slug", { source: "name", unique: true }),
    textarea("description", { label: "Description" }),
  ],
  labels: { plural: "Departments", singular: "Department" },
  slug: "departments",
  timestamps: { createdAt: true, updatedAt: true },
});
