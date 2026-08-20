import { defineGlobal, boolean } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [boolean("field", { label: "Boolean Field" })],
  label: "Boolean Field",
  slug: "boolean",
});
