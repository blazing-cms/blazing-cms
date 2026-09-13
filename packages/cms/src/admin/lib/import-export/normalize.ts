import type { FieldDefinition } from "@blazing-cms/types";

/** Lookups derived from media library records (each has `url` and `path`). */
export interface MediaMaps {
  urlToPath: Map<string, string>;
  pathToUrl: Map<string, string>;
}

export interface FieldSources {
  collections: Record<string, FieldDefinition[]>;
  globals: Record<string, FieldDefinition[]>;
  components: Record<string, FieldDefinition[]>;
}

interface SluggedFieldList {
  slug: string;
  fields: FieldDefinition[];
}

interface FieldSourcesInput {
  collections?: SluggedFieldList[];
  globals?: SluggedFieldList[];
  components?: SluggedFieldList[];
}

/** Build `FieldSources` from the schema registry's collection/global/component arrays. */
export function buildFieldSources(input: FieldSourcesInput): FieldSources {
  const toMap = (list: SluggedFieldList[] = []) =>
    Object.fromEntries(
      list
        .filter((item) => item && Array.isArray(item.fields))
        .map((item) => [item.slug, item.fields]),
    );
  return {
    collections: toMap(input.collections),
    components: toMap(input.components),
    globals: toMap(input.globals),
  };
}

export function buildMediaMaps(media: Array<Record<string, unknown>>): MediaMaps {
  const urlToPath = new Map<string, string>();
  const pathToUrl = new Map<string, string>();
  for (const record of media) {
    const url = typeof record.url === "string" ? record.url : "";
    const path = typeof record.path === "string" ? record.path : "";
    if (url && path) {
      urlToPath.set(url, path);
      pathToUrl.set(path, url);
    }
  }
  return { pathToUrl, urlToPath };
}

function isMediaField(field: FieldDefinition): boolean {
  return field.type === "media" || field.type === "upload";
}

const getSubFields = (field: FieldDefinition): FieldDefinition[] =>
  (field as { fields?: FieldDefinition[] }).fields ?? [];

function transformArray(
  value: unknown[],
  field: FieldDefinition,
  sources: FieldSources,
  rewrite: (original: unknown) => unknown,
): unknown[] {
  const subFields = getSubFields(field);
  return value.map((item) => transformRecord(item, subFields, sources, rewrite));
}

function transformTabs(
  value: unknown,
  field: FieldDefinition,
  sources: FieldSources,
  rewrite: (original: unknown) => unknown,
): unknown {
  const tabs = (field as { tabs?: Array<{ fields: FieldDefinition[] }> }).tabs ?? [];
  const flat = tabs.flatMap((tab) => tab.fields ?? []);
  return transformRecord(value, flat, sources, rewrite);
}

function transformComponent(
  value: unknown,
  field: FieldDefinition,
  sources: FieldSources,
  rewrite: (original: unknown) => unknown,
): unknown {
  const comp = sources.components[(field as { component: string }).component];
  if (!comp) return value;
  if (Array.isArray(value)) {
    return value.map((item) => transformRecord(item, comp, sources, rewrite));
  }
  return transformRecord(value, comp, sources, rewrite);
}

function transformDynamicZone(
  value: unknown,
  sources: FieldSources,
  rewrite: (original: unknown) => unknown,
): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((item: unknown) => {
    const record = item as Record<string, unknown>;
    const compSlug = typeof record.__component === "string" ? record.__component : "";
    const comp = compSlug ? sources.components[compSlug] : undefined;
    if (!comp) return item;
    const next = transformRecord(record, comp, sources, rewrite);
    return { ...(next as Record<string, unknown>), __component: compSlug };
  });
}

/**
 * Transform every `media`/`upload` value in `value` using `rewrite`, recursing
 * through structural/composite fields according to the field tree.
 */
function transformValue(
  value: unknown,
  field: FieldDefinition,
  sources: FieldSources,
  rewrite: (original: unknown) => unknown,
): unknown {
  if (isMediaField(field)) return rewrite(value);

  switch (field.type) {
    case "array":
    case "repeater":
      return Array.isArray(value) ? transformArray(value, field, sources, rewrite) : value;
    case "object":
    case "group":
      return transformRecord(value, getSubFields(field), sources, rewrite);
    case "tabs":
      return transformTabs(value, field, sources, rewrite);
    case "component":
      return transformComponent(value, field, sources, rewrite);
    case "dynamicZone":
      return transformDynamicZone(value, sources, rewrite);
    default:
      return value;
  }
}

function transformRecord(
  value: unknown,
  fields: FieldDefinition[],
  sources: FieldSources,
  rewrite: (original: unknown) => unknown,
): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(record)) {
    const field = fields.find((f) => f.name === key);
    result[key] = field ? transformValue(raw, field, sources, rewrite) : raw;
  }
  return result;
}

/** Rewrite media values within a single entry/global payload. */
export function transformFields(
  data: unknown,
  fields: FieldDefinition[],
  sources: FieldSources,
  rewrite: (original: unknown) => unknown,
): unknown {
  return transformRecord(data, fields, sources, rewrite);
}

/** Export direction: replace media download URLs with portable Storage paths. */
export function toStoragePath(maps: MediaMaps): (original: unknown) => unknown {
  return (original) => {
    if (typeof original !== "string") return original;
    return maps.urlToPath.get(original) ?? original;
  };
}

/** Import direction: resolve Storage paths to the target project's download URLs. */
export function toDownloadUrl(maps: MediaMaps): (original: unknown) => unknown {
  return (original) => {
    if (typeof original !== "string") return original;
    return maps.pathToUrl.get(original) ?? original;
  };
}

export function emptyFieldSources(): FieldSources {
  return { collections: {}, components: {}, globals: {} };
}
