import { describe, expect, it } from "vitest";
import { isProjectSlug, projectSlug } from "./slug";

describe("project slug", () => {
  it("turns a name into a repository slug", () => {
    expect(projectSlug("Sensor Node")).toBe("sensor-node");
    expect(isProjectSlug(projectSlug("Sensor Node"))).toBe(true);
  });

  it("rejects a slug that is too short", () => {
    expect(isProjectSlug(projectSlug("A"))).toBe(false);
  });
});
