import { describe, expect, it } from "vitest";

import {
  changedFieldCount,
  diffVersionData,
  formatVersionDate,
  summarizeVersion,
  versionLabel,
  versionTargetKey,
} from "@/lib/versions";

describe("diffVersionData", () => {
  it("flags added, removed, changed, and unchanged fields", () => {
    const diff = diffVersionData(
      { count: 1, status: "draft", title: "Old" },
      { author: "x", status: "draft", title: "New" },
    );
    expect(diff).toEqual([
      { after: "x", before: undefined, changed: true, field: "author" },
      { after: undefined, before: 1, changed: true, field: "count" },
      { after: "draft", before: "draft", changed: false, field: "status" },
      { after: "New", before: "Old", changed: true, field: "title" },
    ]);
  });

  it("treats deeply nested values by JSON equality", () => {
    const diff = diffVersionData({ meta: { a: 1 } }, { meta: { a: 1 } });
    expect(diff.at(0)?.changed).toBe(false);
  });
});

describe("version helpers", () => {
  it("formats ISO dates", () => {
    expect(formatVersionDate("2026-07-30T12:00:00.000Z")).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(formatVersionDate(undefined)).toBe("—");
    expect(formatVersionDate("not-a-date")).toBe("not-a-date");
  });

  it("builds stable target keys", () => {
    expect(versionTargetKey({ collection: "posts", id: "abc", kind: "entry" })).toBe("posts/abc");
    expect(versionTargetKey({ kind: "global", slug: "site" })).toBe("global/site");
  });

  it("labels and summarizes versions", () => {
    const version = { id: "v3", number: 3 };
    expect(versionLabel(version as never)).toBe("v3");
    expect(summarizeVersion(version as never)).toBe("Version 3");
    expect(summarizeVersion({ ...version, summary: "Fixed typos" } as never)).toBe("Fixed typos");
  });

  it("counts changed fields against a baseline", () => {
    const base = {
      createdAt: "",
      data: { title: "Old" },
      id: "b",
      kind: "entry",
      number: 1,
      parentId: "x",
      parentType: "y",
    };
    const next = { ...base, data: { title: "New" }, number: 2 };
    expect(changedFieldCount(next, base)).toBe(1);
  });
});
