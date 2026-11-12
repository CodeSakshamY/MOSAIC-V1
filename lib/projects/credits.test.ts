import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("project credits", () => {
  it("keeps credits to 2000 characters and guards the column", () => {
    const sql = readFileSync("supabase/migrations/041_project_credits.sql", "utf8");
    expect(sql).toContain("char_length(credits) between 1 and 2000");
    expect(sql).toContain("new.credits is distinct from old.credits");
  });
});
