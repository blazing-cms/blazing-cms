// Auto-generated Blazing CMS SDK — do not edit

import { createBlazeClient } from "@blazing-cms/sdk";
import { capabilities } from "./app-config";

const client = createBlazeClient({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
  features: capabilities.features,
});

export const array = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("array").findMany(options),
  findById: (id: string) => client.collection("array").findById(id),
  create: (data: Record<string, unknown>) => client.collection("array").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("array").update(id, data),
  delete: (id: string) => client.collection("array").delete(id),
};

export const boolean = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("boolean").findMany(options),
  findById: (id: string) => client.collection("boolean").findById(id),
  create: (data: Record<string, unknown>) => client.collection("boolean").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("boolean").update(id, data),
  delete: (id: string) => client.collection("boolean").delete(id),
};

export const component = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("component").findMany(options),
  findById: (id: string) => client.collection("component").findById(id),
  create: (data: Record<string, unknown>) => client.collection("component").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("component").update(id, data),
  delete: (id: string) => client.collection("component").delete(id),
};

export const date = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("date").findMany(options),
  findById: (id: string) => client.collection("date").findById(id),
  create: (data: Record<string, unknown>) => client.collection("date").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("date").update(id, data),
  delete: (id: string) => client.collection("date").delete(id),
};

export const dynamicZone = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("dynamic-zone").findMany(options),
  findById: (id: string) => client.collection("dynamic-zone").findById(id),
  create: (data: Record<string, unknown>) => client.collection("dynamic-zone").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("dynamic-zone").update(id, data),
  delete: (id: string) => client.collection("dynamic-zone").delete(id),
};

export const group = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("group").findMany(options),
  findById: (id: string) => client.collection("group").findById(id),
  create: (data: Record<string, unknown>) => client.collection("group").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("group").update(id, data),
  delete: (id: string) => client.collection("group").delete(id),
};

export const mediaTest = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("media-test").findMany(options),
  findById: (id: string) => client.collection("media-test").findById(id),
  create: (data: Record<string, unknown>) => client.collection("media-test").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("media-test").update(id, data),
  delete: (id: string) => client.collection("media-test").delete(id),
};

export const number = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("number").findMany(options),
  findById: (id: string) => client.collection("number").findById(id),
  create: (data: Record<string, unknown>) => client.collection("number").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("number").update(id, data),
  delete: (id: string) => client.collection("number").delete(id),
};

export const posts = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("posts").findMany(options),
  findById: (id: string) => client.collection("posts").findById(id),
  create: (data: Record<string, unknown>) => client.collection("posts").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("posts").update(id, data),
  delete: (id: string) => client.collection("posts").delete(id),
};

export const relation = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("relation").findMany(options),
  findById: (id: string) => client.collection("relation").findById(id),
  create: (data: Record<string, unknown>) => client.collection("relation").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("relation").update(id, data),
  delete: (id: string) => client.collection("relation").delete(id),
};

export const repeater = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("repeater").findMany(options),
  findById: (id: string) => client.collection("repeater").findById(id),
  create: (data: Record<string, unknown>) => client.collection("repeater").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("repeater").update(id, data),
  delete: (id: string) => client.collection("repeater").delete(id),
};

export const richText = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("rich-text").findMany(options),
  findById: (id: string) => client.collection("rich-text").findById(id),
  create: (data: Record<string, unknown>) => client.collection("rich-text").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("rich-text").update(id, data),
  delete: (id: string) => client.collection("rich-text").delete(id),
};

export const select = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("select").findMany(options),
  findById: (id: string) => client.collection("select").findById(id),
  create: (data: Record<string, unknown>) => client.collection("select").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("select").update(id, data),
  delete: (id: string) => client.collection("select").delete(id),
};

export const text = {
  findMany: (options?: Parameters<ReturnType<typeof client.collection>["findMany"]>[0]) =>
    client.collection("text").findMany(options),
  findById: (id: string) => client.collection("text").findById(id),
  create: (data: Record<string, unknown>) => client.collection("text").create(data),
  update: (id: string, data: Record<string, unknown>) => client.collection("text").update(id, data),
  delete: (id: string) => client.collection("text").delete(id),
};

export const boolean = {
  get: () => client.globals.get("boolean"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("boolean", data),
};

export const checkbox = {
  get: () => client.globals.get("checkbox"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("checkbox", data),
};

export const code = {
  get: () => client.globals.get("code"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("code", data),
};

export const color = {
  get: () => client.globals.get("color"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("color", data),
};

export const date = {
  get: () => client.globals.get("date"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("date", data),
};

export const datetime = {
  get: () => client.globals.get("datetime"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("datetime", data),
};

export const email = {
  get: () => client.globals.get("email"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("email", data),
};

export const homepage = {
  get: () => client.globals.get("homepage"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("homepage", data),
};

export const json = {
  get: () => client.globals.get("json"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("json", data),
};

export const markdown = {
  get: () => client.globals.get("markdown"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("markdown", data),
};

export const mediaSettings = {
  get: () => client.globals.get("media-settings"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("media-settings", data),
};

export const multiSelect = {
  get: () => client.globals.get("multi-select"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("multi-select", data),
};

export const number = {
  get: () => client.globals.get("number"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("number", data),
};

export const password = {
  get: () => client.globals.get("password"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("password", data),
};

export const radio = {
  get: () => client.globals.get("radio"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("radio", data),
};

export const richText = {
  get: () => client.globals.get("rich-text"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("rich-text", data),
};

export const select = {
  get: () => client.globals.get("select"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("select", data),
};

export const siteSettings = {
  get: () => client.globals.get("site-settings"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("site-settings", data),
};

export const slug = {
  get: () => client.globals.get("slug"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("slug", data),
};

export const text = {
  get: () => client.globals.get("text"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("text", data),
};

export const textarea = {
  get: () => client.globals.get("textarea"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("textarea", data),
};

export const url = {
  get: () => client.globals.get("url"),
  upsert: (data: Record<string, unknown>) => client.globals.upsert("url", data),
};

