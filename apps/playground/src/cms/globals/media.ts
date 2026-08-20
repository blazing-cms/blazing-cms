import { defineGlobal, media } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [media("field", { label: "Media Field" })],
  label: "Media Field",
  slug: "media-settings",
});
