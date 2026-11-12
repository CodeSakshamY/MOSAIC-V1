"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMember, memberGate } from "@/lib/auth/session";
import { isProjectSlug } from "@/lib/projects/slug";
import { createClient } from "@/lib/supabase/server";

export async function createCollection(formData: FormData) {
  const member = await getMember();
  if (!member) redirect("/profile?next=/discover?view=collections");
  const gate = memberGate(member);
  if (gate) redirect(gate);
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const slug = String(formData.get("slug") ?? "").trim();
  if (!title || !isProjectSlug(slug)) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .eq("visibility", "public")
    .is("removed_at", null)
    .maybeSingle();
  if (!project) return;
  const { data: collection, error } = await supabase
    .from("collections")
    .insert({ owner_id: member.id, title })
    .select("id")
    .maybeSingle();
  if (error || !collection) return;
  const { error: linkError } = await supabase.from("collection_projects").insert({
    collection_id: collection.id,
    project_id: project.id,
  });
  if (linkError) return;
  revalidatePath("/discover");
  redirect("/discover?view=collections");
}
