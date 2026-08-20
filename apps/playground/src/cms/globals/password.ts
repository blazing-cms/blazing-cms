import { defineGlobal, password } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [password("field", { label: "Password Field" })],
  label: "Password Field",
  slug: "password",
});
