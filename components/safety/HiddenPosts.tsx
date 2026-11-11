import Link from "next/link";
import { unhidePost } from "@/lib/safety/actions";
import { createClient } from "@/lib/supabase/server";

export async function HiddenPosts({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: hidden } = await supabase
    .from("hidden_posts")
    .select("post_id, created_at")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false });
  const ids = (hidden ?? []).map((row) => row.post_id);
  const { data: posts } = ids.length
    ? await supabase.from("posts").select("id, title").in("id", ids).is("removed_at", null)
    : { data: [] };

  return (
    <section className="profile-section" aria-labelledby="hidden-heading">
      <h2 id="hidden-heading">Hidden posts</h2>
      <p>Hidden posts stay up for everyone else. They drop out of your feeds.</p>
      {(posts ?? []).length === 0 ? (
        <p>You have not hidden any posts.</p>
      ) : (
        <ul className="notification-list" role="list">
          {(posts ?? []).map((post) => (
            <li key={post.id} className="notification-row">
              <Link href={`/posts/${post.id}`}>{post.title ?? "Post"}</Link>
              <form action={unhidePost}>
                <input type="hidden" name="postId" value={post.id} />
                <button className="text-button" type="submit">
                  Unhide
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
