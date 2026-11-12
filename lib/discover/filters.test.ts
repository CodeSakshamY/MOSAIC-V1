import { describe, expect, it } from "vitest";
import { readDiscoverFilters } from "./filters";

describe("readDiscoverFilters", () => {
  it("keeps a real age band, place, skill, and project type", () => {
    expect(
      readDiscoverFilters({
        age: "18_24",
        place: "  Bengaluru ",
        skill: "machine-learning",
        discipline: "technology",
        type: "Software",
        q: " Sensor% ",
      }),
    ).toEqual({
      q: "Sensor",
      age: "18_24",
      place: "Bengaluru",
      skill: "machine-learning",
      discipline: "technology",
      type: "Software",
    });
  });

  it("drops values that are not in the product", () => {
    expect(
      readDiscoverFilters({
        age: "under_13",
        place: "City%,()",
        skill: "Not A Skill",
        discipline: "magic",
        type: "robotics",
      }),
    ).toEqual({
      q: "",
      age: null,
      place: "City",
      skill: "",
      discipline: "",
      type: null,
    });
  });
});
