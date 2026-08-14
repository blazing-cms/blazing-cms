/** The seven CMS capabilities. Defaults to enabled; `config.enabled: false` turns one off. */
export const CAPABILITY_NAMES = [
  "content",
  "analytics",
  "media",
  "versioning",
  "workflow",
  "notifications",
  "rbac",
] as const;

/** Union of the runtime capability names derived from `CAPABILITY_NAMES`. */
export type RuntimeCapabilityName = (typeof CAPABILITY_NAMES)[number];

/**
 * Capabilities that vary per content type. Only these may appear in a
 * collection's `config.features` block; everything else is project-wide.
 */
export const COLLECTION_SCOPED_CAPABILITIES = ["workflow", "versioning"] as const;

/** Only `versioning` is collection-scoped for globals. */
export const GLOBAL_SCOPED_CAPABILITIES = ["versioning"] as const;
