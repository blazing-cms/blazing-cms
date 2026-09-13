import {
  defineCollection,
  text,
  textarea,
  slug,
  relation,
  boolean,
  datetime,
  component,
} from "@blazing-cms/schema";

export default defineCollection({
  admin: { defaultSort: "-createdAt", useAsTitle: "name" },
  fields: [
    text("name", { label: "Name", validation: { required: true } }),
    slug("slug", { source: "name", unique: true }),
    textarea("bio", { label: "Bio" }),
    relation("department", {
      kind: "manyToOne",
      label: "Department",
      to: "departments",
    }),
    boolean("published", { defaultValue: false, label: "Published" }),
    boolean("featured", { defaultValue: false, label: "Featured" }),
    datetime("publishedAt", { label: "Published At" }),
    component("seo", { component: "seo-meta" }),
  ],
  labels: { plural: "Teachers", singular: "Teacher" },
  slug: "teachers",
  timestamps: { createdAt: true, updatedAt: true },
  workflow: { reviewerRoles: ["role-editor"] },
});
