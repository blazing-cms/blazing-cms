import { defineGlobal, text } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [text("field", { label: "Text Field" })],
  label: "Text Field",
  slug: "text",
});
