import type { CollectionCapabilitiesConfig, GlobalCapabilitiesConfig } from "./capabilities.js";
import type { FieldDefinition } from "./fields.js";

export interface Labels {
  singular: string;
  plural: string;
}

export interface CollectionTimestamps {
  createdAt: boolean;
  updatedAt: boolean;
}

export interface WorkflowStateConfig {
  name: string;
  label?: string;
}

export interface WorkflowTransitionConfig {
  from: string;
  to: string;
  /** Role ids allowed to perform this transition. Empty = any user with the update grant. */
  roles?: string[];
  /** Whether a comment is required when performing this transition. */
  commentRequired?: boolean;
}

export interface WorkflowConfig {
  /** Ordered states. Defaults to draft → review → published → rejected when omitted. */
  states?: WorkflowStateConfig[];
  /** Allowed transitions. Defaults to the standard publish flow when omitted. */
  transitions?: WorkflowTransitionConfig[];
  /** Roles eligible to be assigned as reviewers. Empty = any user. */
  reviewerRoles?: string[];
  /** State new entries start in. Defaults to the first state. */
  defaultState?: string;
}

export interface CollectionDefinition {
  slug: string;
  labels: Labels;
  fields: FieldDefinition[];
  timestamps?: Partial<CollectionTimestamps> | false | undefined;
  auth?: boolean | undefined;
  admin?:
    | {
        group?: string | undefined;
        defaultSort?: string | undefined;
        defaultPageSize?: number | undefined;
        hide?: boolean | undefined;
        description?: string | undefined;
        useAsTitle?: string | undefined;
      }
    | undefined;
  versions?:
    | {
        drafts: boolean;
        maxPerDoc?: number | undefined;
        softDelete?: boolean | undefined;
        scheduledPublishing?: boolean | undefined;
      }
    | undefined;
  slugField?:
    | {
        source?: string | undefined;
        unique?: boolean | undefined;
      }
    | undefined;
  localization?:
    | {
        locales: string[];
        defaultLocale: string;
      }
    | undefined;
  workflow?: WorkflowConfig | undefined;
  /** Per-collection capability config (feature-flag overrides for workflow/versioning). */
  config?: CollectionCapabilitiesConfig | undefined;
}

export interface GlobalDefinition {
  slug: string;
  label: string;
  fields: FieldDefinition[];
  admin?:
    | {
        group?: string | undefined;
        description?: string | undefined;
        hide?: boolean | undefined;
      }
    | undefined;
  versions?:
    | {
        /** Max version snapshots to keep per global. Oldest versions are pruned. */
        maxPerDoc?: number | undefined;
      }
    | undefined;
  /** Per-global capability config (feature-flag override for versioning). */
  config?: GlobalCapabilitiesConfig | undefined;
}

export interface ComponentDefinition {
  slug: string;
  label: string;
  fields: FieldDefinition[];
}
