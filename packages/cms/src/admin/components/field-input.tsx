import type { FieldDefinition } from "@blazing-cms/types";
import type { ReactNode } from "react";

import { renderBasicInput } from "@/components/field-types/basic-inputs";
import { renderMediaInput } from "@/components/field-types/media-inputs";
import { renderStructureInput, type RenderChild } from "@/components/field-types/structure-inputs";
import { renderTextInput } from "@/components/field-types/text-inputs";
import { rolesOverlap, usePermissions } from "@/lib/rbac";
import { cn } from "@/lib/utils";

interface FieldInputProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

function FieldLabel({ field, fieldId }: { field: FieldDefinition; fieldId: string }) {
  if (field.type === "tabs") return null;
  if (field.type === "dynamicZone") return null;
  const label = field.label || field.name;
  return (
    <label htmlFor={fieldId} className="text-sm font-medium">
      {label}
      {field.validation?.required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

type Renderer = (
  field: FieldDefinition,
  value: unknown,
  onChange: (v: unknown) => void,
  id?: string,
) => ReactNode;

const renderChild: RenderChild = (field, value, onChange) => (
  <FieldInput field={field} value={value} onChange={onChange} />
);

const structuralRenderer: Renderer = (field, value, onChange, id) =>
  renderStructureInput(field, value, onChange, id, renderChild);

const fieldRenderers: Partial<Record<string, Renderer>> = {
  array: structuralRenderer,
  boolean: renderBasicInput,
  checkbox: structuralRenderer,
  code: renderTextInput,
  color: renderMediaInput,
  component: structuralRenderer,
  date: renderBasicInput,
  datetime: renderBasicInput,
  dynamicZone: structuralRenderer,
  email: renderBasicInput,
  group: structuralRenderer,
  json: renderBasicInput,
  markdown: renderTextInput,
  media: renderMediaInput,
  multiSelect: structuralRenderer,
  number: renderBasicInput,
  object: structuralRenderer,
  password: renderBasicInput,
  radio: structuralRenderer,
  relation: structuralRenderer,
  repeater: structuralRenderer,
  richText: renderTextInput,
  select: structuralRenderer,
  slug: structuralRenderer,
  tabs: structuralRenderer,
  text: renderBasicInput,
  textarea: renderBasicInput,
  upload: renderMediaInput,
  url: renderBasicInput,
};

function renderField(
  field: FieldDefinition,
  value: unknown,
  onChange: (v: unknown) => void,
  id?: string,
) {
  const renderer = fieldRenderers[field.type];
  if (renderer) return renderer(field, value, onChange, id);
  return <p className="text-sm text-muted-foreground">Unknown field type: {field.type}</p>;
}

export function FieldInput({ error, field, onChange, value }: FieldInputProps) {
  const { roleIds } = usePermissions();
  const fieldPerms = field.admin?.permissions;
  const canRead = rolesOverlap(roleIds, fieldPerms?.read);
  const canWrite = rolesOverlap(roleIds, fieldPerms?.write);

  if (!canRead) return null;

  const fieldId = `field-${field.name}`;
  const handleChange = canWrite ? onChange : () => undefined;
  return (
    <div className={cn("space-y-2", !canWrite && "opacity-60")}>
      <FieldLabel field={field} fieldId={fieldId} />
      {field.admin?.description && (
        <p className="text-xs text-muted-foreground">{field.admin.description}</p>
      )}
      {renderField(field, value, handleChange, fieldId)}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
