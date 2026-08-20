import { defineGlobal, color } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [color("field", { format: "hex", label: "Color Field" })],
  label: "Color Field",
  slug: "color",
});
