import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("project milestones", () => {
  it("caps a project at 12 named dates inside the timeline bounds", () => {
    const sql = readFileSync("supabase/migrations/040_project_milestones.sql", "utf8");
    expect(sql).toContain("char_length(title) between 1 and 80");
    expect(sql).toContain("happens_on between date '2000-01-01' and date '2100-12-31'");
    expect(sql).toContain(">= 12");
    expect(sql).toContain("project_milestones_project_title_day");
  });
});
