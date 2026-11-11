import Link from "next/link";
import { ReelComposer } from "@/components/discover/ReelComposer";
import { PostActions } from "@/components/feed/PostActions";
import { FollowButton } from "@/components/profile/FollowButton";
import { isVideoUrl } from "@/lib/auth/images";
import { getMember } from "@/lib/auth/session";
import { emptyActivity, loadActivity } from "@/lib/feed/activity";
import { createClient } from "@/lib/supabase/server";

const views = [
  { id: "people", label: "People" },
  { id: "projects", label: "Projects" },
  { id: "ideas", label: "Ideas" },
  { id: "posts", label: "Posts" },
  { id: "reels", label: "Reels" },
] as const;

type View = (typeof views)[number]["id"];

export async function DiscoverFeed({ view }: { view: View }) {
  return (
    <div className="discover-feed">
      <nav className="repo-filters" aria-label="Discover">
        {views.slice(0, 3).map((item) => (
          <Link key={item.id} href={hrefFor(item.id)} aria-current={view === item.id ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      <nav className="repo-filters discover-format" aria-label="Feed format">
        {views.slice(3).map((item) => (
          <Link key={item.id} href={hrefFor(item.id)} aria-current={view === item.id ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      {view === "people" ? <PeopleList /> : null}
      {view === "projects" ? <ProjectList /> : null}
      {view === "ideas" ? <PostList kind="ideas" /> : null}
      {view === "posts" ? <PostList kind="posts" /> : null}
      {view === "reels" ? <ReelGrid /> : null}
    </div>
  );
}

export function discoverView(value: string | undefined): View {
  return views.some((item) => item.id === value) ? (value as View) : "posts";
}

function hrefFor(view: View) {
  return view === "posts" ? "/discover" : `/discover?view=${view}`;
}

async function PeopleList() {
  const supabase = await createClient();
  const member = await getMember();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, banner_url, education, city, state")
    .eq("onboarding_complete", true)
    .not("username", "is", null)
    .order("display_name")
    .limit(30);
  const people = (data ?? []).filter((person) => person.username);
  if (people.length === 0) return <p className="repo-empty">No public profiles yet.</p>;
  const ids = people.map((person) => person.id);
  const { data: followed } = member
    ? await supabase.from("follows").select("following_id").eq("follower_id", member.id).in("following_id", ids)
    : { data: [] };
  const following = new Set((followed ?? []).map((row) => row.following_id));
  const signedIn = Boolean(member?.onboardingComplete && !member.suspended && !member.deletedAt);
  return (
    <ul className="repo-list" role="list">
      {people.map((person) => {
        const place = [person.city, person.state].filter(Boolean).join(", ");
        const initial = person.display_name.trim().charAt(0).toUpperCase() || "?";
        const username = person.username as string;
        return (
          <li key={username} className="repo-row person-card">
            <Link href={`/people/${username}`}>
              <div className="profile-banner person-banner">
                {person.banner_url ? <img src={person.banner_url} alt="" /> : <div className="profile-banner-empty" />}
              </div>
              {person.avatar_url ? (
                <img className="profile-avatar person-avatar" src={person.avatar_url} alt="" />
              ) : (
                <span className="profile-avatar profile-avatar-fallback person-avatar" aria-hidden="true">
                  {initial}
                </span>
              )}
              <div className="person-body">
                <strong>{person.display_name}</strong>
                <p className="profile-meta">@{person.username}</p>
                {person.bio ? <p className="discover-copy">{person.bio}</p> : null}
                {person.education || place ? (
                  <p className="profile-meta">{[person.education, place].filter(Boolean).join(" · ")}</p>
                ) : null}
              </div>
            </Link>
            {member?.id === person.id ? null : (
              <div className="person-follow">
                <FollowButton username={username} following={following.has(person.id)} signedIn={signedIn} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function firstImage(urls: string[] | null | undefined) {
  return (urls ?? []).find((url) => url && !isVideoUrl(url));
}

async function ProjectList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, slug, description, category, cover_image_url")
    .eq("visibility", "public")
    .is("removed_at", null)
    .order("updated_at", { ascending: false })
    .limit(30);
  const projects = data ?? [];
  if (projects.length === 0) return <p className="repo-empty">No public projects yet.</p>;
  const ids = projects.map((project) => project.id);
  const { data: mediaPosts } = await supabase
    .from("posts")
    .select("project_id, media_urls, created_at")
    .in("project_id", ids)
    .eq("visibility", "public")
    .is("removed_at", null)
    .order("created_at", { ascending: false });
  const photoByProject = new Map<string, string>();
  for (const post of mediaPosts ?? []) {
    if (!post.project_id || photoByProject.has(post.project_id)) continue;
    const image = firstImage(post.media_urls);
    if (image) photoByProject.set(post.project_id, image);
  }
  return (
    <ul className="repo-list" role="list">
      {projects.map((project) => {
        const photo = firstImage(project.cover_image_url ? [project.cover_image_url] : []) ?? photoByProject.get(project.id);
        return (
          <li key={project.id} className="repo-row media-card">
            {photo ? <img className="discover-photo" src={photo} alt="" /> : null}
            <div className="card-body">
              <div className="repo-title">
                <Link href={`/forge/${project.slug}`}>{project.name}</Link>
                <span className="repo-visibility">{project.category}</span>
              </div>
              <p>{project.description}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

async function loadPosts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, content, type, media_urls, author_id, created_at")
    .eq("visibility", "public")
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(40);
  const posts = data ?? [];
  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, username, display_name").in("id", authorIds)
    : { data: [] };
  const names = new Map((authors ?? []).map((author) => [author.id, author]));
  return posts.map((post) => ({ ...post, author: names.get(post.author_id) }));
}

async function PostList({ kind }: { kind: "posts" | "ideas" }) {
  const member = await getMember();
  const posts = (await loadPosts()).filter((post) => (kind === "ideas" ? post.type === "idea" : true));
  if (posts.length === 0) {
    return <p className="repo-empty">{kind === "ideas" ? "No ideas yet." : "No posts yet."}</p>;
  }
  const supabase = await createClient();
  const activity = await loadActivity(
    supabase,
    posts.map((post) => post.id),
    member?.id ?? null,
  );
  const signedIn = Boolean(member?.onboardingComplete);
  return (
    <ul className="repo-list" role="list">
      {posts.map((post) => (
        <li key={post.id} className="repo-row">
          <div className="repo-title">
            <strong>
              <Link href={`/posts/${post.id}`}>{post.title ?? "Post"}</Link>
            </strong>
            <span className="repo-visibility">{post.type.replace("_", " ")}</span>
          </div>
          <p className="discover-copy">{post.content}</p>
          {kind === "ideas" ? (
            <div className="idea-photos">
              {(post.media_urls ?? []).filter((url) => url && !isVideoUrl(url)).slice(0, 4).map((url) => (
                <img key={url} src={url} alt="" />
              ))}
            </div>
          ) : null}
          {post.author?.username ? (
            <p className="profile-meta">
              <Link href={`/people/${post.author.username}`}>{post.author.display_name}</Link>
            </p>
          ) : null}
          <PostActions postId={post.id} activity={activity.get(post.id) ?? emptyActivity()} signedIn={signedIn} />
        </li>
      ))}
    </ul>
  );
}

async function ReelGrid() {
  const member = await getMember();
  const posts = (await loadPosts()).filter((post) => post.media_urls.length > 0);
  const supabase = await createClient();
  const activity = await loadActivity(
    supabase,
    posts.map((post) => post.id),
    member?.id ?? null,
  );
  const signedIn = Boolean(member?.onboardingComplete);
  return (
    <>
      {member?.onboardingComplete ? (
        <ReelComposer />
      ) : (
        <p className="form-note">
          <Link href="/profile?next=/discover?view=reels">Log in</Link> to post a photo or a reel.
        </p>
      )}
      {posts.length === 0 ? <p className="repo-empty">No photos or reels yet.</p> : null}
      <ul className="reel-grid" role="list">
        {posts.map((post) => {
          const media = post.media_urls[0];
          if (!media) return null;
          const label = post.title ?? post.author?.display_name ?? "Post";
          return (
            <li key={post.id} className="reel-card">
              {isVideoUrl(media) ? (
                <video src={media} controls playsInline preload="metadata" />
              ) : (
                <img src={media} alt={label} />
              )}
              <p>{label}</p>
              <PostActions postId={post.id} activity={activity.get(post.id) ?? emptyActivity()} signedIn={signedIn} />
            </li>
          );
        })}
      </ul>
    </>
  );
}
