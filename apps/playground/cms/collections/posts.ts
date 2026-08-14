import {
  defineCollection,
  text,
  textarea,
  boolean,
  datetime,
  select,
  relation,
  slug,
} from "@blazing-cms/schema";

export default defineCollection({
  admin: { defaultSort: "-createdAt", useAsTitle: "title" },
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    slug("slug", { source: "title", unique: true }),
    textarea("excerpt", { label: "Excerpt" }),
    text("content", { label: "Content" }),
    boolean("published", { defaultValue: false, label: "Published" }),
    datetime("publishedAt", { label: "Published At" }),
    select("category", {
      label: "Category",
      options: [
        { label: "News", value: "news" },
        { label: "Tutorial", value: "tutorial" },
        { label: "Blog", value: "blog" },
      ],
    }),
    relation("author", { kind: "manyToOne", label: "Author", to: "users" }),
  ],
  labels: { plural: "Posts", singular: "Post" },
  slug: "posts",
  timestamps: { createdAt: true, updatedAt: true },
  workflow: {
    reviewerRoles: ["role-editor"],
  },
});
