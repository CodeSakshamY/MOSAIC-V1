"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMember, memberGate } from "@/lib/auth/session";
import { parseWebsite } from "@/lib/auth/validation";
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
  revalidatePath("/discover");
  revalidatePath(`/posts/${postId}`);
}

export async function tuneFeed(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const signal = String(formData.get("signal") ?? "");
  const member = await memberOrLogin("/?tab=for-you");
  if (!idPattern.test(postId)) return;
  if (signal === "dismiss") {
    await insertDismiss(member.id, postId);
    return;
  }
  if (signal !== "more" && signal !== "less") return;
  const supabase = await createClient();
  const { error: removed } = await supabase
    .from("feed_events")
    .delete()
    .eq("user_id", member.id)
    .eq("post_id", postId)
    .in("event_type", ["more", "less"]);
  if (removed) return;
  const { error } = await supabase.from("feed_events").insert({
    user_id: member.id,
    post_id: postId,
    event_type: signal,
  });
  if (error) return;
  revalidatePath("/");
}

async function insertDismiss(userId: string, postId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("feed_events")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .eq("event_type", "dismiss")
    .maybeSingle();
  if (!existing) {
    const { error } = await supabase.from("feed_events").insert({
      user_id: userId,
      post_id: postId,
      event_type: "dismiss",
    });
    if (error) return;
  }
  revalidatePath("/");
}

export async function dismissPost(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const member = await memberOrLogin("/?tab=for-you");
  if (!idPattern.test(postId)) return;
  await insertDismiss(member.id, postId);
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
  if (error) {
    redirect(`/posts/${postId}${error.message.toLowerCase().includes("closed") ? "?comments=closed" : ""}`);
  }
  refresh(postId);
}

const feedPostTypes = ["idea", "help", "achievement", "project"] as const;

export async function createFeedPost(_state: { error?: string } | null, formData: FormData) {
  const member = await memberOrLogin("/discover?view=posts");
  const type = String(formData.get("type") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const content = String(formData.get("content") ?? "").trim().slice(0, 8000);
  if (!feedPostTypes.some((item) => item === type)) return { error: "Choose a kind of post." };
  if (!title) return { error: "Add a title." };
  if (!content) return { error: "Write the post." };
  const attachment = parseWebsite(String(formData.get("attachment") ?? ""));
  if (!attachment.ok) return { error: attachment.error };
  const supabase = await createClient();
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", member.id)
    .gte("created_at", since);
  if ((count ?? 0) >= 5) return { error: "Too many posts in a short time. Wait and try again." };
  const { data: duplicate } = await supabase
    .from("posts")
    .select("id")
    .eq("author_id", member.id)
    .eq("title", title)
    .eq("content", content)
    .is("removed_at", null)
    .limit(1)
    .maybeSingle();
  if (duplicate) return { error: "You already published that post." };
  let projectId: string | null = null;
  if (type === "project") {
    projectId = String(formData.get("projectId") ?? "");
    if (!idPattern.test(projectId)) return { error: "Choose one of your public projects." };
    const { data: project } = await supabase
      .from("projects")
      .select("id, owner_id, visibility")
      .eq("id", projectId)
      .is("removed_at", null)
      .maybeSingle();
    if (!project || project.owner_id !== member.id || project.visibility !== "public") {
      return { error: "Choose one of your public projects." };
    }
  }
  const { error } = await supabase.from("posts").insert({
    author_id: member.id,
    type: type as (typeof feedPostTypes)[number],
    title,
    content,
    project_id: projectId,
    link_url: attachment.website,
    visibility: "public",
    is_demo: false,
  });
  if (error) return { error: "The post was not saved." };
  revalidatePath("/discover");
  redirect("/discover?view=posts");
}
