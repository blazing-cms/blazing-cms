import { defineGlobal, datetime } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [datetime("field", { label: "DateTime Field" })],
  label: "DateTime Field",
  slug: "datetime",
});
