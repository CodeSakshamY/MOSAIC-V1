import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PostActions } from "@/components/feed/PostActions";
import { getMember } from "@/lib/auth/session";
import { brand } from "@/lib/brand";
import { emptyActivity, loadActivity } from "@/lib/feed/activity";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = {
  title: {
    absolute: `Home · ${brand.name}`,
  },
};

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeFeed />
    </Suspense>
  );
}

async function HomeFeed() {
  const member = await getMember();
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, content, type, author_id, project_id, created_at")
    .eq("visibility", "public")
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(30);
  const posts = data ?? [];
  const { data: repostRows } = await supabase
    .from("reposts")
    .select("id, user_id, post_id, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  const reposts = repostRows ?? [];
  const missingIds = reposts.map((repost) => repost.post_id).filter((id) => !posts.some((post) => post.id === id));
  const { data: repostedPosts } = missingIds.length
    ? await supabase
        .from("posts")
        .select("id, title, content, type, author_id, project_id, created_at")
        .in("id", missingIds)
        .eq("visibility", "public")
        .is("removed_at", null)
    : { data: [] };
  const postById = new Map([...posts, ...(repostedPosts ?? [])].map((post) => [post.id, post]));
  const feed = [
    ...posts.map((post) => ({ key: post.id, at: post.created_at, post, reposterId: null as string | null })),
    ...reposts.flatMap((repost) => {
      const post = postById.get(repost.post_id);
      return post ? [{ key: repost.id, at: repost.created_at, post, reposterId: repost.user_id }] : [];
    }),
  ]
    .sort((left, right) => (left.at < right.at ? 1 : -1))
    .slice(0, 30);
  const activity = await loadActivity(
    supabase,
    [...new Set(feed.map((item) => item.post.id))],
    member?.id ?? null,
  );
  const authorIds = [...new Set([...feed.map((item) => item.post.author_id), ...feed.map((item) => item.reposterId).filter((id) => id !== null)])];
  const projectIds = [...new Set(feed.map((item) => item.post.project_id).filter((id) => id !== null))];
  const [{ data: authors }, { data: projects }, { data: railProjects }, { data: railPeople }] = await Promise.all([
    authorIds.length
      ? supabase.from("profiles").select("id, username, display_name").in("id", authorIds)
      : Promise.resolve({ data: [] as { id: string; username: string | null; display_name: string }[] }),
    projectIds.length
      ? supabase.from("projects").select("id, name, slug").in("id", projectIds)
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
    supabase
      .from("projects")
      .select("id, name, slug")
      .eq("visibility", "public")
      .is("removed_at", null)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("onboarding_complete", true)
      .not("username", "is", null)
      .order("display_name")
      .limit(5),
  ]);
  const authorName = new Map((authors ?? []).map((author) => [author.id, author]));
  const projectName = new Map((projects ?? []).map((project) => [project.id, project]));

  return (
    <div className="home-layout">
      <section aria-label="Feed">
        <header className="page-header">
          <h1>Home</h1>
          <p className="lede">Latest public work from builders. Reading it does not need an account.</p>
        </header>
        <nav className="repo-filters home-feed-tabs" aria-label="Home feed">
          <span aria-current="page">Latest</span>
        </nav>
        {feed.length === 0 ? (
          <div className="empty-feed">
            <h2>{member?.onboardingComplete ? "Your feed is empty" : "Nothing published yet"}</h2>
            <p>
              When builders publish projects and progress, this column is where they show up.
              Accounts are for people aged 13 and older.
            </p>
            {member?.onboardingComplete ? (
              <p>
                <Link href="/build">Build</Link>
                {" · "}
                <Link href="/discover">Discover</Link>
              </p>
            ) : null}
          </div>
        ) : (
          <ul className="repo-list" role="list">
            {feed.map((item) => {
              const post = item.post;
              const author = authorName.get(post.author_id);
              const reposter = item.reposterId ? authorName.get(item.reposterId) : undefined;
              const project = post.project_id ? projectName.get(post.project_id) : undefined;
              return (
                <li key={item.key} className="repo-row">
                  {reposter ? (
                    <p className="profile-meta">
                      {reposter.username ? (
                        <Link href={`/people/${reposter.username}`}>{reposter.display_name}</Link>
                      ) : (
                        "Someone"
                      )}{" "}
                      reposted
                    </p>
                  ) : null}
                  <div className="repo-title">
                    <strong>
                      <Link href={`/posts/${post.id}`}>{post.title ?? "Post"}</Link>
                    </strong>
                    <span className="repo-visibility">{post.type.replaceAll("_", " ")}</span>
                  </div>
                  <p className="discover-copy">{post.content}</p>
                  <p className="profile-meta">
                    {author?.username ? (
                      <Link href={`/people/${author.username}`}>{author.display_name}</Link>
                    ) : (
                      "Builder"
                    )}
                    {project ? (
                      <>
                        {" · "}
                        <Link href={`/build/${project.slug}`}>{project.name}</Link>
                      </>
                    ) : null}
                  </p>
                  <PostActions
                    postId={post.id}
                    activity={activity.get(post.id) ?? emptyActivity()}
                    signedIn={Boolean(member?.onboardingComplete)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <aside className="rail" aria-label="Related">
        <section>
          <h2>Projects</h2>
          {(railProjects ?? []).length === 0 ? <p>No public projects yet.</p> : null}
          <ul className="repo-list" role="list">
            {(railProjects ?? []).map((project) => (
              <li key={project.id}>
                <Link href={`/build/${project.slug}`}>{project.name}</Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2>People</h2>
          {(railPeople ?? []).filter((person) => person.username).length === 0 ? (
            <p>No builders to show yet.</p>
          ) : null}
          <ul className="repo-list" role="list">
            {(railPeople ?? []).map((person) =>
              person.username ? (
                <li key={person.username}>
                  <Link href={`/people/${person.username}`}>{person.display_name}</Link>
                </li>
              ) : null,
            )}
          </ul>
        </section>
        <section>
          <h2>Opportunities</h2>
          <p>No opportunities yet.</p>
        </section>
      </aside>
    </div>
  );
}
