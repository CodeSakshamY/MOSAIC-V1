"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMember, memberGate } from "@/lib/auth/session";
import { parseUsername } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

const idPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Reason =
  | "harassment"
  | "spam"
  | "inappropriate"
  | "impersonation"
  | "unsafe"
  | "copyright"
  | "other";

const reasons = new Set<Reason>([
  "harassment",
  "spam",
  "inappropriate",
  "impersonation",
  "unsafe",
  "copyright",
  "other",
]);

async function requireMember(next: string) {
  const member = await getMember();
  if (!member) redirect(`/profile?next=${encodeURIComponent(next)}`);
  const gate = memberGate(member);
  if (gate) redirect(gate);
  return member;
}

function note(formData: FormData) {
  const text = String(formData.get("note") ?? "").trim().slice(0, 1000);
  return text || null;
}

function reason(formData: FormData): Reason | null {
  const value = String(formData.get("reason") ?? "");
  return reasons.has(value as Reason) ? (value as Reason) : null;
}

export async function toggleBlock(formData: FormData) {
  const parsed = parseUsername(String(formData.get("username") ?? ""));
  if (!parsed.ok) return;
  const next = `/people/${parsed.username}`;
  const member = await requireMember(next);
  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("id, username, deleted_at")
    .eq("username", parsed.username)
    .maybeSingle();
  if (!target?.username || target.deleted_at || target.id === member.id) return;

  const { data: existing } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocker_id", member.id)
    .eq("blocked_id", target.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("blocks").delete().eq("blocker_id", member.id).eq("blocked_id", target.id)
    : await supabase.from("blocks").insert({ blocker_id: member.id, blocked_id: target.id });
  if (error) return;
  if (!existing) {
    await supabase.from("follows").delete().eq("follower_id", member.id).eq("following_id", target.id);
  }
  revalidatePath(next);
  revalidatePath("/discover");
  revalidatePath("/settings");
}

export async function reportProfile(formData: FormData) {
  const parsed = parseUsername(String(formData.get("username") ?? ""));
  if (!parsed.ok) return;
  const next = `/people/${parsed.username}`;
  const member = await requireMember(next);
  const why = reason(formData);
  if (!why) redirect(`${next}?reported=missing`);
  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("id, deleted_at")
    .eq("username", parsed.username)
    .maybeSingle();
  if (!target || target.deleted_at || target.id === member.id) return;
  const { error } = await supabase.from("reports").insert({
    reporter_id: member.id,
    profile_id: target.id,
    reason: why,
    description: note(formData),
  });
  redirect(error ? `${next}?reported=missing` : `${next}?reported=1`);
}

export async function reportPost(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  if (!idPattern.test(postId)) return;
  const next = `/posts/${postId}`;
  const member = await requireMember(next);
  const why = reason(formData);
  if (!why) redirect(`${next}?reported=missing`);
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id")
    .eq("id", postId)
    .is("removed_at", null)
    .maybeSingle();
  if (!post || post.author_id === member.id) return;
  const { error } = await supabase.from("reports").insert({
    reporter_id: member.id,
    post_id: post.id,
    reason: why,
    description: note(formData),
  });
  redirect(error ? `${next}?reported=missing` : `${next}?reported=1`);
}

export async function reportProject(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  if (!idPattern.test(projectId)) return;
  const member = await requireMember("/forge");
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project?.slug || project.owner_id === member.id) return;
  const next = `/forge/${project.slug}`;
  const why = reason(formData);
  if (!why) redirect(`${next}?reported=missing`);
  const { error } = await supabase.from("reports").insert({
    reporter_id: member.id,
    project_id: project.id,
    reason: why,
    description: note(formData),
  });
  redirect(error ? `${next}?reported=missing` : `${next}?reported=1`);
}

export async function unblock(formData: FormData) {
  const parsed = parseUsername(String(formData.get("username") ?? ""));
  if (!parsed.ok) return;
  const member = await requireMember("/settings");
  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.username)
    .maybeSingle();
  if (!target) return;
  await supabase.from("blocks").delete().eq("blocker_id", member.id).eq("blocked_id", target.id);
  revalidatePath("/settings");
  revalidatePath(`/people/${parsed.username}`);
  revalidatePath("/discover");
}
