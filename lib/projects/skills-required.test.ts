import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("skills required", () => {
  it("caps the seeking relation at 8", () => {
    const sql = readFileSync("supabase/migrations/037_project_skills_required.sql", "utf8");
    expect(sql).toContain("new.relation in ('uses', 'seeking')");
    expect(sql).toContain("relation = new.relation");
    expect(sql).toContain(">= 8");
  });
});
