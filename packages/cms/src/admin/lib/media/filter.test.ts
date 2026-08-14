import { describe, expect, it } from "vitest";

import type { MediaRecord } from "@/lib/media/types";

import { filterMedia } from "@/lib/media/filter";

const items: MediaRecord[] = [
  {
    altText: "Sunset banner",
    folder: "heroes",
    id: "1",
    name: "hero.jpg",
    tags: ["landing"],
    url: "https://cdn.example.com/1.jpg",
  },
  {
    altText: "",
    folder: "brand",
    id: "2",
    name: "logo.svg",
    tags: ["brand"],
    url: "https://cdn.example.com/2.svg",
  },
  {
    caption: "Community gathering",
    folder: null,
    id: "3",
    name: "meetup.jpg",
    tags: ["community"],
    url: "https://cdn.example.com/3.jpg",
  },
];

describe("filterMedia", () => {
  it("returns all items when no folder or search is given", () => {
    expect(filterMedia(items, null, "")).toHaveLength(3);
  });

  it("filters by folder", () => {
    expect(filterMedia(items, "brand", "").map((item) => item.id)).toEqual(["2"]);
  });

  it("searches by name case-insensitively", () => {
    expect(filterMedia(items, null, "HERO").map((item) => item.id)).toEqual(["1"]);
  });

  it("searches by alt text", () => {
    expect(filterMedia(items, null, "sunset").map((item) => item.id)).toEqual(["1"]);
  });

  it("searches by caption", () => {
    expect(filterMedia(items, null, "gathering").map((item) => item.id)).toEqual(["3"]);
  });

  it("searches by tag", () => {
    expect(filterMedia(items, null, "community").map((item) => item.id)).toEqual(["3"]);
  });

  it("combines folder and search", () => {
    expect(filterMedia(items, "heroes", "banner").map((item) => item.id)).toEqual(["1"]);
    expect(filterMedia(items, "brand", "banner")).toHaveLength(0);
  });
});
