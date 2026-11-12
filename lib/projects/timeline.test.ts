import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseProjectDay, projectTimelineText } from "./timeline";

describe("project timeline", () => {
  it("formats a span and rejects a day outside the allowed range", () => {
    expect(projectTimelineText("2026-11-12", "2026-12-01")).toBe("12 Nov 2026 – 1 Dec 2026");
    expect(projectTimelineText("2026-11-12", null)).toBe("Starts 12 Nov 2026");
    expect(projectTimelineText(null, null)).toBeNull();
    expect(parseProjectDay("")).toBeNull();
    expect(parseProjectDay("1999-12-31")).toBeUndefined();
    expect(parseProjectDay("2026-02-31")).toBeUndefined();
  });

  it("matches the database bounds", () => {
    const sql = readFileSync("supabase/migrations/039_project_timeline.sql", "utf8");
    expect(sql).toContain("starts_on between date '2000-01-01' and date '2100-12-31'");
    expect(sql).toContain("ends_on >= starts_on");
    expect(sql).toContain("new.starts_on is distinct from old.starts_on");
    expect(sql).toContain("new.ends_on is distinct from old.ends_on");
  });
});
