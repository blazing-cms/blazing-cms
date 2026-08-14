import { defineCollection, text, date } from "@blazing-cms/schema";

export default defineCollection({
  config: { features: { versioning: false } },
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    date("field", { label: "Date Field" }),
  ],
  labels: { plural: "Date Fields", singular: "Date Field" },
  slug: "date",
});
