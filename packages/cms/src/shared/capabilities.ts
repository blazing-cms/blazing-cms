import type {
  CapabilitiesConfig,
  CollectionDefinition,
  FeatureFlags,
  GlobalDefinition,
  ResolvedCapabilities,
} from "@blazing-cms/types";

import { CAPABILITY_NAMES } from "@blazing-cms/schema";

/**
 * Builds the default flags with every capability enabled. Used as the baseline
 * that project-level config and per-definition overrides are merged into.
 */
export function defaultFeatureFlags(): FeatureFlags {
  const flags = {} as FeatureFlags;
  for (const name of CAPABILITY_NAMES) {
    flags[name] = true;
  }
  return flags;
}

function collectionScopedOverride(
  def: CollectionDefinition | GlobalDefinition,
): Partial<FeatureFlags> | undefined {
  const featuresConfig = def.config?.features;
  if (!featuresConfig) return undefined;
  const override: Partial<FeatureFlags> = {};
  if ("workflow" in featuresConfig && typeof featuresConfig.workflow === "boolean") {
    override.workflow = featuresConfig.workflow;
  }
  if (typeof featuresConfig.versioning === "boolean") {
    override.versioning = featuresConfig.versioning;
  }
  return Object.keys(override).length > 0 ? override : undefined;
}

/**
 * Merges project-level capability config with per-collection/global overrides
 * into a resolved, single source of truth. Every capability defaults to
 * enabled, so a capability only turns off when explicitly disabled.
 */
export function resolveCapabilities(
  project: CapabilitiesConfig | undefined,
  collections: CollectionDefinition[],
  globals: GlobalDefinition[] = [],
): ResolvedCapabilities {
  const features = defaultFeatureFlags();
  if (project) {
    for (const name of CAPABILITY_NAMES) {
      if (project[name]?.enabled === false) {
        features[name] = false;
      }
    }
  }

  const collectionOverrides: Record<string, Partial<FeatureFlags>> = {};
  for (const collection of collections) {
    const override = collectionScopedOverride(collection);
    if (override) collectionOverrides[collection.slug] = override;
  }

  const globalOverrides: Record<string, Partial<FeatureFlags>> = {};
  for (const global of globals) {
    const override = collectionScopedOverride(global);
    if (override) globalOverrides[global.slug] = override;
  }

  return { collections: collectionOverrides, features, globals: globalOverrides };
}
