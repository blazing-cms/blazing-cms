import { defineCollection, text, dynamicZone } from "@blazing-cms/schema";

export default defineCollection({
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    dynamicZone("field", {
      components: ["seo", "media-card"],
      label: "Dynamic Zone Field",
    }),
  ],
  labels: { plural: "Dynamic Zone Fields", singular: "Dynamic Zone Field" },
  slug: "dynamic-zone",
});
