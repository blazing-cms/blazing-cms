import { describe, expect, it } from "vitest";

import { overallProgress } from "@/lib/media/progress";

describe("overallProgress", () => {
  it("returns 0 when total is zero", () => {
    expect(overallProgress(0, 0, 50)).toBe(0);
  });

  it("computes progress for a single file", () => {
    expect(overallProgress(0, 1, 50)).toBe(50);
  });

  it("weights completed files fully", () => {
    expect(overallProgress(1, 2, 50)).toBe(75);
  });

  it("reports 100 at the last completed file", () => {
    expect(overallProgress(2, 3, 100)).toBe(100);
  });
});
