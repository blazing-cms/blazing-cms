import { defineGlobal, multiSelect } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [
    multiSelect("field", {
      label: "Multi-Select Field",
      options: [
        { label: "Option A", value: "option-a" },
        { label: "Option B", value: "option-b" },
        { label: "Option C", value: "option-c" },
      ],
    }),
  ],
  label: "Multi-Select Field",
  slug: "multi-select",
});
