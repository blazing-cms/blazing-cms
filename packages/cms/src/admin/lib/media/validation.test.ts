import { describe, expect, it } from "vitest";

import { measureImage, pick, safeFileName, validateMediaFile } from "@/lib/media/validation";

describe("validateMediaFile", () => {
  it("accepts allowed image types within the size limit", () => {
    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    expect(() => validateMediaFile(file)).not.toThrow();
  });

  it("accepts video and pdf types", () => {
    const mp4 = new File(["x"], "clip.mp4", { type: "video/mp4" });
    const pdf = new File(["x"], "doc.pdf", { type: "application/pdf" });
    expect(() => validateMediaFile(mp4)).not.toThrow();
    expect(() => validateMediaFile(pdf)).not.toThrow();
  });

  it("rejects files over the size limit", () => {
    const big = new File([new Uint8Array(21 * 1024 * 1024)], "big.mp4", { type: "video/mp4" });
    expect(() => validateMediaFile(big)).toThrow(/20MB/);
  });

  it("rejects unsupported mime types", () => {
    const file = new File(["x"], "note.txt", { type: "text/plain" });
    expect(() => validateMediaFile(file)).toThrow(/Unsupported file type/);
  });
});

describe("safeFileName", () => {
  it("replaces unsafe characters", () => {
    expect(safeFileName("my hero shot!.png")).toBe("my_hero_shot_.png");
  });

  it("keeps safe names unchanged", () => {
    expect(safeFileName("hero-banner_v2.jpg")).toBe("hero-banner_v2.jpg");
  });
});

describe("pick", () => {
  it("returns the fallback when value is undefined", () => {
    expect(pick(undefined, "x")).toBe("x");
    expect(pick("y", "x")).toBe("y");
  });
});

describe("measureImage", () => {
  it("returns empty dimensions for non-image files", async () => {
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });
    await expect(measureImage(file)).resolves.toEqual({});
  });
});
