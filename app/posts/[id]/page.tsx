import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CommentForm } from "@/components/feed/CommentForm";
import { PostActions } from "@/components/feed/PostActions";
import { FollowButton } from "@/components/profile/FollowButton";
import { ProjectFollowButton } from "@/components/projects/ProjectFollowButton";
import { HidePostButton } from "@/components/safety/HidePostButton";
import { ReportForm, reportedState } from "@/components/safety/ReportForm";
import { emptyActivity, loadActivity } from "@/lib/feed/activity";
import { getMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Post",
};

export default function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reported?: string; comments?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <PostPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PostPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reported?: string; comments?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
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
    supabase.from("profile_directory").select("username, display_name").eq("id", post.author_id).maybeSingle(),
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
  const { data: follow } = member
    ? await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", member.id)
        .eq("following_id", post.author_id)
        .maybeSingle()
    : { data: null };
  const { data: projectFollow } = member && post.project_id
    ? await supabase
        .from("project_follows")
        .select("profile_id")
        .eq("profile_id", member.id)
        .eq("project_id", post.project_id)
        .maybeSingle()
    : { data: null };
  const rows = comments ?? [];
  const commenterIds = [...new Set(rows.map((comment) => comment.author_id))];
  const { data: commenters } = commenterIds.length
    ? await supabase.from("profile_directory").select("id, username, display_name").in("id", commenterIds)
    : { data: [] };
  const commenterName = new Map((commenters ?? []).map((person) => [person.id, person]));
  const replies = new Map<string, typeof rows>();
  for (const comment of rows) {
    if (!comment.parent_comment_id) continue;
    const list = replies.get(comment.parent_comment_id) ?? [];
    list.push(comment);
    replies.set(comment.parent_comment_id, list);
  }
  const { data: hidden } = member
    ? await supabase.from("hidden_posts").select("post_id").eq("profile_id", member.id).eq("post_id", post.id).maybeSingle()
    : { data: null };
  const signedIn = Boolean(member?.onboardingComplete && !member.suspended && !member.deletedAt);

  return (
    <article className="post-page">
      <div className="author-row">
        {author?.username ? <Link href={`/people/${author.username}`}>{author.display_name}</Link> : "Builder"}
        {author?.username && member?.id !== post.author_id ? (
          <FollowButton
            username={author.username}
            following={Boolean(follow)}
            signedIn={signedIn}
            next={`/posts/${post.id}`}
          />
        ) : null}
        {project && post.project_id ? (
          <>
            <Link href={`/forge/${project.slug}`}>{project.name}</Link>
            <ProjectFollowButton
              projectId={post.project_id}
              following={Boolean(projectFollow)}
              signedIn={signedIn}
              next={`/posts/${post.id}`}
            />
          </>
        ) : null}
      </div>
      <h1>{post.title ?? "Post"}</h1>
      <p className="discover-copy">{post.content}</p>
      {member && post.author_id !== member.id ? (
        <div className="author-row">
          <ReportForm kind="post" target={post.id} reported={reportedState(query.reported)} />
          <HidePostButton postId={post.id} hidden={Boolean(hidden)} />
        </div>
      ) : null}
      <PostActions
        postId={post.id}
        activity={activity.get(post.id) ?? emptyActivity()}
        signedIn={signedIn}
      />
      <section id="comments" aria-label="Comments">
        <h2>Comments</h2>
        {query.comments === "closed" ? <p>Comments are closed on this post.</p> : null}
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
