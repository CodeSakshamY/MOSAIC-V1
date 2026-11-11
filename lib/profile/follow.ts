"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMember, memberGate } from "@/lib/auth/session";
import { parseUsername } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export async function toggleFollow(formData: FormData) {
  const parsed = parseUsername(String(formData.get("username") ?? ""));
  if (!parsed.ok) return;
  const next = `/people/${parsed.username}`;
  const member = await getMember();
  if (!member) redirect(`/profile?next=${encodeURIComponent(next)}`);
  const gate = memberGate(member);
  if (gate) redirect(gate);

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("id, username, deleted_at")
    .eq("username", parsed.username)
    .maybeSingle();
  if (!target?.username || target.deleted_at || target.id === member.id) return;

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", member.id)
    .eq("following_id", target.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("follows").delete().eq("follower_id", member.id).eq("following_id", target.id)
    : await supabase.from("follows").insert({ follower_id: member.id, following_id: target.id });
  if (error) return;

  revalidatePath(next);
  revalidatePath("/discover");
  if (member.username) revalidatePath(`/people/${member.username}`);
}
