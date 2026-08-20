import { defineCollection, text, relation } from "@blazing-cms/schema";

export default defineCollection({
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    relation("field", { label: "Relation Field", to: "users" }),
  ],
  labels: { plural: "Relation Fields", singular: "Relation Field" },
  slug: "relation",
});
