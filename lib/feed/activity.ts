import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isReactionType, type ReactionChoice } from "@/lib/feed/reactions";

type Client = SupabaseClient<Database>;

export type PostActivity = {
  counts: Record<ReactionChoice | "comment" | "repost", number>;
  mine: Set<ReactionChoice>;
  saved: boolean;
  reposted: boolean;
};

export function emptyActivity(): PostActivity {
  return {
    counts: { like: 0, upvote: 0, downvote: 0, comment: 0, repost: 0 },
    mine: new Set(),
    saved: false,
    reposted: false,
  };
}

export async function loadActivity(supabase: Client, postIds: string[], userId: string | null) {
  const activity = new Map<string, PostActivity>();
  const ensure = (postId: string) => {
    const current = activity.get(postId) ?? emptyActivity();
    activity.set(postId, current);
    return current;
  };
  if (postIds.length === 0) return activity;

  const [reactions, comments, saves, reposts] = await Promise.all([
    supabase.from("reactions").select("post_id, type, user_id").in("post_id", postIds),
    supabase.from("comments").select("post_id").in("post_id", postIds).is("removed_at", null),
    supabase.from("saves").select("post_id, user_id").in("post_id", postIds),
    supabase.from("reposts").select("post_id, user_id").in("post_id", postIds),
  ]);

  for (const row of reactions.data ?? []) {
    if (!isReactionType(row.type)) continue;
    const item = ensure(row.post_id);
    item.counts[row.type] += 1;
    if (userId && row.user_id === userId) item.mine.add(row.type);
  }
  for (const row of comments.data ?? []) ensure(row.post_id).counts.comment += 1;
  for (const row of saves.data ?? []) {
    if (userId && row.user_id === userId) ensure(row.post_id).saved = true;
  }
  for (const row of reposts.data ?? []) {
    const item = ensure(row.post_id);
    item.counts.repost += 1;
    if (userId && row.user_id === userId) item.reposted = true;
  }
  return activity;
}
