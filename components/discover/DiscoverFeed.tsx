import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { ReelComposer } from "@/components/discover/ReelComposer";
import { PostActions } from "@/components/feed/PostActions";
import { FollowButton } from "@/components/profile/FollowButton";
import { isVideoUrl } from "@/lib/auth/images";
import { getMember } from "@/lib/auth/session";
import { type DiscoverFilters, peopleFilterActive, readDiscoverFilters } from "@/lib/discover/filters";
import { emptyActivity, loadActivity } from "@/lib/feed/activity";
import { ageGroups } from "@/lib/profile/age-groups";
import { projectCategories, type ProjectCategory } from "@/lib/projects/slug";
import { createClient } from "@/lib/supabase/server";

const views = [
  { id: "people", label: "People" },
  { id: "projects", label: "Projects" },
  { id: "ideas", label: "Ideas" },
  { id: "posts", label: "Posts" },
  { id: "reels", label: "Reels" },
] as const;

type View = (typeof views)[number]["id"];

export async function DiscoverFeed({ view, filters }: { view: View; filters: DiscoverFilters }) {
  return (
    <div className="discover-feed">
      <nav className="repo-filters" aria-label="Discover">
        {views.slice(0, 3).map((item) => (
          <Link key={item.id} href={hrefFor(item.id, filters)} aria-current={view === item.id ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      <nav className="repo-filters discover-format" aria-label="Feed format">
        {views.slice(3).map((item) => (
          <Link key={item.id} href={hrefFor(item.id, filters)} aria-current={view === item.id ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="discover-tools">
        {view === "people" || view === "projects" ? <DiscoverSearch view={view} filters={filters} /> : null}
        {view === "people" ? <PeopleFilters filters={filters} /> : <TypeFilters view={view} filters={filters} />}
      </div>
      {view === "people" ? <PeopleList filters={filters} /> : null}
      {view === "projects" ? <ProjectList filters={filters} /> : null}
      {view === "ideas" ? <PostList kind="ideas" filters={filters} /> : null}
      {view === "posts" ? <PostList kind="posts" filters={filters} /> : null}
      {view === "reels" ? <ReelGrid filters={filters} /> : null}
    </div>
  );
}

export function discoverView(value: string | undefined): View {
  return views.some((item) => item.id === value) ? (value as View) : "posts";
}

export { readDiscoverFilters };

function hrefFor(view: View, filters: DiscoverFilters, type: ProjectCategory | null = filters.type) {
  const params = new URLSearchParams();
  if (view !== "posts") params.set("view", view);
  if ((view === "people" || view === "projects") && filters.q) params.set("q", filters.q);
  if (view === "people") {
    if (filters.age) params.set("age", filters.age);
    if (filters.place) params.set("place", filters.place);
    if (filters.skill) params.set("skill", filters.skill);
  } else if (type) {
    params.set("type", type);
  }
  const query = params.toString();
  return query ? `/discover?${query}` : "/discover";
}

async function PeopleList({ filters }: { filters: DiscoverFilters }) {
  const supabase = await createClient();
  const member = await getMember();
  let query = supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, banner_url, education, city, state, age_group")
    .eq("onboarding_complete", true)
    .not("username", "is", null)
    .order("display_name")
    .limit(30);
  if (filters.age) query = query.eq("age_group", filters.age);
  if (filters.place) {
    const place = filters.place;
    query = query.or(`city.ilike.%${place}%,state.ilike.%${place}%,education.ilike.%${place}%`);
  }
  if (filters.q) query = query.or(`display_name.ilike.%${filters.q}%,username.ilike.%${filters.q}%`);
  if (filters.skill) {
    const { data: skill } = await supabase.from("skills").select("id").eq("slug", filters.skill).maybeSingle();
    const { data: links } = skill
      ? await supabase.from("profile_skills").select("profile_id").eq("skill_id", skill.id)
      : { data: [] };
    const ids = (links ?? []).map((row) => row.profile_id);
    if (ids.length === 0) {
      return <p className="repo-empty">No people match that filter.</p>;
    }
    query = query.in("id", ids);
  }
  const { data } = await query;
  const people = (data ?? []).filter((person) => person.username);
  if (people.length === 0) {
    return <p className="repo-empty">{peopleFilterActive(filters) ? "No people match that filter." : filters.q ? "No people match that search." : "No public profiles yet."}</p>;
  }
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
                {person.education || place || person.age_group ? (
                  <p className="profile-meta">
                    {[ageGroups.find((group) => group.value === person.age_group)?.label, person.education, place]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
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

async function ProjectList({ filters }: { filters: DiscoverFilters }) {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("id, name, slug, description, category, cover_image_url")
    .eq("visibility", "public")
    .is("removed_at", null)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (filters.type) query = query.eq("category", filters.type);
  if (filters.q) query = query.or(`name.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
  const { data } = await query;
  const projects = data ?? [];
  if (projects.length === 0) {
    return (
      <p className="repo-empty">
        {filters.type ? "No projects match that filter." : filters.q ? "No projects match that search." : "No public projects yet."}
      </p>
    );
  }
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

async function loadPosts(type: ProjectCategory | null) {
  const supabase = await createClient();
  let projectIds: string[] | null = null;
  if (type) {
    const { data: typed } = await supabase
      .from("projects")
      .select("id")
      .eq("category", type)
      .eq("visibility", "public")
      .is("removed_at", null);
    projectIds = (typed ?? []).map((project) => project.id);
    if (projectIds.length === 0) return [];
  }
  let query = supabase
    .from("posts")
    .select("id, title, content, type, media_urls, author_id, created_at")
    .eq("visibility", "public")
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(40);
  if (projectIds) query = query.in("project_id", projectIds);
  const { data } = await query;
  const posts = data ?? [];
  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, username, display_name").in("id", authorIds)
    : { data: [] };
  const names = new Map((authors ?? []).map((author) => [author.id, author]));
  return posts.map((post) => ({ ...post, author: names.get(post.author_id) }));
}

async function PostList({ kind, filters }: { kind: "posts" | "ideas"; filters: DiscoverFilters }) {
  const member = await getMember();
  const posts = (await loadPosts(filters.type)).filter((post) => (kind === "ideas" ? post.type === "idea" : true));
  if (posts.length === 0) {
    const filtered = Boolean(filters.type);
    return (
      <p className="repo-empty">
        {kind === "ideas"
          ? filtered
            ? "No ideas match that filter."
            : "No ideas yet."
          : filtered
            ? "No posts match that filter."
            : "No posts yet."}
      </p>
    );
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

async function ReelGrid({ filters }: { filters: DiscoverFilters }) {
  const member = await getMember();
  const posts = (await loadPosts(filters.type)).filter((post) => post.media_urls.length > 0);
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
      {posts.length === 0 ? (
        <p className="repo-empty">{filters.type ? "No photos or reels match that filter." : "No photos or reels yet."}</p>
      ) : null}
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

function DiscoverSearch({ view, filters }: { view: "people" | "projects"; filters: DiscoverFilters }) {
  return (
    <form className="repo-search discover-search" action="/discover">
      <input type="hidden" name="view" value={view} />
      {filters.age ? <input type="hidden" name="age" value={filters.age} /> : null}
      {filters.place ? <input type="hidden" name="place" value={filters.place} /> : null}
      {filters.skill ? <input type="hidden" name="skill" value={filters.skill} /> : null}
      {filters.type ? <input type="hidden" name="type" value={filters.type} /> : null}
      <label htmlFor="discover-search">Search</label>
      <input
        id="discover-search"
        name="q"
        defaultValue={filters.q}
        placeholder={view === "people" ? "Name or username" : "Project name"}
        maxLength={80}
        className="repo-search-input"
      />
    </form>
  );
}

async function PeopleFilters({ filters }: { filters: DiscoverFilters }) {
  const supabase = await createClient();
  const { data } = await supabase.from("skills").select("slug, name").order("name");
  const skills = data ?? [];
  const active = Number(Boolean(filters.age)) + Number(Boolean(filters.place)) + Number(Boolean(filters.skill));
  return (
    <FilterMenu active={active}>
    <form className="discover-filters" action="/discover">
      <input type="hidden" name="view" value="people" />
      <div className="field">
        <label htmlFor="discover-age">Age band</label>
        <select id="discover-age" name="age" className="field-select" defaultValue={filters.age ?? ""}>
          <option value="">Any</option>
          {ageGroups.map((group) => (
            <option key={group.value} value={group.value}>
              {group.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="discover-place">Location</label>
        <input
          id="discover-place"
          name="place"
          className="repo-search-input"
          defaultValue={filters.place}
          placeholder="City, state, or school"
          maxLength={80}
        />
      </div>
      <div className="field">
        <label htmlFor="discover-skill">Skill</label>
        <select id="discover-skill" name="skill" className="field-select" defaultValue={filters.skill}>
          <option value="">Any</option>
          {skills.map((skill) => (
            <option key={skill.slug} value={skill.slug}>
              {skill.name}
            </option>
          ))}
        </select>
      </div>
      <button className="text-button" type="submit">
        Apply
      </button>
      {peopleFilterActive(filters) ? (
        <Link className="text-button" href="/discover?view=people">
          Clear
        </Link>
      ) : null}
    </form>
    </FilterMenu>
  );
}

function TypeFilters({ view, filters }: { view: View; filters: DiscoverFilters }) {
  return (
    <FilterMenu active={filters.type ? 1 : 0}>
    <nav className="repo-filters type-filters" aria-label="Project type">
      <Link href={hrefFor(view, filters, null)} aria-current={filters.type ? undefined : "page"}>
        All types
      </Link>
      {projectCategories.map((category) => (
        <Link
          key={category}
          href={hrefFor(view, filters, category)}
          aria-current={filters.type === category ? "page" : undefined}
        >
          {category}
        </Link>
      ))}
    </nav>
    </FilterMenu>
  );
}

function FilterMenu({ active, children }: { active: number; children: ReactNode }) {
  return (
    <details className="filter-menu">
      <summary>
        <span>Filters</span>
        {active > 0 ? <span className="filter-count">{active}</span> : null}
        <ChevronDown aria-hidden="true" />
      </summary>
      <div className="filter-panel">{children}</div>
    </details>
  );
}
