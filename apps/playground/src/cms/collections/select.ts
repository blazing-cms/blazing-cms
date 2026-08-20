import { defineCollection, text, select } from "@blazing-cms/schema";

export default defineCollection({
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    select("field", {
      label: "Select Field",
      options: [
        { label: "Option A", value: "option-a" },
        { label: "Option B", value: "option-b" },
        { label: "Option C", value: "option-c" },
      ],
    }),
  ],
  labels: { plural: "Select Fields", singular: "Select Field" },
  slug: "select",
});
