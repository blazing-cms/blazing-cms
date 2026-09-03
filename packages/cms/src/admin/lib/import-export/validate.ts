import type { FieldDefinition, FieldValidation } from "@blazing-cms/types";

export interface EntryValidationError {
  path: string;
  message: string;
}

function runScalarValidation(
  value: unknown,
  validation: FieldValidation | undefined,
  path: string,
  errors: EntryValidationError[],
): void {
  if (!validation) return;

  const isSet = value !== undefined;

  if (validation.required && !isSet) {
    errors.push({ message: "This field is required", path });
  }

  if (typeof value === "number") {
    if (validation.min !== undefined && value < validation.min) {
      errors.push({ message: `Must be at least ${validation.min}`, path });
    }
    if (validation.max !== undefined && value > validation.max) {
      errors.push({ message: `Must be at most ${validation.max}`, path });
    }
  }

  if (typeof value === "string") {
    if (validation.minLength !== undefined && value.length < validation.minLength) {
      errors.push({ message: `Must be at least ${validation.minLength} characters`, path });
    }
    if (validation.maxLength !== undefined && value.length > validation.maxLength) {
      errors.push({ message: `Must be at most ${validation.maxLength} characters`, path });
    }
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      errors.push({ message: "Does not match the required pattern", path });
    }
  }

  if (Array.isArray(value)) {
    if (validation.min !== undefined && value.length < validation.min) {
      errors.push({ message: `Must contain at least ${validation.min} items`, path });
    }
    if (validation.max !== undefined && value.length > validation.max) {
      errors.push({ message: `Must contain at most ${validation.max} items`, path });
    }
  }
}

/** Validate an entry's field values against the current schema (structural-aware). */
export function validateEntry(
  data: Record<string, unknown>,
  fields: FieldDefinition[],
  components: Record<string, FieldDefinition[]>,
): EntryValidationError[] {
  const errors: EntryValidationError[] = [];

  const walkRecord = (value: unknown, fields: FieldDefinition[], path: string): void => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const record = value as Record<string, unknown>;
    for (const field of fields) {
      walk(record[field.name], field, `${path}.${field.name}`);
    }
  };

  const walk = (value: unknown, field: FieldDefinition, path: string): void => {
    runScalarValidation(value, field.validation, path, errors);

    switch (field.type) {
      case "array":
      case "repeater": {
        if (!Array.isArray(value)) break;
        const subFields = (field as { fields?: FieldDefinition[] }).fields ?? [];
        value.forEach((item, idx) => walkRecord(item, subFields, `${path}[${idx}]`));
        break;
      }
      case "object":
      case "group": {
        const subFields = (field as { fields?: FieldDefinition[] }).fields ?? [];
        walkRecord(value, subFields, path);
        break;
      }
      case "tabs": {
        const flat: FieldDefinition[] = [];
        for (const tab of (field as { tabs?: Array<{ fields: FieldDefinition[] }> }).tabs ?? []) {
          flat.push(...(tab.fields ?? []));
        }
        walkRecord(value, flat, path);
        break;
      }
      case "component": {
        const comp = components[(field as { component: string }).component];
        if (!comp) break;
        if (Array.isArray(value)) {
          value.forEach((item, idx) => walkRecord(item, comp, `${path}[${idx}]`));
        } else {
          walkRecord(value, comp, path);
        }
        break;
      }
      case "dynamicZone": {
        if (!Array.isArray(value)) break;
        value.forEach((item, idx) => {
          const record = item as Record<string, unknown>;
          const slug = typeof record?.__component === "string" ? record.__component : "";
          const comp = slug ? components[slug] : undefined;
          if (comp) walkRecord(record, comp, `${path}[${idx}]`);
        });
        break;
      }
      default:
        break;
    }
  };

  for (const field of fields) {
    walk(data[field.name], field, field.name);
  }
  return errors;
}
