"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMember, memberGate } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const idPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeReturn(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("..")) return null;
  const path = value.split("?")[0];
  if (!path || path === "/") return null;
  return path;
}

export async function toggleProjectFollow(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const back = safeReturn(String(formData.get("next") ?? "")) ?? "/discover?view=projects";
  if (!idPattern.test(projectId)) return;
  const member = await getMember();
  if (!member) redirect(`/profile?next=${encodeURIComponent(back)}`);
  const gate = memberGate(member);
  if (gate) redirect(gate);

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project) return;

  const { data: existing } = await supabase
    .from("project_follows")
    .select("profile_id")
    .eq("profile_id", member.id)
    .eq("project_id", project.id)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("project_follows").delete().eq("profile_id", member.id).eq("project_id", project.id)
    : await supabase.from("project_follows").insert({ profile_id: member.id, project_id: project.id });
  if (error) return;

  revalidatePath(`/forge/${project.slug}`);
  revalidatePath("/discover");
  revalidatePath("/");
  revalidatePath(back);
}
