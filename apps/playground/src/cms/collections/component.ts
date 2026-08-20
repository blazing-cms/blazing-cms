import { defineCollection, text, component } from "@blazing-cms/schema";

export default defineCollection({
  fields: [
    text("title", { label: "Title", validation: { required: true } }),
    component("field", { component: "seo", label: "Component Field" }),
  ],
  labels: { plural: "Component Fields", singular: "Component Field" },
  slug: "component",
});
