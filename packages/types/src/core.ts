import type { CapabilitiesConfig } from "./capabilities.js";

export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  fatal(...args: unknown[]): void;
}

export interface LifecycleHooks {
  onInit?: (() => Promise<void>) | undefined;
  onReady?: (() => Promise<void>) | undefined;
  onShutdown?: (() => Promise<void>) | undefined;
}

export interface FirebaseConfig {
  projectId: string;
  clientEmail?: string | undefined;
  privateKey?: string | undefined;
  databaseURL?: string | undefined;
  storageBucket?: string | undefined;
}

export interface Config {
  firebase: FirebaseConfig;
  storage: {
    bucket?: string | undefined;
  };
  plugins: Record<string, unknown>;
  /** Project-level capability configuration (feature flags + capability settings). */
  capabilities?: CapabilitiesConfig | undefined;
  [key: string]: unknown;
}

export type ConfigLoader = () => Promise<Config>;

export interface EventMap {
  "schema:loaded": { count: number };
  "schema:changed": { slug: string };
  "collection:created": { collection: string; id: string };
  "collection:updated": { collection: string; id: string };
  "collection:deleted": { collection: string; id: string };
  "auth:login": { userId: string };
  "auth:logout": { userId: string };
  "plugin:registered": { slug: string };

  [key: string]: unknown;
}

export interface CMSContext {
  config: Config;
  logger: Logger;
  container: unknown;
}
