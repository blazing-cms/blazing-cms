import { defineCollection, text, repeater } from "@blazing-cms/schema";

export default defineCollection({
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    repeater("field", {
      fields: [text("item", { label: "Item" })],
      label: "Repeater Field",
    }),
  ],
  labels: { plural: "Repeater Fields", singular: "Repeater Field" },
  slug: "repeater",
});
