import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const member = await getMember();
  if (!member || member.deletedAt) return new NextResponse("Sign in first.", { status: 401 });
  const supabase = await createClient();
  const [{ data: profile }, { data: projects }, { data: posts }] = await Promise.all([
    supabase
      .from("profile_directory")
      .select("username, display_name, bio, city, state, visibility")
      .eq("id", member.id)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("name, slug, description, visibility, status, created_at")
      .eq("owner_id", member.id)
      .is("removed_at", null),
    supabase
      .from("posts")
      .select("title, content, type, created_at")
      .eq("author_id", member.id)
      .is("removed_at", null)
      .limit(200),
  ]);
  return new NextResponse(JSON.stringify({ profile, projects: projects ?? [], posts: posts ?? [] }, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": 'attachment; filename="mosaic-account.json"',
    },
  });
}
