import { defineCollection, text, number } from "@blazing-cms/schema";

export default defineCollection({
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    number("field", { label: "Number Field" }),
  ],
  labels: { plural: "Number Fields", singular: "Number Field" },
  slug: "number",
});
