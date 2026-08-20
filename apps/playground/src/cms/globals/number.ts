import { defineGlobal, number } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [number("field", { label: "Number Field" })],
  label: "Number Field",
  slug: "number",
});
