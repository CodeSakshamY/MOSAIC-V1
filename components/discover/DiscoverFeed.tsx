import Link from "next/link";
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
  const { data } = await supabase
    .from("profiles")
    .select("username, display_name, education, city, state")
    .eq("onboarding_complete", true)
    .not("username", "is", null)
    .order("display_name")
    .limit(30);
  const people = (data ?? []).filter((person) => person.username);
  if (people.length === 0) return <p className="repo-empty">No public profiles yet.</p>;
  return (
    <ul className="repo-list" role="list">
      {people.map((person) => {
        const place = [person.city, person.state].filter(Boolean).join(", ");
        return (
          <li key={person.username} className="repo-row">
            <div className="repo-title">
              <Link href={`/people/${person.username}`}>{person.display_name}</Link>
            </div>
            {person.education ? <p>{person.education}</p> : null}
            {place ? <p className="profile-meta">{place}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

async function ProjectList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, slug, description, category")
    .eq("visibility", "public")
    .is("removed_at", null)
    .order("updated_at", { ascending: false })
    .limit(30);
  const projects = data ?? [];
  if (projects.length === 0) return <p className="repo-empty">No public projects yet.</p>;
  return (
    <ul className="repo-list" role="list">
      {projects.map((project) => (
        <li key={project.id} className="repo-row">
          <div className="repo-title">
            <Link href={`/build/${project.slug}`}>{project.name}</Link>
            <span className="repo-visibility">{project.category}</span>
          </div>
          <p>{project.description}</p>
        </li>
      ))}
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
  const posts = (await loadPosts()).filter((post) => (kind === "ideas" ? post.type === "idea" : true));
  if (posts.length === 0) {
    return <p className="repo-empty">{kind === "ideas" ? "No ideas yet." : "No posts yet."}</p>;
  }
  return (
    <ul className="repo-list" role="list">
      {posts.map((post) => (
        <li key={post.id} className="repo-row">
          <div className="repo-title">
            <strong>{post.title ?? "Post"}</strong>
            <span className="repo-visibility">{post.type.replace("_", " ")}</span>
          </div>
          <p className="discover-copy">{post.content}</p>
          {post.author?.username ? (
            <p className="profile-meta">
              <Link href={`/people/${post.author.username}`}>{post.author.display_name}</Link>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

async function ReelGrid() {
  const posts = (await loadPosts()).filter((post) => post.media_urls.length > 0);
  if (posts.length === 0) return <p className="repo-empty">No photo posts yet.</p>;
  return (
    <ul className="reel-grid" role="list">
      {posts.map((post) => {
        const image = post.media_urls[0];
        if (!image) return null;
        return (
          <li key={post.id} className="reel-card">
            <img src={image} alt={post.title ?? "Photo post"} />
            <p>{post.title ?? post.author?.display_name ?? "Photo"}</p>
          </li>
        );
      })}
    </ul>
  );
}
