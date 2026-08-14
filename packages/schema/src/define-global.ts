import type {
  GlobalCapabilitiesConfig,
  GlobalDefinition,
  FieldDefinition,
} from "@blazing-cms/types";

/**
 * Defines a global singleton content record. Used by schema files in a
 * project's `cms/globals/` directory. `config.features` holds per-global
 * capability overrides (only `versioning` is global-scoped).
 */
export function defineGlobal(config: {
  slug: string;
  label: string;
  fields: FieldDefinition[];
  admin?: {
    group?: string;
    description?: string;
    hide?: boolean;
  };
  versions?: {
    maxPerDoc?: number;
  };
  config?: GlobalCapabilitiesConfig;
}): GlobalDefinition {
  return {
    admin: config.admin,
    config: config.config,
    fields: config.fields,
    label: config.label,
    slug: config.slug,
    versions: config.versions,
  };
}
