import { defineCollection, text, media } from "@blazing-cms/schema";

export default defineCollection({
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    media("field", { label: "Media Field" }),
  ],
  labels: { plural: "Media Fields", singular: "Media Field" },
  slug: "media-test",
});
