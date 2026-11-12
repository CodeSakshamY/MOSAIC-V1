import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { brand } from "@/lib/brand";

const migrationsDir = "supabase/migrations";

describe("phase 2 database files", () => {
  it("ships migrations 001 through 016, later additions, and no 017 feed file", () => {
    const files = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();
    expect(files).toHaveLength(86);
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
    expect(files[39]).toBe("041_project_credits.sql");
    expect(files[40]).toBe("042_project_saves.sql");
    expect(files[41]).toBe("043_project_analytics.sql");
    expect(files[42]).toBe("044_project_versions.sql");
    expect(files[43]).toBe("045_build_log_files.sql");
    expect(files[44]).toBe("046_build_log_milestone.sql");
    expect(files[45]).toBe("047_build_log_problem.sql");
    expect(files[46]).toBe("048_build_log_experiment.sql");
    expect(files[47]).toBe("049_build_log_lesson.sql");
    expect(files[48]).toBe("050_build_log_explanation.sql");
    expect(files[49]).toBe("051_build_log_follows.sql");
    expect(files[50]).toBe("052_major_milestones.sql");
    expect(files[51]).toBe("053_profile_featured_projects.sql");
    expect(files[52]).toBe("054_profile_publications.sql");
    expect(files[53]).toBe("055_profile_competitions.sql");
    expect(files[54]).toBe("056_profile_communities.sql");
    expect(files[55]).toBe("057_profile_links.sql");
    expect(files[56]).toBe("058_profile_visibility.sql");
    expect(files[57]).toBe("059_profile_select.sql");
    expect(files[58]).toBe("060_verified_credentials.sql");
    expect(files[59]).toBe("061_profile_sections.sql");
    expect(files[60]).toBe("062_project_showcase_posts.sql");
    expect(files[61]).toBe("063_opportunity_announcements.sql");
    expect(files[62]).toBe("064_post_link.sql");
    expect(files[63]).toBe("065_teammate_requirement.sql");
    expect(files[64]).toBe("066_teammate_responsibilities.sql");
    expect(files[65]).toBe("067_time_commitment.sql");
    expect(files[66]).toBe("068_project_discussion.sql");
    expect(files[67]).toBe("069_project_invites.sql");
    expect(files[68]).toBe("070_collections.sql");
    expect(files[69]).toBe("071_opportunity_categories.sql");
    expect(files[70]).toBe("072_close_own_account.sql");
    expect(files[71]).toBe("073_close_account_storage.sql");
    expect(files[72]).toBe("074_other_sessions.sql");
    expect(files[73]).toBe("075_opportunity_reports.sql");
    expect(files[74]).toBe("076_opportunity_moderation.sql");
    expect(files[75]).toBe("077_mutes.sql");
    expect(files[76]).toBe("078_notify_follows.sql");
    expect(files[77]).toBe("079_security_notice_type.sql");
    expect(files[78]).toBe("080_security_notice.sql");
    expect(files[79]).toBe("081_mention_notices.sql");
    expect(files[80]).toBe("082_notice_kinds.sql");
    expect(files[81]).toBe("083_reaction_notices.sql");
    expect(files[82]).toBe("084_comments_open.sql");
    expect(files[83]).toBe("085_invite_notices.sql");
    expect(files[84]).toBe("086_join_notices.sql");
    expect(files[85]).toBe("087_saved_project_notices.sql");
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
