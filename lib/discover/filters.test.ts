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
        interest: "robotics",
        experience: "Software",
        availability: "hybrid",
        looking: "teammates",
        type: "Software",
        status: "prototype",
        sort: "popular",
        q: " Sensor% ",
      }),
    ).toEqual({
      q: "Sensor",
      age: "18_24",
      place: "Bengaluru",
      skill: "machine-learning",
      discipline: "technology",
      interest: "robotics",
      experience: "Software",
      availability: "hybrid",
      looking: "teammates",
      type: "Software",
      status: "prototype",
      sort: "popular",
    });
  });

  it("drops values that are not in the product", () => {
    expect(
      readDiscoverFilters({
        age: "under_13",
        place: "City%,()",
        skill: "Not A Skill",
        discipline: "magic",
        interest: "Not An Interest",
        experience: "spaceship",
        availability: "anywhere",
        looking: "nope",
        type: "robotics",
        status: "famous",
        sort: "trending",
      }),
    ).toEqual({
      q: "",
      age: null,
      place: "City",
      skill: "",
      discipline: "",
      interest: "",
      experience: null,
      availability: "",
      looking: "",
      type: null,
      status: null,
      sort: "latest",
    });
  });
});
