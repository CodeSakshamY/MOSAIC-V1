import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("project tools", () => {
  it("caps the uses relation at 8 and leaves seeking alone", () => {
    const sql = readFileSync("supabase/migrations/036_project_tools.sql", "utf8");
    expect(sql).toContain("new.relation = 'uses'");
    expect(sql).toContain(">= 8");
    expect(sql).toContain("project_skills_bi_10_limit");
  });
});
