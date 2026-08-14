import type { CollectionDefinition, GlobalDefinition } from "@blazing-cms/types";

import { describe, it, expect } from "vitest";

import { defaultFeatureFlags, resolveCapabilities } from "./capabilities.js";

const post: CollectionDefinition = {
  fields: [{ name: "title", type: "text" }],
  labels: { plural: "Posts", singular: "Post" },
  slug: "posts",
};

const page: CollectionDefinition = {
  fields: [{ name: "title", type: "text" }],
  labels: { plural: "Pages", singular: "Page" },
  slug: "pages",
};

const site: GlobalDefinition = {
  fields: [{ name: "title", type: "text" }],
  label: "Site",
  slug: "site-settings",
};

describe("resolveCapabilities", () => {
  it("defaults every capability to enabled", () => {
    const resolved = resolveCapabilities(undefined, [post], [site]);
    for (const value of Object.values(resolved.features)) {
      expect(value).toBe(true);
    }
    expect(resolved.collections).toEqual({});
    expect(resolved.globals).toEqual({});
  });

  it("disables a capability when the project sets enabled: false", () => {
    const resolved = resolveCapabilities({ analytics: { enabled: false } }, [post]);
    expect(resolved.features.analytics).toBe(false);
    expect(resolved.features.content).toBe(true);
    expect(resolved.features.media).toBe(true);
  });

  it("keeps a capability enabled when the project sets enabled: true", () => {
    const resolved = resolveCapabilities({ analytics: { enabled: true } }, [post]);
    expect(resolved.features.analytics).toBe(true);
  });

  it("records per-collection overrides for workflow and versioning", () => {
    const resolved = resolveCapabilities(undefined, [
      post,
      { ...page, config: { features: { versioning: false, workflow: false } } },
    ]);
    expect(resolved.collections.pages).toEqual({ versioning: false, workflow: false });
    expect(resolved.collections.posts).toBeUndefined();
    expect(resolved.features.workflow).toBe(true);
    expect(resolved.features.versioning).toBe(true);
  });

  it("merges project-level and collection-level settings", () => {
    const resolved = resolveCapabilities({ versioning: { enabled: false } }, [
      { ...post, config: { features: { versioning: true } } },
    ]);
    expect(resolved.features.versioning).toBe(false);
    expect(resolved.collections.posts?.versioning).toBe(true);
  });

  it("records per-global versioning overrides", () => {
    const resolved = resolveCapabilities(
      undefined,
      [],
      [{ ...site, config: { features: { versioning: false } } }],
    );
    expect(resolved.globals["site-settings"]).toEqual({ versioning: false });
    expect(resolved.features.versioning).toBe(true);
  });

  it("ignores collections without a config block", () => {
    const resolved = resolveCapabilities(undefined, [post, page]);
    expect(resolved.collections).toEqual({});
  });

  it("defaultFeatureFlags returns all capabilities enabled", () => {
    const flags = defaultFeatureFlags();
    expect(flags.content).toBe(true);
    expect(flags.analytics).toBe(true);
    expect(flags.media).toBe(true);
    expect(flags.versioning).toBe(true);
    expect(flags.workflow).toBe(true);
    expect(flags.notifications).toBe(true);
    expect(flags.rbac).toBe(true);
  });
});
