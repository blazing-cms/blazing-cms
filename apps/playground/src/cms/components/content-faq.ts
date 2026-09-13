import { defineComponent, text, textarea, array } from "@blazing-cms/schema";

export default defineComponent({
  fields: [
    text("heading", { label: "Heading", validation: { required: true } }),
    array("items", {
      fields: [
        text("question", { label: "Question", validation: { required: true } }),
        textarea("answer", { label: "Answer", validation: { required: true } }),
      ],
      label: "FAQ Items",
    }),
  ],
  label: "FAQ Block",
  slug: "content-faq",
});
