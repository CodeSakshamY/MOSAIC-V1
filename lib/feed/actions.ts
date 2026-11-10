"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMember, memberGate } from "@/lib/auth/session";
import { isReactionType } from "@/lib/feed/reactions";
import { createClient } from "@/lib/supabase/server";

const idPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function memberOrLogin(next: string) {
  const member = await getMember();
  if (!member) redirect(`/profile?next=${encodeURIComponent(next)}`);
  const gate = memberGate(member);
  if (gate) redirect(gate);
  return member;
}

function refresh(postId: string) {
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
}

export async function toggleReaction(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const type = String(formData.get("type") ?? "");
  const member = await memberOrLogin(`/posts/${postId}`);
  if (!idPattern.test(postId) || !isReactionType(type)) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", member.id)
    .eq("post_id", postId)
    .eq("type", type)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("reactions").delete().eq("id", existing.id).eq("user_id", member.id);
    if (error) return;
  } else {
    if (type === "upvote" || type === "downvote") {
      await supabase
        .from("reactions")
        .delete()
        .eq("user_id", member.id)
        .eq("post_id", postId)
        .eq("type", type === "upvote" ? "downvote" : "upvote");
    }
    const { error } = await supabase.from("reactions").insert({
      user_id: member.id,
      post_id: postId,
      type,
    });
    if (error) return;
  }
  refresh(postId);
}

export async function toggleSave(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const member = await memberOrLogin(`/posts/${postId}`);
  if (!idPattern.test(postId)) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("saves")
    .select("id")
    .eq("user_id", member.id)
    .eq("post_id", postId)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("saves").delete().eq("id", existing.id).eq("user_id", member.id)
    : await supabase.from("saves").insert({ user_id: member.id, post_id: postId });
  if (error) return;
  refresh(postId);
}

export async function toggleRepost(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const member = await memberOrLogin(`/posts/${postId}`);
  if (!idPattern.test(postId)) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("reposts")
    .select("id")
    .eq("user_id", member.id)
    .eq("post_id", postId)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("reposts").delete().eq("id", existing.id).eq("user_id", member.id)
    : await supabase.from("reposts").insert({ user_id: member.id, post_id: postId });
  if (error) return;
  refresh(postId);
}

export async function addComment(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const parentId = String(formData.get("parentId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const member = await memberOrLogin(`/posts/${postId}`);
  if (!idPattern.test(postId) || content.length < 1 || content.length > 2000) return;
  if (parentId && !idPattern.test(parentId)) return;

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: member.id,
    content,
    parent_comment_id: parentId || null,
  });
  if (error) return;
  refresh(postId);
}
