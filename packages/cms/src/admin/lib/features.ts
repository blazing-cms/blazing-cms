import type { CapabilityName } from "@blazing-cms/types";

import { capabilities } from "@/__generated__/app-config";

/** Whether a capability is enabled project-wide, from the generated app config. */
export function featureEnabled(name: CapabilityName): boolean {
  return capabilities.features[name];
}

/**
 * Whether a collection-scoped capability is enabled for a specific collection.
 * Falls back to the project-wide flag when the collection has no override.
 */
export function collectionFeatureEnabled(slug: string, name: "workflow" | "versioning"): boolean {
  return capabilities.collections[slug]?.[name] ?? capabilities.features[name];
}

/**
 * Whether a global-scoped capability is enabled for a specific global.
 * Falls back to the project-wide flag when the global has no override.
 */
export function globalFeatureEnabled(slug: string, name: "versioning"): boolean {
  return capabilities.globals[slug]?.[name] ?? capabilities.features[name];
}
