import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const supabase = await createClient();
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const [{ data: projects }, { data: people }] = await Promise.all([
    supabase
      .from("projects")
      .select("slug, updated_at")
      .eq("visibility", "public")
      .is("removed_at", null)
      .order("updated_at", { ascending: false })
      .limit(200),
    supabase
      .from("profiles")
      .select("username, created_at")
      .eq("visibility", "public")
      .eq("onboarding_complete", true)
      .eq("is_demo", false)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  return [
    { url: `${base}/` },
    { url: `${base}/discover` },
    ...(projects ?? []).map((project) => ({
      url: `${base}/forge/${project.slug}`,
      lastModified: project.updated_at,
    })),
    ...(people ?? []).flatMap((person) => (person.username ? [{ url: `${base}/people/${person.username}` }] : [])),
  ];
}
