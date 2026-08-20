import { defineGlobal, text, textarea, media, color, boolean } from "@blazing-cms/schema";

export default defineGlobal({
  admin: { group: "Settings" },
  fields: [
    text("siteName", { label: "Site Name", validation: { required: true } }),
    text("tagline", { label: "Tagline" }),
    textarea("description", { label: "Description" }),
    media("logo", { label: "Logo" }),
    color("primaryColor", { format: "hex", label: "Primary Color" }),
    color("secondaryColor", { format: "hex", label: "Secondary Color" }),
    boolean("enableComments", { defaultValue: true, label: "Enable Comments" }),
  ],
  label: "Site Settings",
  slug: "site-settings",
});
