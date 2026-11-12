import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";

const migrationsDir = "supabase/migrations";

describe("phase 2 database files", () => {
  it("ships migrations 001 through 016, later additions, and no 017 feed file", () => {
    const files = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();
    expect(files).toHaveLength(39);
    expect(files[0]).toBe("001_initial_extensions.sql");
    expect(files[15]).toBe("016_seed_reference.sql");
    expect(files[16]).toBe("018_member_status.sql");
    expect(files[17]).toBe("019_pull_requests.sql");
    expect(files[18]).toBe("020_profile_record.sql");
    expect(files[19]).toBe("021_profile_photos.sql");
    expect(files[20]).toBe("022_profile_banner.sql");
    expect(files[21]).toBe("023_reel_media.sql");
    expect(files[22]).toBe("024_reserved_mosaic.sql");
    expect(files[23]).toBe("025_post_actions.sql");
    expect(files[24]).toBe("026_reserved_forge.sql");
    expect(files[25]).toBe("027_media_filenames.sql");
    expect(files[26]).toBe("028_feed_events.sql");
    expect(files[27]).toBe("029_project_follows.sql");
    expect(files[28]).toBe("030_hidden_posts.sql");
    expect(files[29]).toBe("031_feed_preferences.sql");
    expect(files[30]).toBe("032_project_tagline.sql");
    expect(files[31]).toBe("033_project_gallery.sql");
    expect(files[32]).toBe("034_project_gallery_cap.sql");
    expect(files[33]).toBe("035_project_subcategories.sql");
    expect(files[34]).toBe("036_project_tools.sql");
    expect(files[35]).toBe("037_project_skills_required.sql");
    expect(files[36]).toBe("038_project_status.sql");
    expect(files[37]).toBe("039_project_timeline.sql");
    expect(files[38]).toBe("040_project_milestones.sql");
    expect(files.some((file) => file.startsWith("017_"))).toBe(false);
  });

  it("rejects every reserved username in the database", () => {
    const sql = readFileSync(`${migrationsDir}/002_profiles.sql`, "utf8");
    const reserved = readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .map((file) => readFileSync(`${migrationsDir}/${file}`, "utf8"))
      .join("\n");
    expect(sql).toContain("private.is_reserved_username");
    for (const name of brand.reservedUsernames) {
      expect(reserved).toContain(`'${name}'`);
    }
  });

  it("keeps the secret key on the server", () => {
    const admin = readFileSync("lib/supabase/admin.ts", "utf8");
    const browser = readFileSync("lib/supabase/client.ts", "utf8");
    const proxy = readFileSync("proxy.ts", "utf8");
    expect(admin).toContain('import "server-only"');
    expect(admin).toContain("SUPABASE_SECRET_KEY");
    expect(admin).not.toContain("NEXT_PUBLIC_SUPABASE_SECRET");
    expect(readFileSync("lib/supabase/env.ts", "utf8")).not.toContain("SECRET");
    expect(browser).not.toContain("SECRET");
    expect(browser).not.toContain("service_role");
    expect(proxy).toContain("getClaims");
    expect(proxy).not.toContain(".getSession");
  });
});
