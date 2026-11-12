import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("build log files", () => {
  it("allows a PDF in the post-media bucket", () => {
    const sql = readFileSync("supabase/migrations/045_build_log_files.sql", "utf8");
    expect(sql).toContain("application/pdf");
    expect(sql).toContain("mp4|webm|pdf");
    expect(sql).toContain("new.media_urls");
  });
});
