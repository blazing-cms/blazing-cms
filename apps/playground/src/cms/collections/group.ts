import { defineCollection, text, group } from "@blazing-cms/schema";

export default defineCollection({
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    group("field", {
      fields: [text("nested", { label: "Nested" })],
      label: "Group Field",
    }),
  ],
  labels: { plural: "Group Fields", singular: "Group Field" },
  slug: "group",
});
