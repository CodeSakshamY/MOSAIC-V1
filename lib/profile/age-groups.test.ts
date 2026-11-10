import { describe, expect, it } from "vitest";
import { MINIMUM_AGE, ageGroups } from "./age-groups";

describe("age groups", () => {
  it("starts at 13 and does not store a date of birth", () => {
    expect(MINIMUM_AGE).toBe(13);
    expect(ageGroups[0]).toEqual({ value: "13_15", label: "13–15" });
    expect(ageGroups.map((group) => group.value)).not.toContain("under_13");
  });
});
