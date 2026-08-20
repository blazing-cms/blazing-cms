import { defineGlobal, radio } from "@blazing-cms/schema";

export default defineGlobal({
  fields: [
    radio("field", {
      label: "Radio Field",
      options: [
        { label: "Option A", value: "option-a" },
        { label: "Option B", value: "option-b" },
        { label: "Option C", value: "option-c" },
      ],
    }),
  ],
  label: "Radio Field",
  slug: "radio",
});
