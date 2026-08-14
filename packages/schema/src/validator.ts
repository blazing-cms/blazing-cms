import type {
  CollectionDefinition,
  GlobalDefinition,
  ComponentDefinition,
  FieldDefinition,
  CapabilitiesConfig,
} from "@blazing-cms/types";

import {
  CAPABILITY_NAMES,
  COLLECTION_SCOPED_CAPABILITIES,
  GLOBAL_SCOPED_CAPABILITIES,
} from "./capabilities.js";

export interface ValidationError {
  path: string;
  message: string;
}

export class SchemaValidator {
  validateCollection(collection: CollectionDefinition): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!collection.slug) {
      errors.push({ message: "Collection slug is required", path: "slug" });
    }
    if (!collection.labels.singular) {
      errors.push({ message: "Singular label is required", path: "labels.singular" });
    }
    if (!collection.labels.plural) {
      errors.push({ message: "Plural label is required", path: "labels.plural" });
    }
    if (collection.fields.length === 0) {
      errors.push({ message: "At least one field is required", path: "fields" });
    }
    for (const field of collection.fields) {
      errors.push(...this.validateField(field, `fields.${field.name}`));
    }
    errors.push(...this.validateCollectionFeatures(collection.config, "config"));
    return errors;
  }

  validateGlobal(global: GlobalDefinition): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!global.slug) {
      errors.push({ message: "Global slug is required", path: "slug" });
    }
    if (!global.label) {
      errors.push({ message: "Label is required", path: "label" });
    }
    for (const field of global.fields) {
      errors.push(...this.validateField(field, `fields.${field.name}`));
    }
    errors.push(...this.validateGlobalFeatures(global.config, "config"));
    return errors;
  }

  validateComponent(component: ComponentDefinition): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!component.slug) {
      errors.push({ message: "Component slug is required", path: "slug" });
    }
    if (!component.label) {
      errors.push({ message: "Label is required", path: "label" });
    }
    for (const field of component.fields) {
      errors.push(...this.validateField(field, `fields.${field.name}`));
    }
    return errors;
  }

  private validateField(field: FieldDefinition, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!field.name) {
      errors.push({ message: "Field name is required", path });
    }
    if (field.type === "select" || field.type === "multiSelect" || field.type === "radio") {
      if (field.options.length === 0) {
        errors.push({
          message: "Options are required for select/multiSelect/radio fields",
          path: `${path}.options`,
        });
      }
    }
    if (field.type === "relation" && !field.to) {
      errors.push({
        message: "Target collection is required for relation fields",
        path: `${path}.to`,
      });
    }
    if (field.type === "component" && !field.component) {
      errors.push({
        message: "Component slug is required for component fields",
        path: `${path}.component`,
      });
    }
    return errors;
  }

  /**
   * Validates project-level capability config: rejects unknown capability
   * names, non-object settings, non-boolean `enabled` flags, and non-numeric
   * capability settings.
   */
  validateCapabilities(capabilities?: CapabilitiesConfig | undefined): ValidationError[] {
    const errors: ValidationError[] = [];
    if (!capabilities) {
      return errors;
    }
    for (const [name, settings] of Object.entries(capabilities)) {
      const path = `capabilities.${name}`;
      if (!CAPABILITY_NAMES.includes(name as (typeof CAPABILITY_NAMES)[number])) {
        errors.push({ message: `Unknown capability "${name}"`, path });
        continue;
      }
      if (settings === null || typeof settings !== "object") {
        errors.push({ message: `Capability "${name}" config must be an object`, path });
        continue;
      }
      const entry = settings as Record<string, unknown>;
      if (entry.enabled !== undefined && typeof entry.enabled !== "boolean") {
        errors.push({
          message: `Feature flag for "${name}" must be a boolean, got ${typeof entry.enabled}`,
          path: `${path}.enabled`,
        });
      }
      for (const numericKey of ["staleTimeMs", "maxFileSize", "maxPerDoc"] as const) {
        if (entry[numericKey] !== undefined && typeof entry[numericKey] !== "number") {
          errors.push({
            message: `"${numericKey}" must be a number, got ${typeof entry[numericKey]}`,
            path: `${path}.${numericKey}`,
          });
        }
      }
    }
    return errors;
  }

  private validateCollectionFeatures(
    config: CollectionDefinition["config"],
    path: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const features = config?.features;
    if (!features) {
      return errors;
    }
    for (const [name, value] of Object.entries(features)) {
      const featurePath = `${path}.features.${name}`;
      if (
        !COLLECTION_SCOPED_CAPABILITIES.includes(
          name as (typeof COLLECTION_SCOPED_CAPABILITIES)[number],
        )
      ) {
        errors.push({
          message: `Unknown collection-scoped capability "${name}". Only ${COLLECTION_SCOPED_CAPABILITIES.join(", ")} are supported per collection`,
          path: featurePath,
        });
        continue;
      }
      if (typeof value !== "boolean") {
        errors.push({
          message: `Feature flag for "${name}" must be a boolean, got ${typeof value}`,
          path: featurePath,
        });
      }
    }
    return errors;
  }

  private validateGlobalFeatures(
    config: GlobalDefinition["config"],
    path: string,
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const features = config?.features;
    if (!features) {
      return errors;
    }
    for (const [name, value] of Object.entries(features)) {
      const featurePath = `${path}.features.${name}`;
      if (
        !GLOBAL_SCOPED_CAPABILITIES.includes(name as (typeof GLOBAL_SCOPED_CAPABILITIES)[number])
      ) {
        errors.push({
          message: `Unknown global-scoped capability "${name}". Only ${GLOBAL_SCOPED_CAPABILITIES.join(", ")} are supported per global`,
          path: featurePath,
        });
        continue;
      }
      if (typeof value !== "boolean") {
        errors.push({
          message: `Feature flag for "${name}" must be a boolean, got ${typeof value}`,
          path: featurePath,
        });
      }
    }
    return errors;
  }
}
