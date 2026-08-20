import { defineCollection, text, richText } from "@blazing-cms/schema";

export default defineCollection({
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    richText("field", { label: "Rich Text Field" }),
  ],
  labels: { plural: "Rich Text Fields", singular: "Rich Text Field" },
  slug: "rich-text",
});
