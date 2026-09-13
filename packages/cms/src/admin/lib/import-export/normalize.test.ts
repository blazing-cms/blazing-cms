import type { FieldDefinition } from "@blazing-cms/types";

import { describe, expect, it } from "vitest";

import {
  buildFieldSources,
  buildMediaMaps,
  toDownloadUrl,
  toStoragePath,
  transformFields,
} from "./normalize";

function mediaField(name: string): FieldDefinition {
  return { name, type: "media" } as FieldDefinition;
}

function objectField(name: string, children: FieldDefinition[]): FieldDefinition {
  return { fields: children, name, type: "object" } as FieldDefinition;
}

function arrayField(name: string, children: FieldDefinition[]): FieldDefinition {
  return { fields: children, name, type: "array" } as FieldDefinition;
}

function componentField(name: string, slug: string): FieldDefinition {
  return { component: slug, name, type: "component" } as FieldDefinition;
}

function dynamicZoneField(name: string, components: string[]): FieldDefinition {
  return { components, name, type: "dynamicZone" } as FieldDefinition;
}

const mediaRecords = [
  { path: "media/image1.png", url: "https://firebasestorage.example.com/bucket/o/image1.png" },
  { path: "media/image2.png", url: "https://firebasestorage.example.com/bucket/o/image2.png" },
];

describe("buildMediaMaps", () => {
  it("builds bidirectional url↔path maps", () => {
    const maps = buildMediaMaps(mediaRecords);
    expect(maps.urlToPath.get("https://firebasestorage.example.com/bucket/o/image1.png")).toBe(
      "media/image1.png",
    );
    expect(maps.pathToUrl.get("media/image2.png")).toBe(
      "https://firebasestorage.example.com/bucket/o/image2.png",
    );
  });

  it("ignores records without url or path", () => {
    const maps = buildMediaMaps([{ url: "only-url" }]);
    expect(maps.urlToPath.size).toBe(0);
    expect(maps.pathToUrl.size).toBe(0);
  });
});

describe("normalize.ts export (url → path)", () => {
  it("rewrites a media field from url to path", () => {
    const maps = buildMediaMaps(mediaRecords);
    const result = transformFields(
      { image: "https://firebasestorage.example.com/bucket/o/image1.png" },
      [mediaField("image")],
      { collections: {}, components: {}, globals: {} },
      toStoragePath(maps),
    );
    expect(result).toEqual({ image: "media/image1.png" });
  });

  it("leaves a non-matching media value unchanged", () => {
    const maps = buildMediaMaps(mediaRecords);
    const result = transformFields(
      { image: "https://other-bucket.example.com/unknown.png" },
      [mediaField("image")],
      { collections: {}, components: {}, globals: {} },
      toStoragePath(maps),
    );
    expect(result).toEqual({ image: "https://other-bucket.example.com/unknown.png" });
  });

  it("leaves non-string media values unchanged", () => {
    const maps = buildMediaMaps(mediaRecords);
    const result = transformFields(
      { image: 123 },
      [mediaField("image")],
      { collections: {}, components: {}, globals: {} },
      toStoragePath(maps),
    );
    expect(result).toEqual({ image: 123 });
  });
});

describe("normalize.ts import (path → url)", () => {
  it("rewrites a media field from path to url", () => {
    const maps = buildMediaMaps(mediaRecords);
    const result = transformFields(
      { image: "media/image1.png" },
      [mediaField("image")],
      { collections: {}, components: {}, globals: {} },
      toDownloadUrl(maps),
    );
    expect(result).toEqual({
      image: "https://firebasestorage.example.com/bucket/o/image1.png",
    });
  });

  it("leaves a non-matching path unchanged", () => {
    const maps = buildMediaMaps(mediaRecords);
    const result = transformFields(
      { image: "media/unknown.png" },
      [mediaField("image")],
      { collections: {}, components: {}, globals: {} },
      toDownloadUrl(maps),
    );
    expect(result).toEqual({ image: "media/unknown.png" });
  });
});

describe("normalize.ts nested structural fields", () => {
  it("recurses into object fields", () => {
    const maps = buildMediaMaps(mediaRecords);
    const fields: FieldDefinition[] = [objectField("meta", [mediaField("cover")])];
    const result = transformFields(
      { meta: { cover: "https://firebasestorage.example.com/bucket/o/image2.png" } },
      fields,
      { collections: {}, components: {}, globals: {} },
      toStoragePath(maps),
    );
    expect(result).toEqual({ meta: { cover: "media/image2.png" } });
  });

  it("recurses into array fields", () => {
    const maps = buildMediaMaps(mediaRecords);
    const fields: FieldDefinition[] = [arrayField("gallery", [mediaField("img")])];
    const result = transformFields(
      {
        gallery: [
          { img: "https://firebasestorage.example.com/bucket/o/image1.png" },
          { img: "https://firebasestorage.example.com/bucket/o/image2.png" },
        ],
      },
      fields,
      { collections: {}, components: {}, globals: {} },
      toStoragePath(maps),
    );
    expect(result).toEqual({
      gallery: [{ img: "media/image1.png" }, { img: "media/image2.png" }],
    });
  });

  it("recurses into dynamicZone components", () => {
    const maps = buildMediaMaps(mediaRecords);
    const sources = buildFieldSources({
      components: [
        {
          fields: [mediaField("background")],
          slug: "hero-banner",
        },
      ],
    });
    const fields: FieldDefinition[] = [dynamicZoneField("blocks", ["hero-banner"])];
    const result = transformFields(
      {
        blocks: [
          {
            __component: "hero-banner",
            background: "https://firebasestorage.example.com/bucket/o/image1.png",
          },
        ],
      },
      fields,
      sources,
      toStoragePath(maps),
    );
    expect(result).toEqual({
      blocks: [{ __component: "hero-banner", background: "media/image1.png" }],
    });
  });

  it("recurses into component fields", () => {
    const maps = buildMediaMaps(mediaRecords);
    const sources = buildFieldSources({
      components: [{ fields: [mediaField("thumb")], slug: "card" }],
    });
    const fields: FieldDefinition[] = [componentField("promo", "card")];
    const result = transformFields(
      { promo: { thumb: "https://firebasestorage.example.com/bucket/o/image1.png" } },
      fields,
      sources,
      toStoragePath(maps),
    );
    expect(result).toEqual({ promo: { thumb: "media/image1.png" } });
  });

  it("handles field values that are undefined or null", () => {
    const maps = buildMediaMaps(mediaRecords);
    const fields: FieldDefinition[] = [mediaField("image")];
    const result = transformFields(
      { image: undefined },
      fields,
      { collections: {}, components: {}, globals: {} },
      toStoragePath(maps),
    );
    expect(result).toEqual({ image: undefined });
  });
});
