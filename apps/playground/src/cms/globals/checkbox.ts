import { defineGlobal, checkbox } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [checkbox("field", { label: "Checkbox Field" })],
  label: "Checkbox Field",
  slug: "checkbox",
});
