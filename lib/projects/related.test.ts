import { describe, expect, it } from "vitest";
import { relatedProjects } from "@/lib/projects/related";

const current = { id: "self", subcategory: "Sensor", skillIds: ["ts", "py"] };

describe("related projects", () => {
  it("keeps projects that share a tool or subcategory and drops the rest", () => {
    const found = relatedProjects(current, [
      { id: "self", name: "Self", slug: "self", subcategory: "Sensor", updatedAt: "3", skillIds: ["ts"] },
      { id: "both", name: "Both", slug: "both", subcategory: "Sensor", updatedAt: "1", skillIds: ["ts", "py"] },
      { id: "one", name: "One", slug: "one", subcategory: "Web", updatedAt: "2", skillIds: ["ts"] },
      { id: "kind", name: "Kind", slug: "kind", subcategory: "Sensor", updatedAt: "2", skillIds: [] },
      { id: "none", name: "None", slug: "none", subcategory: "Web", updatedAt: "9", skillIds: ["cad"] },
    ]);
    expect(found.map((item) => item.slug)).toEqual(["both", "one", "kind"]);
    expect(found[0]?.note).toBe("2 shared tools");
    expect(found[2]?.note).toBe("Same subcategory");
  });
});
