import { defineGlobal, select } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [
    select("field", {
      label: "Select Field",
      options: [
        { label: "Option A", value: "option-a" },
        { label: "Option B", value: "option-b" },
        { label: "Option C", value: "option-c" },
      ],
    }),
  ],
  label: "Select Field",
  slug: "select",
});
