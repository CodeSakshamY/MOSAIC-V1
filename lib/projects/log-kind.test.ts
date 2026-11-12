import { describe, expect, it } from "vitest";
import { buildLogKindLabel, isBuildLogKind } from "@/lib/projects/log-kind";

describe("build log kinds", () => {
  it("names a milestone and rejects an unknown kind", () => {
    expect(isBuildLogKind("milestone")).toBe(true);
    expect(isBuildLogKind("problem")).toBe(true);
    expect(isBuildLogKind("experiment")).toBe(false);
    expect(buildLogKindLabel("problem")).toBe("Problem");
  });
});
