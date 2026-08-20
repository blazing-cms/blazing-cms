import { defineGlobal, textarea } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [textarea("field", { label: "Textarea Field" })],
  label: "Textarea Field",
  slug: "textarea",
});
