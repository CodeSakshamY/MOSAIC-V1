import { createClient } from "@/lib/supabase/server";
import { hiddenPostIds } from "@/lib/safety/hidden";
import { rankFeed, type FeedCandidate } from "@/lib/feed/ranking";

export type HomeTab = "projects" | "following" | "for-you" | "nearby";

export type HomeItem = {
  id: string;
  title: string;
  content: string;
  label: string;
  href: string;
  authorName: string;
  authorUsername: string | null;
  projectName: string | null;
  projectSlug: string | null;
  reason: string | null;
};

export type HomeFeedResult = {
  items: HomeItem[];
  empty: string;
  note: string | null;
  nextCursor: string | null;
};

const pageSize = 15;
const forYouWindow = 120;

type PostRow = {
  id: string;
  title: string | null;
  content: string;
  type: string;
  project_id: string | null;
  author_id: string;
  created_at: string;
  media_urls: string[];
};

export function parseHomeTab(value: string | undefined): HomeTab {
  if (value === "following" || value === "for-you" || value === "nearby" || value === "projects") return value;
  return "projects";
}

export function parseCursor(value: string | undefined) {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

export async function loadPublicProjects(): Promise<HomeItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, slug, description, created_at")
    .eq("visibility", "public")
    .eq("is_demo", false)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(8);
  return (data ?? []).map((project) => ({
    id: project.id,
    title: project.name,
    content: project.description,
    label: "Project",
    href: `/forge/${project.slug}`,
    authorName: "Builder",
    authorUsername: null,
    projectName: project.name,
    projectSlug: project.slug,
    reason: null,
  }));
}

export async function loadHome(memberId: string, tab: HomeTab, cursor: string | null): Promise<HomeFeedResult> {
  if (tab === "projects") return loadProjectUpdates(memberId, cursor);
  if (tab === "following") return loadFollowing(memberId, cursor);
  if (tab === "nearby") return loadNearby(memberId, cursor);
  return loadForYou(memberId, cursor);
}

async function loadProjectUpdates(memberId: string, cursor: string | null): Promise<HomeFeedResult> {
  const supabase = await createClient();
  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase.from("projects").select("id, name, slug").eq("owner_id", memberId).is("removed_at", null),
    supabase.from("project_members").select("project_id").eq("profile_id", memberId).eq("status", "active"),
  ]);
  const projects = new Map((owned ?? []).map((project) => [project.id, project]));
  const extraIds = [...new Set((memberships ?? []).map((row) => row.project_id))].filter((id) => !projects.has(id));
  if (extraIds.length > 0) {
    const { data: more } = await supabase.from("projects").select("id, name, slug").in("id", extraIds).is("removed_at", null);
    for (const project of more ?? []) projects.set(project.id, project);
  }
  const projectIds = [...projects.keys()];
  const { data } = projectIds.length
    ? await (() => {
        let query = supabase
          .from("posts")
          .select("id, title, content, type, project_id, author_id, created_at, media_urls")
          .in("project_id", projectIds)
          .in("type", ["build_log", "idea"])
          .is("removed_at", null)
          .order("created_at", { ascending: false })
          .limit(pageSize + 1);
        if (cursor) query = query.lt("created_at", cursor);
        return query;
      })()
    : { data: [] as PostRow[] };
  const posts = (data ?? []).filter((post) => post.project_id);
  const visible = await omitHidden(memberId, posts);
  const page = visible.slice(0, pageSize);
  const last = page.at(-1);
  const names = await authorNames(page.map((post) => post.author_id));
  return {
    items: page.map((post) => {
      const project = post.project_id ? projects.get(post.project_id) : undefined;
      const author = names.get(post.author_id);
      const tab = post.type === "build_log" ? "commits" : "threads";
      return {
        id: post.id,
        title: post.title ?? "Update",
        content: post.content,
        label: post.type === "build_log" ? "Update" : "Thread",
        href: project ? `/forge/${project.slug}?tab=${tab}` : `/posts/${post.id}`,
        authorName: author?.display_name ?? "Builder",
        authorUsername: author?.username ?? null,
        projectName: project?.name ?? null,
        projectSlug: project?.slug ?? null,
        reason: null,
      };
    }),
    empty: "Build logs and threads from projects you work on will show up here.",
    note: null,
    nextCursor: visible.length > pageSize && last ? last.created_at : null,
  };
}

async function loadFollowing(memberId: string, cursor: string | null): Promise<HomeFeedResult> {
  const supabase = await createClient();
  const [{ data: follows }, { data: projectFollows }] = await Promise.all([
    supabase.from("follows").select("following_id").eq("follower_id", memberId),
    supabase.from("project_follows").select("project_id").eq("profile_id", memberId),
  ]);
  const ids = (follows ?? []).map((row) => row.following_id);
  const projectIds = (projectFollows ?? []).map((row) => row.project_id);
  if (ids.length === 0 && projectIds.length === 0) {
    return { items: [], empty: "Follow builders or projects and their posts will show here.", note: null, nextCursor: null };
  }
  const blocked = await blockedIds(memberId);
  const posts = await publicPosts({
    authorIds: ids.filter((id) => !blocked.has(id)),
    projectIds,
    cursor,
    limit: pageSize + 1,
  });
  const visible = await omitHidden(
    memberId,
    posts.filter((post) => !blocked.has(post.author_id)),
  );
  return await listed(visible, "No public posts from people or projects you follow yet.");
}

async function loadNearby(memberId: string, cursor: string | null): Promise<HomeFeedResult> {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("city, state").eq("id", memberId).maybeSingle();
  const city = profile?.city?.trim() ?? "";
  const state = profile?.state?.trim() ?? "";
  if (!city && !state) {
    return {
      items: [],
      empty: "Add a city or state on your profile to see posts from nearby.",
      note: null,
      nextCursor: null,
    };
  }
  const blocked = await blockedIds(memberId);
  const cityAuthors = city ? await authorsIn("city", city, memberId, blocked) : [];
  const cityPosts = cityAuthors.length
    ? await omitHidden(memberId, await publicPosts({ authorIds: cityAuthors, cursor, limit: pageSize + 1 }))
    : [];
  if (cityPosts.length > 0 || !state || cursor) {
    return await listed(cityPosts, "No public posts from your city yet.");
  }
  const stateAuthors = await authorsIn("state", state, memberId, blocked);
  const statePosts = stateAuthors.length
    ? await omitHidden(memberId, await publicPosts({ authorIds: stateAuthors, cursor, limit: pageSize + 1 }))
    : [];
  const result = await listed(statePosts, "No public posts from your state yet.");
  if (city) result.note = "Showing your state, because nothing new is from your city.";
  return result;
}

async function loadForYou(memberId: string, cursor: string | null): Promise<HomeFeedResult> {
  const supabase = await createClient();
  const [{ data: profile }, { data: skillRows }, { data: interestRows }, { data: follows }] = await Promise.all([
    supabase.from("profiles").select("city, state, looking_for").eq("id", memberId).maybeSingle(),
    supabase.from("profile_skills").select("skill_id").eq("profile_id", memberId),
    supabase.from("profile_interests").select("interest_id").eq("profile_id", memberId),
    supabase.from("follows").select("following_id").eq("follower_id", memberId),
  ]);
  const viewerSkills = new Set((skillRows ?? []).map((row) => row.skill_id));
  const viewerInterests = new Set((interestRows ?? []).map((row) => row.interest_id));
  const followed = new Set((follows ?? []).map((row) => row.following_id));
  const blocked = await blockedIds(memberId);
  const coldStart = viewerSkills.size === 0 && viewerInterests.size === 0;
  const looking = new Set(profile?.looking_for ?? []);
  const wantsTeam = looking.has("contribute") || looking.has("teammates");

  let query = supabase
    .from("posts")
    .select("id, title, content, type, project_id, author_id, created_at, media_urls")
    .eq("visibility", "public")
    .eq("is_demo", false)
    .is("removed_at", null)
    .neq("author_id", memberId)
    .order("created_at", { ascending: false })
    .limit(forYouWindow);
  if (cursor) query = query.lt("created_at", cursor);
  const { data } = await query;
  const fetched = (data ?? []).filter((post) => !blocked.has(post.author_id));
  const posts = await omitHidden(memberId, fetched);
  if (posts.length === 0) {
    return {
      items: [],
      empty: "No public posts to show yet.",
      note: null,
      nextCursor: fetched.length === forYouWindow ? (fetched.at(-1)?.created_at ?? null) : null,
    };
  }

  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const projectIds = [...new Set(posts.flatMap((post) => (post.project_id ? [post.project_id] : [])))];
  const postIds = posts.map((post) => post.id);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: authors }, { data: authorInterests }, { data: projectSkills }, { data: covers }, { data: events }, { data: reactions }, { data: watched }] =
    await Promise.all([
      supabase.from("profiles").select("id, username, display_name, city, state").in("id", authorIds),
      supabase.from("profile_interests").select("profile_id, interest_id").in("profile_id", authorIds),
      projectIds.length
        ? supabase.from("project_skills").select("project_id, skill_id, relation").in("project_id", projectIds)
        : Promise.resolve({ data: [] as { project_id: string; skill_id: string; relation: string }[] }),
      projectIds.length
        ? supabase.from("projects").select("id, name, slug, cover_image_url").in("id", projectIds)
        : Promise.resolve({ data: [] as { id: string; name: string; slug: string; cover_image_url: string | null }[] }),
      supabase
        .from("feed_events")
        .select("post_id, event_type, created_at")
        .eq("user_id", memberId)
        .in("post_id", postIds),
      supabase.from("reactions").select("post_id").eq("user_id", memberId).in("post_id", postIds),
      projectIds.length
        ? supabase.from("project_follows").select("project_id").eq("profile_id", memberId).in("project_id", projectIds)
        : Promise.resolve({ data: [] as { project_id: string }[] }),
    ]);

  const authorById = new Map((authors ?? []).map((author) => [author.id, author]));
  const interestsByAuthor = group(authorInterests ?? [], (row) => row.profile_id, (row) => row.interest_id);
  const usesByProject = group(
    (projectSkills ?? []).filter((row) => row.relation === "uses"),
    (row) => row.project_id,
    (row) => row.skill_id,
  );
  const seekingByProject = group(
    (projectSkills ?? []).filter((row) => row.relation === "seeking"),
    (row) => row.project_id,
    (row) => row.skill_id,
  );
  const projectById = new Map((covers ?? []).map((project) => [project.id, project]));
  const dismissed = new Set((events ?? []).filter((event) => event.event_type === "dismiss").map((event) => event.post_id));
  const seen = new Set(
    (events ?? [])
      .filter((event) => event.event_type === "impression" && event.created_at >= since)
      .map((event) => event.post_id),
  );
  const reacted = new Set((reactions ?? []).map((row) => row.post_id));
  const watchedProjects = new Set((watched ?? []).map((row) => row.project_id));
  const viewerCity = place(profile?.city ?? null);
  const viewerState = place(profile?.state ?? null);

  const candidates: FeedCandidate[] = posts.map((post) => {
    const author = authorById.get(post.author_id);
    const project = post.project_id ? projectById.get(post.project_id) : undefined;
    const sameCity = viewerCity.length > 0 && place(author?.city ?? null) === viewerCity;
    const sameState = viewerState.length > 0 && place(author?.state ?? null) === viewerState;
    const seeking = post.project_id ? (seekingByProject.get(post.project_id) ?? []) : [];
    return {
      id: post.id,
      authorId: post.author_id,
      createdAt: post.created_at,
      contentLength: post.content.length,
      hasCover: post.media_urls.length > 0 || Boolean(project?.cover_image_url),
      interestOverlap: overlap(viewerInterests, new Set(interestsByAuthor.get(post.author_id) ?? [])),
      skillOverlap: overlap(viewerSkills, new Set(post.project_id ? (usesByProject.get(post.project_id) ?? []) : [])),
      followsAuthor: followed.has(post.author_id),
      followsProject: post.project_id ? watchedProjects.has(post.project_id) : false,
      sameCity,
      sameState,
      seekingMatch: wantsTeam && seeking.some((skill) => viewerSkills.has(skill)),
      dismissed: dismissed.has(post.id),
      seenRecently: seen.has(post.id),
      reacted: reacted.has(post.id),
    };
  });

  const ranked = rankFeed(candidates, { now: new Date(), coldStart });
  const postById = new Map(posts.map((post) => [post.id, post]));
  const items = ranked.flatMap((item) => {
    const post = postById.get(item.id);
    if (!post) return [];
    const author = authorById.get(post.author_id);
    const project = post.project_id ? projectById.get(post.project_id) : undefined;
    return [
      {
        id: post.id,
        title: post.title ?? labelFor(post.type),
        content: post.content,
        label: labelFor(post.type),
        href: `/posts/${post.id}`,
        authorName: author?.display_name ?? "Builder",
        authorUsername: author?.username ?? null,
        projectName: project?.name ?? null,
        projectSlug: project?.slug ?? null,
        reason: item.reason,
      },
    ];
  });
  await rememberImpressions(
    memberId,
    items.map((item) => item.id),
  );
  const oldest = fetched.at(-1)?.created_at ?? null;
  return {
    items,
    empty: "No public posts to show yet.",
    note: null,
    nextCursor: fetched.length === forYouWindow ? oldest : null,
  };
}

async function publicPosts(input: { authorIds?: string[]; projectIds?: string[]; cursor: string | null; limit: number }) {
  const authorIds = input.authorIds ?? [];
  const projectIds = input.projectIds ?? [];
  if (authorIds.length === 0 && projectIds.length === 0) return [];
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select("id, title, content, type, project_id, author_id, created_at, media_urls")
    .eq("visibility", "public")
    .eq("is_demo", false)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(input.limit);
  if (authorIds.length > 0 && projectIds.length > 0) {
    query = query.or(`author_id.in.(${authorIds.join(",")}),project_id.in.(${projectIds.join(",")})`);
  } else if (authorIds.length > 0) {
    query = query.in("author_id", authorIds);
  } else {
    query = query.in("project_id", projectIds);
  }
  if (input.cursor) query = query.lt("created_at", input.cursor);
  const { data } = await query;
  return data ?? [];
}

async function listed(posts: PostRow[], empty: string): Promise<HomeFeedResult> {
  const page = posts.slice(0, pageSize);
  const last = page.at(-1);
  const names = await authorNames(page.map((post) => post.author_id));
  const projectIds = [...new Set(page.flatMap((post) => (post.project_id ? [post.project_id] : [])))];
  const projects = await projectNames(projectIds);
  return {
    items: page.map((post) => {
      const author = names.get(post.author_id);
      const project = post.project_id ? projects.get(post.project_id) : undefined;
      return {
        id: post.id,
        title: post.title ?? labelFor(post.type),
        content: post.content,
        label: labelFor(post.type),
        href: `/posts/${post.id}`,
        authorName: author?.display_name ?? "Builder",
        authorUsername: author?.username ?? null,
        projectName: project?.name ?? null,
        projectSlug: project?.slug ?? null,
        reason: null,
      };
    }),
    empty,
    note: null,
    nextCursor: posts.length > pageSize && last ? last.created_at : null,
  };
}

async function authorsIn(column: "city" | "state", value: string, memberId: string, blocked: Set<string>) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .ilike(column, value.replaceAll("%", "").replaceAll("_", ""))
    .neq("id", memberId)
    .is("deleted_at", null)
    .limit(80);
  return (data ?? []).map((row) => row.id).filter((id) => !blocked.has(id));
}

async function blockedIds(memberId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", memberId);
  return new Set((data ?? []).map((row) => row.blocked_id));
}

async function authorNames(ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map<string, { display_name: string; username: string | null }>();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, username, display_name").in("id", unique);
  return new Map((data ?? []).map((author) => [author.id, author]));
}

async function projectNames(ids: string[]) {
  if (ids.length === 0) return new Map<string, { name: string; slug: string }>();
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id, name, slug").in("id", ids);
  return new Map((data ?? []).map((project) => [project.id, project]));
}

async function rememberImpressions(memberId: string, postIds: string[]) {
  if (postIds.length === 0) return;
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from("feed_events")
    .select("post_id")
    .eq("user_id", memberId)
    .eq("event_type", "impression")
    .gte("created_at", since)
    .in("post_id", postIds);
  const seen = new Set((existing ?? []).map((row) => row.post_id));
  const missing = postIds.filter((id) => !seen.has(id));
  if (missing.length === 0) return;
  await supabase.from("feed_events").insert(
    missing.map((postId) => ({ user_id: memberId, post_id: postId, event_type: "impression" as const })),
  );
}

function labelFor(type: string) {
  if (type === "build_log") return "Update";
  if (type === "idea") return "Thread";
  if (type === "help") return "Question";
  if (type === "achievement") return "Achievement";
  if (type === "project") return "Project";
  return "Post";
}

function place(value: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

async function omitHidden<T extends { id: string }>(userId: string, posts: T[]) {
  const hidden = await hiddenPostIds(
    userId,
    posts.map((post) => post.id),
  );
  return posts.filter((post) => !hidden.has(post.id));
}

function overlap(viewer: Set<string>, other: Set<string>) {
  if (viewer.size === 0) return 0;
  let shared = 0;
  for (const id of viewer) if (other.has(id)) shared += 1;
  return shared / viewer.size;
}

function group<T>(rows: T[], key: (row: T) => string, value: (row: T) => string) {
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const bucket = grouped.get(key(row)) ?? [];
    bucket.push(value(row));
    grouped.set(key(row), bucket);
  }
  return grouped;
}
