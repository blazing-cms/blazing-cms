import { defineCollection, text, array } from "@blazing-cms/schema";

export default defineCollection({
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    array("field", {
      fields: [text("item")],
      label: "Array Field",
    }),
  ],
  labels: {
    plural: "Array Fields",
    singular: "Array Field",
  },
  slug: "array",
});
