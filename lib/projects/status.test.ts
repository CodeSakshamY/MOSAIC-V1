import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { projectStatuses } from "./slug";

describe("project status", () => {
  it("stores the seven checklist statuses and maps the old values", () => {
    const sql = readFileSync("supabase/migrations/038_project_status.sql", "utf8");
    for (const status of projectStatuses) {
      expect(sql).toContain(`'${status.value}'`);
    }
    expect(sql).toContain("when 'planning' then 'researching'");
    expect(sql).toContain("when 'building' then 'in_development'");
    expect(sql).toContain("when 'working' then 'in_development'");
    expect(sql).toContain("when 'shipped' then 'completed'");
    expect(sql).toContain("when 'abandoned' then 'on_hold'");
  });
});
