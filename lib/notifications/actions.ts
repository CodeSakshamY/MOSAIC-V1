"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMember, memberGate } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const idPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireMember() {
  const member = await getMember();
  if (!member) redirect("/profile?next=/notifications");
  const gate = memberGate(member);
  if (gate) redirect(gate);
  return member;
}

function refresh() {
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function markNotificationRead(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const member = await requireMember();
  if (!idPattern.test(id)) return;
  const read = formData.get("read") === "1";
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("recipient_id", member.id);
  if (error) return;
  refresh();
}

export async function markAllNotificationsRead() {
  const member = await requireMember();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", member.id)
    .is("read_at", null);
  if (error) return;
  refresh();
}

export async function openNotification(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const member = await requireMember();
  if (!idPattern.test(id)) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, actor_id, post_id, project_id, read_at")
    .eq("id", id)
    .eq("recipient_id", member.id)
    .maybeSingle();
  if (!data) return;
  if (!data.read_at) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("recipient_id", member.id);
    refresh();
  }
  redirect(await destination(supabase, data));
}

async function destination(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: { type: string; actor_id: string | null; post_id: string | null; project_id: string | null },
) {
  if (row.type === "new_follower" && row.actor_id) {
    const { data } = await supabase.from("profiles").select("username").eq("id", row.actor_id).maybeSingle();
    if (data?.username) return `/people/${data.username}`;
  }
  if (row.post_id && (row.type === "comment" || row.type === "reply" || row.type === "project_update")) {
    return `/posts/${row.post_id}`;
  }
  if (row.project_id) {
    const { data } = await supabase.from("projects").select("slug").eq("id", row.project_id).maybeSingle();
    if (data?.slug) return `/forge/${data.slug}`;
  }
  return "/notifications";
}
