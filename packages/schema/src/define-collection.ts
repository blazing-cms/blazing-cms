import type {
  CollectionCapabilitiesConfig,
  CollectionDefinition,
  FieldDefinition,
  WorkflowConfig,
} from "@blazing-cms/types";

/**
 * Defines a collection content type. Used by schema files in a project's
 * `cms/collections/` directory; the resulting definition is validated at load
 * time. `config.features` holds per-collection capability overrides (only
 * `workflow` and `versioning` are collection-scoped).
 */
export function defineCollection(config: {
  slug: string;
  labels: { singular: string; plural: string };
  fields: FieldDefinition[];
  timestamps?: { createdAt?: boolean; updatedAt?: boolean } | false;
  auth?: boolean;
  admin?: {
    group?: string;
    defaultSort?: string;
    defaultPageSize?: number;
    hide?: boolean;
    description?: string;
    useAsTitle?: string;
  };
  versions?: {
    drafts: boolean;
    maxPerDoc?: number;
    softDelete?: boolean;
    scheduledPublishing?: boolean;
  };
  localization?: {
    locales: string[];
    defaultLocale: string;
  };
  workflow?: WorkflowConfig;
  config?: CollectionCapabilitiesConfig;
}): CollectionDefinition {
  return {
    admin: config.admin,
    auth: config.auth,
    config: config.config,
    fields: config.fields,
    labels: config.labels,
    localization: config.localization,
    slug: config.slug,
    timestamps: config.timestamps,
    versions: config.versions,
    workflow: config.workflow,
  };
}
