import { defineComponent, text, textarea } from "@blazing-cms/schema";

export default defineComponent({
  fields: [
    text("metaTitle", { label: "Meta Title", validation: { maxLength: 60 } }),
    textarea("metaDescription", {
      label: "Meta Description",
      validation: { maxLength: 160 },
    }),
  ],
  label: "SEO Meta",
  slug: "seo-meta",
});
