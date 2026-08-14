/**
 * Capability configuration types.
 *
 * Capabilities are the named feature areas of the CMS (content, analytics,
 * media, versioning, workflow, notifications, rbac). Each capability can be
 * toggled with an `enabled` feature flag and carries capability-specific
 * settings. Everything defaults to enabled so omitting config preserves
 * current behavior.
 */

/** A capability that only exposes an on/off switch. */
export interface CapabilityEnabledConfig {
  enabled?: boolean | undefined;
}

/** Analytics settings: enable flag plus result-freshness tuning. */
export interface AnalyticsCapabilityConfig extends CapabilityEnabledConfig {
  /** How long analytics results are considered fresh, in milliseconds. */
  staleTimeMs?: number | undefined;
}

/** Media settings: enable flag plus upload constraints. */
export interface MediaCapabilityConfig extends CapabilityEnabledConfig {
  /** Maximum accepted upload size in bytes. */
  maxFileSize?: number | undefined;
}

/** Versioning settings: enable flag plus retention tuning. */
export interface VersioningCapabilityConfig extends CapabilityEnabledConfig {
  /** Maximum retained versions per document. */
  maxPerDoc?: number | undefined;
}

/** Project-level per-capability configuration. */
export type CapabilitiesConfig = {
  content?: CapabilityEnabledConfig | undefined;
  analytics?: AnalyticsCapabilityConfig | undefined;
  media?: MediaCapabilityConfig | undefined;
  versioning?: VersioningCapabilityConfig | undefined;
  workflow?: CapabilityEnabledConfig | undefined;
  notifications?: CapabilityEnabledConfig | undefined;
  rbac?: CapabilityEnabledConfig | undefined;
};

/** The seven capability names, keyed the same as `CapabilitiesConfig`. */
export type CapabilityName = keyof CapabilitiesConfig;

/** Resolved enabled state for every capability. */
export type FeatureFlags = Record<CapabilityName, boolean>;

/**
 * Collection-scoped feature flags. Only capabilities that genuinely vary per
 * content type are allowed here; the validator rejects anything else.
 */
export type CollectionFeatureFlags = Partial<Record<"workflow" | "versioning", boolean>>;

/** Per-collection capability config, applied as an override on the project defaults. */
export interface CollectionCapabilitiesConfig {
  /** Feature-flag overrides for collection-scoped capabilities. */
  features?: CollectionFeatureFlags | undefined;
}

/** Per-global capability config (only versioning is collection-scoped for globals). */
export interface GlobalCapabilitiesConfig {
  /** Feature-flag overrides for global-scoped capabilities. */
  features?: Partial<Record<"versioning", boolean>> | undefined;
}

/**
 * Resolved capability state emitted into generated output. `features` holds the
 * project-wide flag for every capability; `collections` / `globals` hold
 * per-definition overrides for collection-scoped capabilities. Consumers apply
 * an override when present, otherwise the project-wide flag.
 */
export interface ResolvedCapabilities {
  /** Project-wide flag for every capability. */
  features: FeatureFlags;
  /** Per-collection overrides, keyed by collection slug. */
  collections: Record<string, Partial<FeatureFlags>>;
  /** Per-global overrides, keyed by global slug. */
  globals: Record<string, Partial<FeatureFlags>>;
}
