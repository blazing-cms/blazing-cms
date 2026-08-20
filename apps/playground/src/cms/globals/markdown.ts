import { defineGlobal, markdown } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [markdown("field", { label: "Markdown Field" })],
  label: "Markdown Field",
  slug: "markdown",
});
