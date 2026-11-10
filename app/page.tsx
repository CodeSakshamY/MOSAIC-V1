import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getMember } from "@/lib/auth/session";
import { brand } from "@/lib/brand";
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
  if (!member?.onboardingComplete) {
    return (
      <div className="home-layout">
        <header className="page-header">
          <h1>Home</h1>
          <p className="lede">Updates and threads on your projects.</p>
        </header>
        <div className="empty-feed">
          <h2>Nothing here yet</h2>
          <p>
            <Link href="/profile">Log in</Link> to see activity on projects you work on, or browse{" "}
            <Link href="/discover">Discover</Link>.
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase.from("projects").select("id, name, slug").eq("owner_id", member.id).is("removed_at", null),
    supabase
      .from("project_members")
      .select("project_id")
      .eq("profile_id", member.id)
      .eq("status", "active"),
  ]);
  const projects = new Map((owned ?? []).map((project) => [project.id, project]));
  const extraIds = [...new Set((memberships ?? []).map((row) => row.project_id))].filter((id) => !projects.has(id));
  if (extraIds.length > 0) {
    const { data: more } = await supabase
      .from("projects")
      .select("id, name, slug")
      .in("id", extraIds)
      .is("removed_at", null);
    for (const project of more ?? []) projects.set(project.id, project);
  }

  const projectIds = [...projects.keys()];
  const { data } = projectIds.length
    ? await supabase
        .from("posts")
        .select("id, title, content, type, project_id, author_id, created_at")
        .in("project_id", projectIds)
        .in("type", ["build_log", "idea"])
        .is("removed_at", null)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] };
  const posts = (data ?? []).filter((post) => post.project_id);
  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, username, display_name").in("id", authorIds)
    : { data: [] };
  const authorName = new Map((authors ?? []).map((author) => [author.id, author]));

  return (
    <div className="home-layout">
      <section aria-label="Your projects">
        <header className="page-header">
          <h1>Home</h1>
          <p className="lede">Updates and threads on your projects.</p>
        </header>
        {posts.length === 0 ? (
          <div className="empty-feed">
            <h2>No updates yet</h2>
            <p>
              Build logs and threads from projects you work on will show up here. Start one from{" "}
              <Link href="/build">Build</Link>.
            </p>
          </div>
        ) : (
          <ul className="repo-list" role="list">
            {posts.map((post) => {
              const project = post.project_id ? projects.get(post.project_id) : undefined;
              const author = authorName.get(post.author_id);
              const tab = post.type === "build_log" ? "commits" : "threads";
              return (
                <li key={post.id} className="repo-row">
                  <div className="repo-title">
                    <strong>
                      {project ? (
                        <Link href={`/build/${project.slug}?tab=${tab}`}>{post.title ?? "Update"}</Link>
                      ) : (
                        (post.title ?? "Update")
                      )}
                    </strong>
                    <span className="repo-visibility">{post.type === "build_log" ? "Update" : "Thread"}</span>
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
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
