import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("project analytics", () => {
  it("counts saves only for the project owner", () => {
    const sql = readFileSync("supabase/migrations/043_project_analytics.sql", "utf8");
    expect(sql).toContain("owner_id = (select auth.uid())");
    expect(sql).toContain("from public.project_saves");
    expect(sql).toContain("else null");
  });
});
