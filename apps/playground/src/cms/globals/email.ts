import { defineGlobal, email } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [email("field", { label: "Email Field" })],
  label: "Email Field",
  slug: "email",
});
