import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CommentForm } from "@/components/feed/CommentForm";
import { PostActions } from "@/components/feed/PostActions";
import { emptyActivity, loadActivity } from "@/lib/feed/activity";
import { getMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Post",
};

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <PostPageContent params={params} />
    </Suspense>
  );
}

async function PostPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getMember();
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id, title, content, type, author_id, project_id, created_at")
    .eq("id", id)
    .is("removed_at", null)
    .maybeSingle();
  if (!post) notFound();

  const [{ data: author }, { data: project }, { data: comments }, activity] = await Promise.all([
    supabase.from("profiles").select("username, display_name").eq("id", post.author_id).maybeSingle(),
    post.project_id
      ? supabase.from("projects").select("name, slug").eq("id", post.project_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("comments")
      .select("id, author_id, parent_comment_id, content, created_at")
      .eq("post_id", post.id)
      .is("removed_at", null)
      .order("created_at", { ascending: true }),
    loadActivity(supabase, [post.id], member?.id ?? null),
  ]);
  const rows = comments ?? [];
  const commenterIds = [...new Set(rows.map((comment) => comment.author_id))];
  const { data: commenters } = commenterIds.length
    ? await supabase.from("profiles").select("id, username, display_name").in("id", commenterIds)
    : { data: [] };
  const commenterName = new Map((commenters ?? []).map((person) => [person.id, person]));
  const replies = new Map<string, typeof rows>();
  for (const comment of rows) {
    if (!comment.parent_comment_id) continue;
    const list = replies.get(comment.parent_comment_id) ?? [];
    list.push(comment);
    replies.set(comment.parent_comment_id, list);
  }
  const signedIn = Boolean(member?.onboardingComplete);

  return (
    <article className="post-page">
      <p className="profile-meta">
        {author?.username ? <Link href={`/people/${author.username}`}>{author.display_name}</Link> : "Builder"}
        {project ? (
          <>
            {" · "}
            <Link href={`/forge/${project.slug}`}>{project.name}</Link>
          </>
        ) : null}
      </p>
      <h1>{post.title ?? "Post"}</h1>
      <p className="discover-copy">{post.content}</p>
      <PostActions
        postId={post.id}
        activity={activity.get(post.id) ?? emptyActivity()}
        signedIn={signedIn}
      />
      <section id="comments" aria-label="Comments">
        <h2>Comments</h2>
        {signedIn ? <CommentForm postId={post.id} /> : <p><Link href={`/profile?next=${encodeURIComponent(`/posts/${post.id}`)}`}>Log in to comment</Link></p>}
        {rows.some((comment) => comment.parent_comment_id === null) ? null : <p>No comments yet.</p>}
        <ul className="repo-list" role="list">
          {rows
            .filter((comment) => comment.parent_comment_id === null)
            .map((comment) => {
              const person = commenterName.get(comment.author_id);
              return (
                <li key={comment.id} className="repo-row">
                  <p className="profile-meta">
                    {person?.username ? <Link href={`/people/${person.username}`}>{person.display_name}</Link> : "Builder"}
                  </p>
                  <p>{comment.content}</p>
                  {signedIn ? <CommentForm postId={post.id} parentId={comment.id} /> : null}
                  <ul className="repo-list" role="list">
                    {(replies.get(comment.id) ?? []).map((reply) => {
                      const replyAuthor = commenterName.get(reply.author_id);
                      return (
                        <li key={reply.id}>
                          <p className="profile-meta">
                            {replyAuthor?.username ? (
                              <Link href={`/people/${replyAuthor.username}`}>{replyAuthor.display_name}</Link>
                            ) : (
                              "Builder"
                            )}
                          </p>
                          <p>{reply.content}</p>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
        </ul>
      </section>
    </article>
  );
}
