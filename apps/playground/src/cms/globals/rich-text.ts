import { defineGlobal, richText } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [richText("field", { label: "Rich Text Field" })],
  label: "Rich Text Field",
  slug: "rich-text",
});
