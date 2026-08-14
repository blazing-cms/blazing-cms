import type {
  CollectionDefinition,
  GlobalDefinition,
  ComponentDefinition,
} from "@blazing-cms/types";

import { describe, it, expect } from "vitest";

import { SchemaValidator } from "../validator.js";

const validator = new SchemaValidator();

describe("SchemaValidator", () => {
  describe("validateCollection", () => {
    it("passes for valid collection", () => {
      const c: CollectionDefinition = {
        fields: [{ name: "title", type: "text" }],
        labels: { plural: "Posts", singular: "Post" },
        slug: "posts",
      };
      expect(validator.validateCollection(c)).toEqual([]);
    });

    it("fails when slug is missing", () => {
      const c = {
        fields: [{ name: "t", type: "text" as const }],
        labels: { plural: "y", singular: "x" },
        slug: "",
      };
      const errors = validator.validateCollection(c);
      expect(errors.some((e) => e.path === "slug")).toBe(true);
    });

    it("fails when singular label is missing", () => {
      const c = {
        fields: [{ name: "t", type: "text" as const }],
        labels: { plural: "y", singular: "" },
        slug: "x",
      };
      const errors = validator.validateCollection(c);
      expect(errors.some((e) => e.message.includes("Singular"))).toBe(true);
    });

    it("fails when plural label is missing", () => {
      const c = {
        fields: [{ name: "t", type: "text" as const }],
        labels: { plural: "", singular: "x" },
        slug: "x",
      };
      const errors = validator.validateCollection(c);
      expect(errors.some((e) => e.message.includes("Plural"))).toBe(true);
    });

    it("fails with no fields", () => {
      const c: CollectionDefinition = {
        fields: [],
        labels: { plural: "Xs", singular: "X" },
        slug: "x",
      };
      const errors = validator.validateCollection(c);
      expect(errors.some((e) => e.message.includes("At least one field"))).toBe(true);
    });

    it("fails when select field has no options", () => {
      const c: CollectionDefinition = {
        fields: [{ name: "color", options: [], type: "select" }],
        labels: { plural: "Xs", singular: "X" },
        slug: "x",
      };
      const errors = validator.validateCollection(c);
      expect(errors.some((e) => e.path.includes("options"))).toBe(true);
    });

    it("fails when relation field has no target", () => {
      const c: CollectionDefinition = {
        fields: [{ name: "rel", to: "", type: "relation" }],
        labels: { plural: "Xs", singular: "X" },
        slug: "x",
      };
      const errors = validator.validateCollection(c);
      expect(errors.some((e) => e.path.includes("to"))).toBe(true);
    });

    it("fails when component field has no component slug", () => {
      const c: CollectionDefinition = {
        fields: [{ component: "", name: "c", type: "component" }],
        labels: { plural: "Xs", singular: "X" },
        slug: "x",
      };
      const errors = validator.validateCollection(c);
      expect(errors.some((e) => e.path.includes("component"))).toBe(true);
    });
  });

  describe("validateGlobal", () => {
    it("passes for valid global", () => {
      const g: GlobalDefinition = {
        fields: [{ name: "title", type: "text" }],
        label: "Homepage",
        slug: "homepage",
      };
      expect(validator.validateGlobal(g)).toEqual([]);
    });

    it("fails when slug is empty", () => {
      const g: GlobalDefinition = { fields: [], label: "X", slug: "" };
      expect(validator.validateGlobal(g).some((e) => e.path === "slug")).toBe(true);
    });

    it("fails when label is empty", () => {
      const g: GlobalDefinition = { fields: [], label: "", slug: "x" };
      expect(validator.validateGlobal(g).some((e) => e.message.includes("Label"))).toBe(true);
    });
  });

  describe("validateComponent", () => {
    it("passes for valid component", () => {
      const c: ComponentDefinition = {
        fields: [{ name: "heading", type: "text" }],
        label: "Hero",
        slug: "hero",
      };
      expect(validator.validateComponent(c)).toEqual([]);
    });

    it("fails when slug is empty", () => {
      const c: ComponentDefinition = { fields: [], label: "X", slug: "" };
      expect(validator.validateComponent(c).some((e) => e.path === "slug")).toBe(true);
    });

    it("fails when label is empty", () => {
      const c: ComponentDefinition = { fields: [], label: "", slug: "hero" };
      expect(validator.validateComponent(c).some((e) => e.message.includes("Label"))).toBe(true);
    });
  });

  describe("validateField edge cases", () => {
    it("fails when field name is empty", () => {
      const c: CollectionDefinition = {
        fields: [{ name: "", type: "text" }],
        labels: { plural: "Xs", singular: "X" },
        slug: "x",
      };
      expect(validator.validateCollection(c).some((e) => e.message.includes("Field name"))).toBe(
        true,
      );
    });
  });

  describe("validateCapabilities", () => {
    it("passes when capabilities is undefined", () => {
      expect(validator.validateCapabilities(undefined)).toEqual([]);
    });

    it("passes for valid capability config", () => {
      const errors = validator.validateCapabilities({
        analytics: { enabled: false, staleTimeMs: 60000 },
        media: { enabled: true, maxFileSize: 10 },
      });
      expect(errors).toEqual([]);
    });

    it("rejects an unknown capability name", () => {
      const errors = validator.validateCapabilities({
        // @ts-expect-error intentionally invalid
        teleport: { enabled: true },
      });
      expect(errors.some((e) => e.message.includes("Unknown capability"))).toBe(true);
      expect(errors[0].path).toBe("capabilities.teleport");
    });

    it("rejects a non-boolean enabled flag", () => {
      const errors = validator.validateCapabilities({
        // @ts-expect-error intentionally invalid
        analytics: { enabled: "yes" },
      });
      expect(errors.some((e) => e.message.includes("must be a boolean"))).toBe(true);
    });

    it("rejects a non-numeric capability setting", () => {
      const errors = validator.validateCapabilities({
        // @ts-expect-error intentionally invalid
        analytics: { staleTimeMs: "fast" },
      });
      expect(errors.some((e) => e.message.includes('"staleTimeMs" must be a number'))).toBe(true);
    });
  });

  describe("validateCollection config.features", () => {
    it("passes for valid workflow/versioning flags", () => {
      const c: CollectionDefinition = {
        config: { features: { versioning: false, workflow: true } },
        fields: [{ name: "title", type: "text" }],
        labels: { plural: "Posts", singular: "Post" },
        slug: "posts",
      };
      expect(validator.validateCollection(c)).toEqual([]);
    });

    it("rejects a non-collection-scoped capability in features", () => {
      const c = {
        config: { features: { analytics: false } },
        fields: [{ name: "title", type: "text" as const }],
        labels: { plural: "Posts", singular: "Post" },
        slug: "posts",
      };
      const errors = validator.validateCollection(c);
      expect(errors.some((e) => e.message.includes("Unknown collection-scoped capability"))).toBe(
        true,
      );
    });

    it("rejects a non-boolean feature flag", () => {
      const c = {
        config: { features: { workflow: "always" } },
        fields: [{ name: "title", type: "text" as const }],
        labels: { plural: "Posts", singular: "Post" },
        slug: "posts",
      };
      const errors = validator.validateCollection(c);
      expect(errors.some((e) => e.message.includes("must be a boolean"))).toBe(true);
    });
  });

  describe("validateGlobal config.features", () => {
    it("passes for a valid versioning flag", () => {
      const g: GlobalDefinition = {
        config: { features: { versioning: false } },
        fields: [{ name: "title", type: "text" }],
        label: "Homepage",
        slug: "homepage",
      };
      expect(validator.validateGlobal(g)).toEqual([]);
    });

    it("rejects a non-versioning flag on a global", () => {
      const g = {
        config: { features: { workflow: true } },
        fields: [{ name: "title", type: "text" as const }],
        label: "Homepage",
        slug: "homepage",
      };
      const errors = validator.validateGlobal(g);
      expect(errors.some((e) => e.message.includes("Unknown global-scoped capability"))).toBe(true);
    });
  });
});
