import { defineGlobal, url } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [url("field", { label: "URL Field" })],
  label: "URL Field",
  slug: "url",
});
