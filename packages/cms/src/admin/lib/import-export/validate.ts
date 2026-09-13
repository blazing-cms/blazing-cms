import type { FieldDefinition, FieldValidation } from "@blazing-cms/types";

export interface EntryValidationError {
  path: string;
  message: string;
}

function validateNumber(
  value: number,
  validation: FieldValidation,
  path: string,
  errors: EntryValidationError[],
): void {
  if (validation.min !== undefined && value < validation.min) {
    errors.push({ message: `Must be at least ${validation.min}`, path });
  }
  if (validation.max !== undefined && value > validation.max) {
    errors.push({ message: `Must be at most ${validation.max}`, path });
  }
}

function validateString(
  value: string,
  validation: FieldValidation,
  path: string,
  errors: EntryValidationError[],
): void {
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

function validateArray(
  value: unknown[],
  validation: FieldValidation,
  path: string,
  errors: EntryValidationError[],
): void {
  if (validation.min !== undefined && value.length < validation.min) {
    errors.push({ message: `Must contain at least ${validation.min} items`, path });
  }
  if (validation.max !== undefined && value.length > validation.max) {
    errors.push({ message: `Must contain at most ${validation.max} items`, path });
  }
}

function runScalarValidation(
  value: unknown,
  validation: FieldValidation | undefined,
  path: string,
  errors: EntryValidationError[],
): void {
  if (!validation) return;

  if (validation.required && value === undefined) {
    errors.push({ message: "This field is required", path });
    return;
  }

  if (typeof value === "number") validateNumber(value, validation, path, errors);
  else if (typeof value === "string") validateString(value, validation, path, errors);
  else if (Array.isArray(value)) validateArray(value, validation, path, errors);
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

  const getSubFields = (field: FieldDefinition): FieldDefinition[] =>
    (field as { fields?: FieldDefinition[] }).fields ?? [];

  const walkArray = (value: unknown, field: FieldDefinition, path: string): void => {
    if (!Array.isArray(value)) return;
    const subFields = getSubFields(field);
    value.forEach((item, idx) => walkRecord(item, subFields, `${path}[${idx}]`));
  };

  const walkTabs = (value: unknown, field: FieldDefinition, path: string): void => {
    const tabs = (field as { tabs?: Array<{ fields: FieldDefinition[] }> }).tabs ?? [];
    const flat = tabs.flatMap((tab) => tab.fields ?? []);
    walkRecord(value, flat, path);
  };

  const walkComponent = (value: unknown, field: FieldDefinition, path: string): void => {
    const comp = components[(field as { component: string }).component];
    if (!comp) return;
    if (Array.isArray(value)) {
      value.forEach((item, idx) => walkRecord(item, comp, `${path}[${idx}]`));
    } else {
      walkRecord(value, comp, path);
    }
  };

  const walkDynamicZone = (value: unknown, path: string): void => {
    if (!Array.isArray(value)) return;
    value.forEach((item, idx) => {
      const record = item as Record<string, unknown>;
      const slug = typeof record?.__component === "string" ? record.__component : "";
      const comp = slug ? components[slug] : undefined;
      if (comp) walkRecord(record, comp, `${path}[${idx}]`);
    });
  };

  const walk = (value: unknown, field: FieldDefinition, path: string): void => {
    runScalarValidation(value, field.validation, path, errors);

    switch (field.type) {
      case "array":
      case "repeater":
        walkArray(value, field, path);
        break;
      case "object":
      case "group":
        walkRecord(value, getSubFields(field), path);
        break;
      case "tabs":
        walkTabs(value, field, path);
        break;
      case "component":
        walkComponent(value, field, path);
        break;
      case "dynamicZone":
        walkDynamicZone(value, path);
        break;
    }
  };

  for (const field of fields) {
    walk(data[field.name], field, field.name);
  }
  return errors;
}
