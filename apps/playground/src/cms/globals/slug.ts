import { defineGlobal, slug } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [slug("field", { label: "Slug Field" })],
  label: "Slug Field",
  slug: "slug",
});
