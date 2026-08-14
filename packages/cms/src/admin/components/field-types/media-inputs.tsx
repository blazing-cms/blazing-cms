import type { FieldDefinition } from "@blazing-cms/types";
import type { ReactNode } from "react";

import { MediaPicker } from "@/components/media-picker";
import { Input } from "@/components/ui/input";

interface InputProps {
  id?: string;
  onChange: (v: unknown) => void;
  value: unknown;
}

function textValue(value: unknown, fallback: string): string {
  return String(value ?? fallback);
}

function MediaFieldInput({ id, onChange, value }: InputProps) {
  const current = textValue(value, "");
  return (
    <div className="space-y-2">
      <Input
        id={id}
        type="text"
        value={current}
        onChange={(e) => onChange(e.target.value)}
        placeholder="File URL or path..."
      />
      <MediaPicker onChange={onChange} value={current} />
    </div>
  );
}

function ColorFieldInput({ format, id, onChange, value }: InputProps & { format: string }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={textValue(value, "#000000")}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-10 cursor-pointer rounded-md border"
      />
      <Input
        id={id}
        type="text"
        value={textValue(value, "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Color value (${format})...`}
      />
    </div>
  );
}

function colorFormat(field: FieldDefinition): string {
  return (field as { format?: string }).format ?? "hex";
}

export function renderMediaInput(
  field: FieldDefinition,
  value: unknown,
  onChange: (v: unknown) => void,
  id?: string,
): ReactNode {
  switch (field.type) {
    case "media":
    case "upload":
      return <MediaFieldInput id={id} onChange={onChange} value={value} />;
    case "color":
      return (
        <ColorFieldInput format={colorFormat(field)} id={id} onChange={onChange} value={value} />
      );
    default:
      return null;
  }
}
