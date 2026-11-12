import Link from "next/link";
import { FeedPostForm } from "@/components/discover/FeedPostForm";
import { ReelComposer } from "@/components/discover/ReelComposer";
import { FilterMenu } from "@/components/filters/FilterMenu";
import { PostActions } from "@/components/feed/PostActions";
import { createCollection } from "@/lib/collections/actions";
import { FoundingTeams } from "@/components/profile/FoundingTeams";
import { RelatedProjectPeople } from "@/components/profile/RelatedProjectPeople";
import { ResearchCollaborators } from "@/components/profile/ResearchCollaborators";
import { SharedPeople } from "@/components/profile/SharedPeople";
import { FollowButton } from "@/components/profile/FollowButton";
import { ProjectFollowButton } from "@/components/projects/ProjectFollowButton";
import { isVideoUrl } from "@/lib/auth/images";
import { lookingForOptions } from "@/lib/auth/looking-for";
import { getMember } from "@/lib/auth/session";
import { type DiscoverFilters, interestCategories, peopleFilterActive, readDiscoverFilters } from "@/lib/discover/filters";
import { emptyActivity, loadActivity } from "@/lib/feed/activity";
import { hiddenPostIds } from "@/lib/safety/hidden";
import { ageGroups } from "@/lib/profile/age-groups";
import { collaborationPreferences } from "@/lib/profile/collaboration";
import { projectCategories, projectStatuses, type ProjectCategory } from "@/lib/projects/slug";
import { createClient } from "@/lib/supabase/server";

const views = [
  { id: "people", label: "People" },
  { id: "projects", label: "Projects" },
  { id: "ideas", label: "Ideas" },
  { id: "research", label: "Research" },
  { id: "posts", label: "Posts" },
  { id: "reels", label: "Reels" },
  { id: "experiments", label: "Experiments" },
  { id: "communities", label: "Communities" },
  { id: "opportunities", label: "Opportunities" },
  { id: "events", label: "Events" },
  { id: "competitions", label: "Competitions" },
  { id: "hackathons", label: "Hackathons" },
  { id: "opensource", label: "Open source" },
  { id: "technologies", label: "Technologies" },
  { id: "everything", label: "Search" },
  { id: "collections", label: "Collections" },
  { id: "picks", label: "Editor's picks" },
  { id: "emerging", label: "New" },
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
        <Link href={hrefFor("research", filters)} aria-current={view === "research" ? "page" : undefined}>
          Research
        </Link>
        <Link href={hrefFor("experiments", filters)} aria-current={view === "experiments" ? "page" : undefined}>
          Experiments
        </Link>
        <Link href={hrefFor("communities", filters)} aria-current={view === "communities" ? "page" : undefined}>
          Communities
        </Link>
        <Link href={hrefFor("opportunities", filters)} aria-current={view === "opportunities" ? "page" : undefined}>
          Opportunities
        </Link>
        <Link href={hrefFor("events", filters)} aria-current={view === "events" ? "page" : undefined}>
          Events
        </Link>
        <Link href={hrefFor("competitions", filters)} aria-current={view === "competitions" ? "page" : undefined}>
          Competitions
        </Link>
        <Link href={hrefFor("hackathons", filters)} aria-current={view === "hackathons" ? "page" : undefined}>
          Hackathons
        </Link>
        <Link href={hrefFor("opensource", filters)} aria-current={view === "opensource" ? "page" : undefined}>
          Open source
        </Link>
        <Link href={hrefFor("technologies", filters)} aria-current={view === "technologies" ? "page" : undefined}>
          Technologies
        </Link>
        <Link href={hrefFor("everything", filters)} aria-current={view === "everything" ? "page" : undefined}>
          Search
        </Link>
        <Link href={hrefFor("collections", filters)} aria-current={view === "collections" ? "page" : undefined}>
          Collections
        </Link>
        <Link href={hrefFor("picks", filters)} aria-current={view === "picks" ? "page" : undefined}>
          Editor&apos;s picks
        </Link>
        <Link href={hrefFor("emerging", filters)} aria-current={view === "emerging" ? "page" : undefined}>
          New
        </Link>
      </nav>
      <nav className="repo-filters discover-format" aria-label="Feed format">
        {views.filter((item) => item.id === "posts" || item.id === "reels").map((item) => (
          <Link key={item.id} href={hrefFor(item.id, filters)} aria-current={view === item.id ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="discover-tools">
        {view === "people" || view === "projects" || view === "everything" ? <DiscoverSearch view={view} filters={filters} /> : null}
        {view === "projects" ? <ProjectSort filters={filters} /> : null}
        {view === "people" ? <PeopleFilters filters={filters} /> : view === "projects" ? <AdvancedProjectFilters filters={filters} /> : view === "everything" || view === "collections" || view === "picks" || view === "emerging" ? null : <TypeFilters view={view} filters={filters} />}
      </div>
      {view === "people" ? <PeopleList filters={filters} /> : null}
      {view === "projects" ? <ProjectList filters={filters} /> : null}
      {view === "research" ? <ResearchList /> : null}
      {view === "experiments" ? <ExperimentList /> : null}
      {view === "communities" ? <CommunityList /> : null}
      {view === "opportunities" ? <OpportunityList /> : null}
      {view === "events" ? <EventList /> : null}
      {view === "competitions" ? <CompetitionList /> : null}
      {view === "hackathons" ? <HackathonList /> : null}
      {view === "opensource" ? <OpenSourceList /> : null}
      {view === "technologies" ? <TechnologyList /> : null}
      {view === "everything" ? <SearchEverything filters={filters} /> : null}
      {view === "collections" ? <CollectionList /> : null}
      {view === "picks" ? <EditorsPicks /> : null}
      {view === "emerging" ? <EmergingProjects /> : null}
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
  if ((view === "people" || view === "projects" || view === "everything") && filters.q) params.set("q", filters.q);
  if (view === "people") {
    if (filters.age) params.set("age", filters.age);
    if (filters.place) params.set("place", filters.place);
    if (filters.skill) params.set("skill", filters.skill);
  } else if (view !== "everything" && view !== "collections" && view !== "picks" && view !== "emerging" && type) {
    params.set("type", type);
  }
  if (view === "projects" && filters.status) params.set("status", filters.status);
  if (view === "projects" && filters.sort !== "latest") params.set("sort", filters.sort);
  const query = params.toString();
  return query ? `/discover?${query}` : "/discover";
}

async function PeopleList({ filters }: { filters: DiscoverFilters }) {
  const supabase = await createClient();
  const member = await getMember();
  let query = supabase
    .from("profile_directory")
    .select("id, username, display_name, bio, avatar_url, banner_url, education, city, state, age_group")
    .eq("onboarding_complete", true)
    .eq("visibility", "public")
    .not("username", "is", null)
    .order("display_name")
    .limit(30);
  if (filters.age) query = query.eq("age_group", filters.age);
  if (filters.place) {
    const place = filters.place;
    query = query.or(`city.ilike.%${place}%,state.ilike.%${place}%,education.ilike.%${place}%`);
  }
  if (filters.q) query = query.or(`display_name.ilike.%${filters.q}%,username.ilike.%${filters.q}%`);
  if (member) {
    const { data: blocked } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", member.id);
    const blockedIds = (blocked ?? []).map((row) => row.blocked_id);
    if (blockedIds.length > 0) query = query.not("id", "in", `(${blockedIds.join(",")})`);
  }
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
  if (filters.discipline) {
    const { data: interests } = await supabase.from("interests").select("id").eq("category", filters.discipline);
    const interestIds = (interests ?? []).map((interest) => interest.id);
    const { data: links } = interestIds.length
      ? await supabase.from("profile_interests").select("profile_id").in("interest_id", interestIds)
      : { data: [] };
    const ids = [...new Set((links ?? []).map((row) => row.profile_id))];
    if (ids.length === 0) {
      return <p className="repo-empty">No people match that filter.</p>;
    }
    query = query.in("id", ids);
  }
  if (filters.interest) {
    const { data: interest } = await supabase.from("interests").select("id").eq("slug", filters.interest).maybeSingle();
    const { data: links } = interest
      ? await supabase.from("profile_interests").select("profile_id").eq("interest_id", interest.id)
      : { data: [] };
    const ids = (links ?? []).map((row) => row.profile_id);
    if (ids.length === 0) {
      return <p className="repo-empty">No people match that filter.</p>;
    }
    query = query.in("id", ids);
  }
  if (filters.experience) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, owner_id")
      .eq("category", filters.experience)
      .eq("visibility", "public")
      .is("removed_at", null)
      .limit(200);
    const projectIds = (projects ?? []).map((project) => project.id);
    const { data: members } = projectIds.length
      ? await supabase.from("project_members").select("profile_id").in("project_id", projectIds).eq("status", "active")
      : { data: [] };
    const ids = [
      ...new Set([
        ...(projects ?? []).map((project) => project.owner_id),
        ...(members ?? []).map((member) => member.profile_id),
      ]),
    ];
    if (ids.length === 0) {
      return <p className="repo-empty">No people match that filter.</p>;
    }
    query = query.in("id", ids);
  }
  if (filters.availability) query = query.eq("collaboration_preference", filters.availability);
  if (filters.looking === "mentors") {
    const { data: experienced } = await supabase.from("profile_experience").select("profile_id").limit(200);
    const { data: seeking } = await supabase
      .from("profile_directory")
      .select("id")
      .contains("looking_for", ["mentors"])
      .eq("visibility", "public")
      .eq("onboarding_complete", true);
    const ids = [...new Set([...(experienced ?? []).map((row) => row.profile_id), ...(seeking ?? []).map((row) => row.id)])];
    if (ids.length === 0) return <p className="repo-empty">No people match that filter.</p>;
    query = query.in("id", ids);
  } else if (filters.looking) {
    query = query.contains("looking_for", [filters.looking]);
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
    <>
      {member?.onboardingComplete ? <SharedPeople memberId={member.id} /> : null}
      {member?.onboardingComplete ? <RelatedProjectPeople memberId={member.id} /> : null}
      <ResearchCollaborators />
      <FoundingTeams />
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
    </>
  );
}

function firstImage(urls: string[] | null | undefined) {
  return (urls ?? []).find((url) => url && !isVideoUrl(url));
}

async function ResearchList() {
  const supabase = await createClient();
  const [{ data: projects }, { data: papers }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, slug, description")
      .eq("category", "Research")
      .eq("visibility", "public")
      .is("removed_at", null)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase.from("profile_publications").select("id, title").order("created_at", { ascending: false }).limit(20),
  ]);
  return (
    <section aria-labelledby="discover-research-heading">
      <h2 id="discover-research-heading">Research</h2>
      <ul className="repo-list" role="list">
        {(projects ?? []).map((project) => (
          <li key={project.id} className="repo-row">
            <div className="repo-title">
              <Link href={`/forge/${project.slug}`}>{project.name}</Link>
              <span className="repo-visibility">Project</span>
            </div>
            <p>{project.description}</p>
          </li>
        ))}
        {(papers ?? []).map((paper) => (
          <li key={paper.id} className="repo-row">
            <div className="repo-title">
              <strong>{paper.title}</strong>
              <span className="repo-visibility">Publication</span>
            </div>
          </li>
        ))}
      </ul>
      {(projects ?? []).length === 0 && (papers ?? []).length === 0 ? <p>No research yet.</p> : null}
    </section>
  );
}

async function ExperimentList() {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("build_logs")
    .select("id, title, project_id, created_at")
    .eq("kind", "experiment")
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(20);
  const projectIds = [...new Set((logs ?? []).map((log) => log.project_id))];
  const { data: projects } = projectIds.length
    ? await supabase.from("projects").select("id, name, slug").in("id", projectIds).eq("visibility", "public").is("removed_at", null)
    : { data: [] };
  const byId = new Map((projects ?? []).map((project) => [project.id, project]));
  const rows = (logs ?? []).flatMap((log) => {
    const project = byId.get(log.project_id);
    return project ? [{ ...log, project }] : [];
  });
  return (
    <section aria-labelledby="discover-experiments-heading">
      <h2 id="discover-experiments-heading">Experiments</h2>
      {rows.length === 0 ? <p>No experiments yet.</p> : null}
      <ul className="repo-list" role="list">
        {rows.map((log) => (
          <li key={log.id} className="repo-row">
            <div className="repo-title">
              <Link href={`/forge/${log.project.slug}`}>{log.title}</Link>
              <span className="repo-visibility">{log.project.name}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function CommunityList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_communities")
    .select("name, created_at")
    .order("created_at", { ascending: false })
    .limit(40);
  const names: string[] = [];
  for (const row of data ?? []) {
    if (!names.includes(row.name)) names.push(row.name);
    if (names.length === 20) break;
  }
  return (
    <section aria-labelledby="discover-communities-heading">
      <h2 id="discover-communities-heading">Communities</h2>
      <p className="form-note">Names builders have typed on their profiles. MOSAIC groups are not open yet.</p>
      {names.length === 0 ? <p>No communities listed yet.</p> : null}
      <ul className="skill-row" role="list">
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </section>
  );
}

async function OpportunityList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("opportunities")
    .select("id, title, organizer, official_url, category")
    .eq("is_published", true)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(30);
  const rows = (data ?? []).filter((item) => item.category !== "workshop" && item.category !== "maker_event");
  return (
    <section aria-labelledby="discover-opportunities-heading">
      <h2 id="discover-opportunities-heading">Opportunities</h2>
      {rows.length === 0 ? <p>No opportunities yet.</p> : null}
      <ul className="repo-list" role="list">
        {rows.map((item) => (
          <li key={item.id} className="repo-row">
            <div className="repo-title">
              <strong>{item.title}</strong>
              <span className="repo-visibility">{item.organizer}</span>
            </div>
            <p>
              <a href={item.official_url}>Official link</a>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function EventList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("opportunities")
    .select("id, title, official_url, start_date, is_online, category")
    .eq("is_published", true)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(30);
  const rows = (data ?? []).filter((item) => item.category === "workshop" || item.category === "maker_event");
  return (
    <section aria-labelledby="discover-events-heading">
      <h2 id="discover-events-heading">Events</h2>
      {rows.length === 0 ? <p>No events yet.</p> : null}
      <ul className="repo-list" role="list">
        {rows.map((item) => (
          <li key={item.id} className="repo-row">
            <div className="repo-title">
              <strong>{item.title}</strong>
              <span className="repo-visibility">{item.is_online ? "Online" : "In person"}</span>
            </div>
            <p>
              <a href={item.official_url}>Registration link</a>
            </p>
            <p className="form-note">{item.start_date ? `Date ${item.start_date.slice(0, 10)}` : "No date was provided."}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function CompetitionList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_competitions")
    .select("id, name, host, result")
    .order("created_at", { ascending: false })
    .limit(20);
  const rows = data ?? [];
  return (
    <section aria-labelledby="discover-competitions-heading">
      <h2 id="discover-competitions-heading">Competitions</h2>
      <p className="form-note">Competitions builders have listed on their profiles.</p>
      {rows.length === 0 ? <p>No competitions yet.</p> : null}
      <ul className="repo-list" role="list">
        {rows.map((item) => (
          <li key={item.id} className="repo-row">
            <div className="repo-title">
              <strong>{item.name}</strong>
              {item.host ? <span className="repo-visibility">{item.host}</span> : null}
            </div>
            {item.result ? <p>{item.result}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

async function HackathonList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("opportunities")
    .select("id, title, organizer, official_url")
    .eq("is_published", true)
    .eq("category", "hackathon")
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(20);
  const rows = data ?? [];
  return (
    <section aria-labelledby="discover-hackathons-heading">
      <h2 id="discover-hackathons-heading">Hackathons</h2>
      {rows.length === 0 ? <p>No hackathons yet.</p> : null}
      <ul className="repo-list" role="list">
        {rows.map((item) => (
          <li key={item.id} className="repo-row">
            <div className="repo-title">
              <strong>{item.title}</strong>
              <span className="repo-visibility">{item.organizer}</span>
            </div>
            <p>
              <a href={item.official_url}>Official link</a>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function OpenSourceList() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, slug, github_url")
    .eq("visibility", "public")
    .not("github_url", "is", null)
    .is("removed_at", null)
    .order("updated_at", { ascending: false })
    .limit(20);
  const rows = (data ?? []).flatMap((project) => (project.github_url ? [project] : []));
  return (
    <section aria-labelledby="discover-opensource-heading">
      <h2 id="discover-opensource-heading">Open source</h2>
      <p className="form-note">Public projects with a GitHub link their owner saved.</p>
      {rows.length === 0 ? <p>No open-source projects yet.</p> : null}
      <ul className="repo-list" role="list">
        {rows.map((project) => (
          <li key={project.id} className="repo-row">
            <div className="repo-title">
              <Link href={`/forge/${project.slug}`}>{project.name}</Link>
            </div>
            <p>
              <a href={project.github_url ?? undefined}>Repository</a>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function TechnologyList() {
  const supabase = await createClient();
  const { data: links } = await supabase.from("project_skills").select("skill_id, project_id").eq("relation", "uses").limit(1000);
  const projectIds = [...new Set((links ?? []).map((link) => link.project_id))];
  const { data: projects } = projectIds.length
    ? await supabase.from("projects").select("id").in("id", projectIds).eq("visibility", "public").is("removed_at", null)
    : { data: [] };
  const publicIds = new Set((projects ?? []).map((project) => project.id));
  const counts = new Map<string, number>();
  for (const link of links ?? []) {
    if (!publicIds.has(link.project_id)) continue;
    counts.set(link.skill_id, (counts.get(link.skill_id) ?? 0) + 1);
  }
  const skillIds = [...counts.keys()];
  const { data: skills } = skillIds.length
    ? await supabase.from("skills").select("id, name").in("id", skillIds)
    : { data: [] };
  const rows = (skills ?? [])
    .map((skill) => ({ name: skill.name, count: counts.get(skill.id) ?? 0 }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 20);
  return (
    <section aria-labelledby="discover-technologies-heading">
      <h2 id="discover-technologies-heading">Technologies</h2>
      <p className="form-note">How many public projects list each tool. This is a count, not a score.</p>
      {rows.length === 0 ? <p>No tools saved yet.</p> : null}
      <ul className="repo-list" role="list">
        {rows.map((row) => (
          <li key={row.name} className="repo-row">
            <div className="repo-title">
              <strong>{row.name}</strong>
              <span className="repo-visibility">{row.count}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function SearchEverything({ filters }: { filters: DiscoverFilters }) {
  const term = filters.q.replace(/[,.()]/g, "");
  const supabase = await createClient();
  const people = term
    ? (
        await supabase
          .from("profile_directory")
          .select("id, username, display_name")
          .eq("onboarding_complete", true)
          .eq("visibility", "public")
          .not("username", "is", null)
          .or(`display_name.ilike.%${term}%,username.ilike.%${term}%`)
          .order("display_name")
          .limit(8)
      ).data ?? []
    : [];
  const projects = term
    ? (
        await supabase
          .from("projects")
          .select("id, name, slug")
          .eq("visibility", "public")
          .is("removed_at", null)
          .ilike("name", `%${term}%`)
          .order("updated_at", { ascending: false })
          .limit(8)
      ).data ?? []
    : [];
  const posts = term
    ? (
        await supabase
          .from("posts")
          .select("id, title")
          .is("removed_at", null)
          .ilike("title", `%${term}%`)
          .order("created_at", { ascending: false })
          .limit(8)
      ).data ?? []
    : [];
  return (
    <section aria-labelledby="discover-search-heading">
      <h2 id="discover-search-heading">Search</h2>
      <p className="form-note">People, projects, and posts whose names match the words you type.</p>
      {!term ? <p>Type a search above.</p> : null}
      {term && people.length + projects.length + posts.length === 0 ? <p>Nothing matched.</p> : null}
      {people.length ? (
        <>
          <h3>People</h3>
          <ul className="repo-list" role="list">
            {people.flatMap((person) =>
              person.username ? (
                <li key={person.id} className="repo-row">
                  <Link href={`/people/${person.username}`}>{person.display_name}</Link>
                </li>
              ) : [],
            )}
          </ul>
        </>
      ) : null}
      {projects.length ? (
        <>
          <h3>Projects</h3>
          <ul className="repo-list" role="list">
            {projects.map((project) => (
              <li key={project.id} className="repo-row">
                <Link href={`/forge/${project.slug}`}>{project.name}</Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {posts.length ? (
        <>
          <h3>Posts</h3>
          <ul className="repo-list" role="list">
            {posts.map((post) => (
              <li key={post.id} className="repo-row">
                <Link href={`/posts/${post.id}`}>{post.title}</Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

async function CollectionList() {
  const supabase = await createClient();
  const member = await getMember();
  const { data } = await supabase.from("collections").select("id, title, created_at").order("created_at", { ascending: false }).limit(20);
  const collections = data ?? [];
  const ids = collections.map((collection) => collection.id);
  const { data: links } = ids.length
    ? await supabase.from("collection_projects").select("collection_id, project_id").in("collection_id", ids)
    : { data: [] };
  const projectIds = [...new Set((links ?? []).map((link) => link.project_id))];
  const { data: projects } = projectIds.length
    ? await supabase.from("projects").select("id, name, slug").in("id", projectIds).eq("visibility", "public").is("removed_at", null)
    : { data: [] };
  const byId = new Map((projects ?? []).map((project) => [project.id, project]));
  return (
    <section aria-labelledby="discover-collections-heading">
      <h2 id="discover-collections-heading">Collections</h2>
      <p className="form-note">Named lists a builder made from public projects.</p>
      {member ? (
        <form className="form-stack" action={createCollection}>
          <div className="field">
            <label htmlFor="collection-title">Collection name</label>
            <input id="collection-title" name="title" required maxLength={80} className="repo-search-input" />
          </div>
          <div className="field">
            <label htmlFor="collection-slug">Project link name</label>
            <input id="collection-slug" name="slug" required maxLength={80} className="repo-search-input" />
            <p className="form-note">The last part of a public project URL.</p>
          </div>
          <button className="text-button" type="submit">
            Create collection
          </button>
        </form>
      ) : null}
      {collections.length === 0 ? <p>No collections yet.</p> : null}
      <ul className="repo-list" role="list">
        {collections.map((collection) => {
          const items = (links ?? []).flatMap((link) => {
            if (link.collection_id !== collection.id) return [];
            const project = byId.get(link.project_id);
            return project ? [project] : [];
          });
          return (
            <li key={collection.id} className="repo-row">
              <div className="repo-title">
                <strong>{collection.title}</strong>
              </div>
              {items.length === 0 ? <p className="form-note">No public projects in this collection.</p> : null}
              <ul>
                {items.map((project) => (
                  <li key={project.id}>
                    <Link href={`/forge/${project.slug}`}>{project.name}</Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

async function EditorsPicks() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("visibility", "public")
    .not("featured_at", "is", null)
    .is("removed_at", null)
    .order("featured_at", { ascending: false })
    .limit(12);
  const projects = data ?? [];
  return (
    <section aria-labelledby="discover-picks-heading">
      <h2 id="discover-picks-heading">Editor&apos;s picks</h2>
      <p className="form-note">Public projects a staff member has featured. A builder cannot feature their own project.</p>
      {projects.length === 0 ? <p>No editor&apos;s picks yet.</p> : null}
      <ul className="repo-list" role="list">
        {projects.map((project) => (
          <li key={project.id} className="repo-row">
            <Link href={`/forge/${project.slug}`}>{project.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function EmergingProjects() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, slug, created_at")
    .eq("visibility", "public")
    .in("status", ["idea", "researching", "in_development"])
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(20);
  const projects = data ?? [];
  return (
    <section aria-labelledby="discover-emerging-heading">
      <h2 id="discover-emerging-heading">New and emerging</h2>
      <p className="form-note">The newest public projects still at idea, researching, or in development. Ordered by when they were created.</p>
      {projects.length === 0 ? <p>No new projects yet.</p> : null}
      <ul className="repo-list" role="list">
        {projects.map((project) => (
          <li key={project.id} className="repo-row">
            <Link href={`/forge/${project.slug}`}>{project.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function ProjectList({ filters }: { filters: DiscoverFilters }) {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("id, name, slug, description, tagline, subcategory, category, cover_image_url, updated_at")
    .eq("visibility", "public")
    .is("removed_at", null)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (filters.type) query = query.eq("category", filters.type);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) query = query.or(`name.ilike.%${filters.q}%,description.ilike.%${filters.q}%,tagline.ilike.%${filters.q}%`);
  const { data } = await query;
  let projects = data ?? [];
  if (filters.sort === "popular" && projects.length > 0) {
    const { data: follows } = await supabase.from("project_follows").select("project_id").in("project_id", projects.map((project) => project.id));
    const counts = new Map<string, number>();
    for (const row of follows ?? []) counts.set(row.project_id, (counts.get(row.project_id) ?? 0) + 1);
    projects = [...projects].sort(
      (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || b.updated_at.localeCompare(a.updated_at),
    );
  } else if (filters.sort === "relevance" && filters.q) {
    const needle = filters.q.toLowerCase();
    projects = [...projects].sort(
      (a, b) =>
        Number(!a.name.toLowerCase().includes(needle)) - Number(!b.name.toLowerCase().includes(needle)) ||
        b.updated_at.localeCompare(a.updated_at),
    );
  }
  if (projects.length === 0) {
    return (
      <p className="repo-empty">
        {filters.type || filters.status ? "No projects match that filter." : filters.q ? "No projects match that search." : "No public projects yet."}
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
              {project.tagline ? <p className="repo-meta">{project.tagline}</p> : null}
              {project.subcategory ? <p className="repo-meta">{project.subcategory}</p> : null}
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
    .select("id, title, content, type, media_urls, link_url, author_id, project_id, build_log_id, opportunity_id, created_at")
    .eq("visibility", "public")
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(40);
  if (projectIds) query = query.in("project_id", projectIds);
  const { data } = await query;
  const member = await getMember();
  const { data: mutedRows } = member
    ? await supabase.from("mutes").select("muted_id").eq("profile_id", member.id)
    : { data: [] };
  const mutedIds = new Set((mutedRows ?? []).map((row) => row.muted_id));
  const posts = (data ?? []).filter((post) => !mutedIds.has(post.author_id));
  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from("profile_directory").select("id, username, display_name").in("id", authorIds)
    : { data: [] };
  const names = new Map((authors ?? []).map((author) => [author.id, author]));
  const logIds = posts.map((post) => post.build_log_id).filter((id): id is string => Boolean(id));
  const { data: logs } = logIds.length
    ? await supabase.from("build_logs").select("id, kind").in("id", logIds)
    : { data: [] };
  const kinds = new Map((logs ?? []).map((log) => [log.id, log.kind]));
  const opportunityIds = posts.map((post) => post.opportunity_id).filter((id): id is string => Boolean(id));
  const { data: opportunities } = opportunityIds.length
    ? await supabase.from("opportunities").select("id, category").in("id", opportunityIds)
    : { data: [] };
  const opportunityCategories = new Map((opportunities ?? []).map((item) => [item.id, item.category]));
  const previewIds = [...new Set(posts.map((post) => post.project_id).filter((id): id is string => Boolean(id)))];
  const { data: projects } = previewIds.length
    ? await supabase.from("projects").select("id, name, slug").in("id", previewIds).is("removed_at", null)
    : { data: [] };
  const projectById = new Map((projects ?? []).map((project) => [project.id, project]));
  return posts.map((post) => ({
    ...post,
    author: names.get(post.author_id),
    logKind: post.build_log_id ? kinds.get(post.build_log_id) : null,
    opportunityCategory: post.opportunity_id ? opportunityCategories.get(post.opportunity_id) : null,
    project: post.project_id ? projectById.get(post.project_id) ?? null : null,
  }));
}

async function followedIds(memberId: string | null, authorIds: string[]) {
  const unique = [...new Set(authorIds)];
  if (!memberId || unique.length === 0) return new Set<string>();
  const supabase = await createClient();
  const { data } = await supabase.from("follows").select("following_id").eq("follower_id", memberId).in("following_id", unique);
  return new Set((data ?? []).map((row) => row.following_id));
}

async function watchedProjects(memberId: string | null, projectIds: string[]) {
  const unique = [...new Set(projectIds)];
  if (unique.length === 0) return new Set<string>();
  const supabase = await createClient();
  const { data } = memberId
    ? await supabase.from("project_follows").select("project_id").eq("profile_id", memberId).in("project_id", unique)
    : { data: [] };
  return new Set((data ?? []).map((row) => row.project_id));
}

async function ownedPublicProjects(memberId: string | undefined, signedIn: boolean) {
  if (!signedIn || !memberId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .eq("owner_id", memberId)
    .eq("visibility", "public")
    .is("removed_at", null)
    .order("name");
  return data ?? [];
}

function postKindLabel(type: string, logKind?: string | null, opportunityCategory?: string | null) {
  if (type === "build_log" && logKind === "experiment") return "Experiment";
  if (type === "build_log") return "Build in public";
  if (type === "help") return "Question";
  if (type === "project") return "Showcase";
  if (type === "achievement") return "Achievement";
  if (type === "idea") return "Idea";
  if (type === "opportunity" && (opportunityCategory === "workshop" || opportunityCategory === "maker_event")) return "Event";
  if (type === "opportunity") return "Opportunity";
  return type.replaceAll("_", " ");
}

async function PostList({ kind, filters }: { kind: "posts" | "ideas"; filters: DiscoverFilters }) {
  const member = await getMember();
  const loaded = (await loadPosts(filters.type)).filter((post) => (kind === "ideas" ? post.type === "idea" : true));
  const hidden = await hiddenPostIds(member?.id ?? null, loaded.map((post) => post.id));
  const posts = loaded.filter((post) => !hidden.has(post.id));
  const signedIn = Boolean(member?.onboardingComplete && !member.suspended && !member.deletedAt);
  const projects = kind === "posts" ? await ownedPublicProjects(member?.id, signedIn) : [];
  if (posts.length === 0) {
    const filtered = Boolean(filters.type);
    return (
      <>
        {signedIn && kind === "posts" ? <FeedPostForm projects={projects} /> : null}
        <p className="repo-empty">
          {kind === "ideas"
            ? filtered
              ? "No ideas match that filter."
              : "No ideas yet."
            : filtered
              ? "No posts match that filter."
              : "No posts yet."}
        </p>
      </>
    );
  }
  const supabase = await createClient();
  const activity = await loadActivity(
    supabase,
    posts.map((post) => post.id),
    member?.id ?? null,
  );
  const viewerId = signedIn && member ? member.id : null;
  const following = await followedIds(viewerId, posts.map((post) => post.author_id));
  const watched = await watchedProjects(
    viewerId,
    posts.flatMap((post) => (post.project_id ? [post.project_id] : [])),
  );
  return (
    <>
      {signedIn && kind === "posts" ? <FeedPostForm projects={projects} /> : null}
      <ul className="repo-list" role="list">
      {posts.map((post) => (
        <li key={post.id} className="repo-row">
          <div className="repo-title">
            <strong>
              <Link href={`/posts/${post.id}`}>{post.title ?? "Post"}</Link>
            </strong>
            <span className="repo-visibility">{postKindLabel(post.type, post.logKind, post.opportunityCategory)}</span>
          </div>
          <p className="discover-copy">{post.content}</p>
          {post.project ? (
            <p className="repo-meta">
              <Link href={`/forge/${post.project.slug}`}>{post.project.name}</Link>
            </p>
          ) : null}
          {(post.media_urls ?? []).map((url) => (
            <p key={url}>
              <a href={url}>Attachment</a>
            </p>
          ))}
          {post.link_url ? (
            <p>
              <a href={post.link_url}>Attachment</a>
            </p>
          ) : null}
          {kind === "ideas" ? (
            <div className="idea-photos">
              {(post.media_urls ?? []).filter((url) => url && !isVideoUrl(url)).slice(0, 4).map((url) => (
                <img key={url} src={url} alt="" />
              ))}
            </div>
          ) : null}
          {post.author?.username ? (
            <div className="author-row">
              <Link href={`/people/${post.author.username}`}>{post.author.display_name}</Link>
              {member?.id === post.author_id ? null : (
                <FollowButton
                  username={post.author.username}
                  following={following.has(post.author_id)}
                  signedIn={signedIn}
                  next={`/posts/${post.id}`}
                />
              )}
              {post.project_id ? (
                <ProjectFollowButton
                  projectId={post.project_id}
                  following={watched.has(post.project_id)}
                  signedIn={signedIn}
                  next={`/posts/${post.id}`}
                />
              ) : null}
            </div>
          ) : null}
          <PostActions postId={post.id} activity={activity.get(post.id) ?? emptyActivity()} signedIn={signedIn} />
        </li>
      ))}
    </ul>
    </>
  );
}

async function ReelGrid({ filters }: { filters: DiscoverFilters }) {
  const member = await getMember();
  const loaded = (await loadPosts(filters.type)).filter((post) => post.media_urls.length > 0);
  const hidden = await hiddenPostIds(member?.id ?? null, loaded.map((post) => post.id));
  const posts = loaded.filter((post) => !hidden.has(post.id));
  const supabase = await createClient();
  const activity = await loadActivity(
    supabase,
    posts.map((post) => post.id),
    member?.id ?? null,
  );
  const signedIn = Boolean(member?.onboardingComplete && !member.suspended && !member.deletedAt);
  const viewerId = signedIn && member ? member.id : null;
  const following = await followedIds(viewerId, posts.map((post) => post.author_id));
  const watched = await watchedProjects(
    viewerId,
    posts.flatMap((post) => (post.project_id ? [post.project_id] : [])),
  );
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
              <div className="author-row">
                <p>{label}</p>
                {post.author?.username && member?.id !== post.author_id ? (
                  <FollowButton
                    username={post.author.username}
                    following={following.has(post.author_id)}
                    signedIn={signedIn}
                    next={`/posts/${post.id}`}
                  />
                ) : null}
                {post.project_id ? (
                  <ProjectFollowButton
                    projectId={post.project_id}
                    following={watched.has(post.project_id)}
                    signedIn={signedIn}
                    next={`/posts/${post.id}`}
                  />
                ) : null}
              </div>
              <PostActions postId={post.id} activity={activity.get(post.id) ?? emptyActivity()} signedIn={signedIn} />
            </li>
          );
        })}
      </ul>
    </>
  );
}

function DiscoverSearch({ view, filters }: { view: "people" | "projects" | "everything"; filters: DiscoverFilters }) {
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
        placeholder={view === "people" ? "Name or username" : view === "projects" ? "Project name" : "People, projects, or posts"}
        maxLength={80}
        className="repo-search-input"
      />
    </form>
  );
}

async function PeopleFilters({ filters }: { filters: DiscoverFilters }) {
  const supabase = await createClient();
  const { data } = await supabase.from("skills").select("slug, name").order("name");
  const { data: interestRows } = await supabase.from("interests").select("slug, name").order("name");
  const skills = data ?? [];
  const interests = interestRows ?? [];
  const active =
    Number(Boolean(filters.age)) +
    Number(Boolean(filters.place)) +
    Number(Boolean(filters.skill)) +
    Number(Boolean(filters.discipline)) +
    Number(Boolean(filters.interest)) +
    Number(Boolean(filters.experience)) +
    Number(Boolean(filters.availability)) +
    Number(Boolean(filters.looking));
  return (
    <FilterMenu active={active}>
    <form className="discover-filters" action="/discover">
      <input type="hidden" name="view" value="people" />
      {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
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
      <div className="field">
        <label htmlFor="discover-discipline">Discipline</label>
        <select id="discover-discipline" name="discipline" className="field-select" defaultValue={filters.discipline}>
          <option value="">Any</option>
          {interestCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="discover-interest">Interest</label>
        <select id="discover-interest" name="interest" className="field-select" defaultValue={filters.interest}>
          <option value="">Any</option>
          {interests.map((interest) => (
            <option key={interest.slug} value={interest.slug}>
              {interest.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="discover-experience">Project experience</label>
        <select id="discover-experience" name="experience" className="field-select" defaultValue={filters.experience ?? ""}>
          <option value="">Any</option>
          {projectCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="discover-availability">Collaboration</label>
        <select id="discover-availability" name="availability" className="field-select" defaultValue={filters.availability}>
          <option value="">Any</option>
          {collaborationPreferences.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="discover-looking">Looking for</label>
        <select id="discover-looking" name="looking" className="field-select" defaultValue={filters.looking}>
          <option value="">Any</option>
          {lookingForOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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

function ProjectSort({ filters }: { filters: DiscoverFilters }) {
  const sorts = [
    { id: "latest", label: "Latest" },
    { id: "relevance", label: "Relevance" },
    { id: "popular", label: "Popularity" },
  ] as const;
  return (
    <nav className="repo-filters" aria-label="Sort">
      {sorts.map((item) => (
        <Link key={item.id} href={hrefFor("projects", { ...filters, sort: item.id })} aria-current={filters.sort === item.id ? "page" : undefined}>
          {item.label}
        </Link>
      ))}
      <p className="form-note">
        Latest follows the last update. Relevance puts a project whose name matches your search ahead of a description match. Popularity is how many people follow the project.
      </p>
    </nav>
  );
}

function AdvancedProjectFilters({ filters }: { filters: DiscoverFilters }) {
  const active = Number(Boolean(filters.type)) + Number(Boolean(filters.status));
  return (
    <FilterMenu active={active}>
      <form className="discover-filters" action="/discover">
        <input type="hidden" name="view" value="projects" />
        {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
        <div className="field">
          <label htmlFor="discover-project-type">Type</label>
          <select id="discover-project-type" name="type" className="field-select" defaultValue={filters.type ?? ""}>
            <option value="">Any</option>
            {projectCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="discover-project-status">Status</label>
          <select id="discover-project-status" name="status" className="field-select" defaultValue={filters.status ?? ""}>
            <option value="">Any</option>
            {projectStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        <button className="text-button" type="submit">
          Apply filters
        </button>
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
