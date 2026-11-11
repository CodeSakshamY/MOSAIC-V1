import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { projectSubcategories } from "./slug";

describe("project subcategories", () => {
  it("matches the database list", () => {
    const sql = readFileSync("supabase/migrations/035_project_subcategories.sql", "utf8");
    for (const [category, items] of Object.entries(projectSubcategories)) {
      for (const item of items) {
        expect(sql).toContain(`('${category}', '${item}')`);
      }
    }
  });
});
