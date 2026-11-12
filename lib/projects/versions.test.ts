import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("project versions", () => {
  it("caps a project at 20 named versions", () => {
    const sql = readFileSync("supabase/migrations/044_project_versions.sql", "utf8");
    expect(sql).toContain(">= 20");
    expect(sql).toContain("char_length(title) between 1 and 80");
    expect(sql).toContain("char_length(note) between 1 and 1000");
  });
});
