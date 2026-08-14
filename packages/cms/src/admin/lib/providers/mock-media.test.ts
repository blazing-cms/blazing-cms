import { describe, expect, it } from "vitest";

import { mockProvider } from "@/lib/providers/mock";

function imageFile(name = "photo.jpg", type = "image/jpeg"): File {
  return new File(["bytes"], name, { type });
}

describe("mock provider media", () => {
  it("uploads media and returns a persisted record", async () => {
    const result = await mockProvider.uploadMedia(imageFile(), {
      folder: "heroes",
      tags: ["new"],
    });
    expect(result.id).toBeTruthy();
    const record = await mockProvider.findOne("media", result.id);
    expect(record).toMatchObject({ folder: "heroes", id: result.id, name: "photo.jpg" });
    expect(record?.tags).toEqual(["new"]);
  });

  it("rejects oversized files", async () => {
    const big = new File([new Uint8Array(21 * 1024 * 1024)], "big.mp4", { type: "video/mp4" });
    await expect(mockProvider.uploadMedia(big)).rejects.toThrow(/20MB/);
  });

  it("lists media filtered by folder", async () => {
    const result = await mockProvider.findMany("media", { filter: { folder: "heroes" } });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((doc) => doc.folder === "heroes")).toBe(true);
  });

  it("sorts and limits results", async () => {
    const result = await mockProvider.findMany("media", { limit: 3, order: "desc", sort: "name" });
    expect(result.data.length).toBeLessThanOrEqual(3);
    const names = result.data.map((doc) => String(doc.name));
    expect([...names].sort().reverse()).toEqual(names);
  });

  it("replaces media with a new file", async () => {
    const uploaded = await mockProvider.uploadMedia(imageFile("old.jpg"));
    const replaced = await mockProvider.replaceMedia(uploaded.id, imageFile("new.jpg"), {
      caption: "replaced",
    });
    expect(replaced.url).toBeTruthy();
    const record = await mockProvider.findOne("media", uploaded.id);
    expect(record?.caption).toBe("replaced");
    expect(record?.name).toBe("new.jpg");
  });

  it("deletes media", async () => {
    const uploaded = await mockProvider.uploadMedia(imageFile("temp.jpg"));
    await mockProvider.deleteMedia(uploaded.id);
    await expect(mockProvider.findOne("media", uploaded.id)).resolves.toBeNull();
  });
});
