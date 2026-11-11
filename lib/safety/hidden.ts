import { createClient } from "@/lib/supabase/server";

export async function hiddenPostIds(userId: string | null, postIds: string[]) {
  const unique = [...new Set(postIds)];
  if (!userId || unique.length === 0) return new Set<string>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("hidden_posts")
    .select("post_id")
    .eq("profile_id", userId)
    .in("post_id", unique);
  return new Set((data ?? []).map((row) => row.post_id));
}
