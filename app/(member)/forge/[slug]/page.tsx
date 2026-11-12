import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CommitForm, PullRequestForm, ReplyForm, ThreadForm } from "@/components/build/ProjectForms";
import { buildLogKindLabel } from "@/lib/projects/log-kind";
import { LogMedia } from "@/components/build/LogMedia";
import { Collaboration } from "@/components/build/Collaboration";
import { ContributionHistory } from "@/components/build/ContributionHistory";
import { CreditsForm } from "@/components/build/CreditsForm";
import { DocumentationForm } from "@/components/build/DocumentationForm";
import { Milestones } from "@/components/build/Milestones";
import { ProjectAnalytics } from "@/components/build/ProjectAnalytics";
import { ProjectLineage } from "@/components/build/ProjectLineage";
import { ProjectMedia } from "@/components/build/ProjectMedia";
import { SkillsForm } from "@/components/build/SkillsForm";
import { StatusForm } from "@/components/build/StatusForm";
import { TimelineForm } from "@/components/build/TimelineForm";
import { ProjectTeam } from "@/components/build/ProjectTeam";
import { RelatedProjects } from "@/components/build/RelatedProjects";
import { UpdateHistory } from "@/components/build/UpdateHistory";
import { Versions } from "@/components/build/Versions";
import { SubcategoryForm } from "@/components/build/SubcategoryForm";
import { TaglineForm } from "@/components/build/TaglineForm";
import { ToolsForm } from "@/components/build/ToolsForm";
import { ShareButton } from "@/components/feed/ShareButton";
import { forkProject, reviewPullRequest } from "@/lib/projects/actions";
import { toggleProjectSave } from "@/lib/projects/follow";
import { ProjectFollowButton } from "@/components/projects/ProjectFollowButton";
import { ReportForm, reportedState } from "@/components/safety/ReportForm";
import { getMember } from "@/lib/auth/session";
import { relatedProjects } from "@/lib/projects/related";
import { isProjectCategory, isProjectStatus, projectStatusLabel, projectTypeNotes, type ProjectCategory } from "@/lib/projects/slug";
import { projectTimelineText } from "@/lib/projects/timeline";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "commits", label: "Commits" },
  { id: "pulls", label: "Pull requests" },
  { id: "threads", label: "Threads" },
] as const;

type Tab = (typeof tabs)[number]["id"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("name").eq("slug", slug).maybeSingle();
  return { title: data?.name ?? slug };
}

export default function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; thread?: string; reported?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <ProjectView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ProjectView({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; thread?: string; reported?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const tab: Tab = tabs.some((item) => item.id === query.tab) ? (query.tab as Tab) : "overview";
  const supabase = await createClient();
  const member = await getMember();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug, description, detailed_description, credits, tagline, subcategory, cover_image_url, visibility, looking_for_contributors, status, starts_on, ends_on, category, updated_at, owner_id, parent_project_id")
    .eq("slug", slug)
    .is("removed_at", null)
    .maybeSingle();
  if (!project) notFound();

  const [ownerResult, parentResult, forksResult, membershipResult, watchResult, saveResult, galleryResult, skillsResult, skillLinks, milestoneResult, versionResult, logResult, memberResult, requestResult, followCount, threadCount, saveCount] = await Promise.all([
    supabase.from("profiles").select("username, display_name").eq("id", project.owner_id).maybeSingle(),
    project.parent_project_id
      ? supabase.from("projects").select("name, slug").eq("id", project.parent_project_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("projects").select("id, name, slug").eq("parent_project_id", project.id).is("removed_at", null),
    member
      ? supabase
          .from("project_members")
          .select("role")
          .eq("project_id", project.id)
          .eq("profile_id", member.id)
          .eq("status", "active")
          .maybeSingle()
      : Promise.resolve({ data: null }),
    member
      ? supabase
          .from("project_follows")
          .select("profile_id")
          .eq("profile_id", member.id)
          .eq("project_id", project.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    member
      ? supabase
          .from("project_saves")
          .select("profile_id")
          .eq("profile_id", member.id)
          .eq("project_id", project.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("project_gallery").select("id, image_url").eq("project_id", project.id).order("created_at", { ascending: true }),
    supabase.from("skills").select("id, name").order("name"),
    supabase.from("project_skills").select("skill_id, relation").eq("project_id", project.id).in("relation", ["uses", "seeking"]),
    supabase
      .from("project_milestones")
      .select("id, title, happens_on")
      .eq("project_id", project.id)
      .order("happens_on", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("project_versions")
      .select("id, title, note, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("build_logs")
      .select("id, title, content, created_at, author_id, media_urls, kind")
      .eq("project_id", project.id)
      .is("removed_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_members")
      .select("profile_id, role, joined_at")
      .eq("project_id", project.id)
      .eq("status", "active"),
    supabase
      .from("contribution_requests")
      .select("id, requester_id, message, proposed_contribution, status")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true }),
    supabase.from("project_follows").select("profile_id", { count: "exact", head: true }).eq("project_id", project.id),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id)
      .eq("type", "idea")
      .is("removed_at", null),
    member?.id === project.owner_id
      ? supabase.rpc("owner_project_save_count", { target: project.id })
      : Promise.resolve({ data: null }),
  ]);

  const username = ownerResult.data?.username ?? "builder";
  const isOwner = member?.id === project.owner_id;
  const skills = skillsResult.data ?? [];
  const links = skillLinks.data ?? [];
  const usedIds = new Set(links.filter((row) => row.relation === "uses").map((row) => row.skill_id));
  const neededIds = new Set(links.filter((row) => row.relation === "seeking").map((row) => row.skill_id));
  const { data: relatedRows } = await supabase
    .from("projects")
    .select("id, name, slug, subcategory, updated_at")
    .eq("category", project.category)
    .eq("visibility", "public")
    .is("removed_at", null)
    .neq("id", project.id)
    .order("updated_at", { ascending: false })
    .limit(40);
  const relatedIds = (relatedRows ?? []).map((row) => row.id);
  const { data: relatedSkillRows } = relatedIds.length
    ? await supabase.from("project_skills").select("project_id, skill_id").in("project_id", relatedIds).eq("relation", "uses")
    : { data: [] };
  const related = relatedProjects(
    { id: project.id, subcategory: project.subcategory, skillIds: [...usedIds] },
    (relatedRows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      subcategory: row.subcategory,
      updatedAt: row.updated_at,
      skillIds: (relatedSkillRows ?? []).filter((skill) => skill.project_id === row.id).map((skill) => skill.skill_id),
    })),
  );
  const tools = skills.filter((skill) => usedIds.has(skill.id));
  const needed = skills.filter((skill) => neededIds.has(skill.id));
  const timeline = projectTimelineText(project.starts_on, project.ends_on);
  const logs = logResult.data ?? [];
  const roster = memberResult.data ?? [];
  const requests = requestResult.data ?? [];
  const forks = forksResult.data ?? [];
  const ancestors: { id: string; name: string; slug: string }[] = [];
  const seen = new Set<string>([project.id]);
  let parentId = project.parent_project_id;
  for (let step = 0; step < 8 && parentId && !seen.has(parentId); step += 1) {
    seen.add(parentId);
    const { data: ancestor } = await supabase
      .from("projects")
      .select("id, name, slug, parent_project_id")
      .eq("id", parentId)
      .is("removed_at", null)
      .maybeSingle();
    if (!ancestor) break;
    ancestors.push({ id: ancestor.id, name: ancestor.name, slug: ancestor.slug });
    parentId = ancestor.parent_project_id;
  }
  ancestors.reverse();
  const branchIds = [...ancestors.map((item) => item.id), ...forks.map((item) => item.id)];
  const { data: branchMembers } = branchIds.length
    ? await supabase
        .from("project_members")
        .select("project_id, profile_id, role")
        .in("project_id", branchIds)
        .eq("status", "active")
    : { data: [] };
  const lineageMembers = [
    ...roster.map((person) => ({ project_id: project.id, profile_id: person.profile_id, role: person.role })),
    ...(branchMembers ?? []),
  ];
  const logIds = logs.map((log) => log.id);
  const { data: logPosts } = logIds.length
    ? await supabase.from("posts").select("id, build_log_id").in("build_log_id", logIds).eq("type", "build_log").is("removed_at", null)
    : { data: [] };
  const postIds = (logPosts ?? []).map((post) => post.id);
  const { data: commentRows } = postIds.length
    ? await supabase
        .from("comments")
        .select("id, post_id, author_id, content")
        .in("post_id", postIds)
        .is("parent_comment_id", null)
        .is("removed_at", null)
        .order("created_at", { ascending: true })
    : { data: [] };
  const authorIds = [
    ...new Set([
      ...logs.map((log) => log.author_id),
      ...lineageMembers.map((person) => person.profile_id),
      ...requests.map((request) => request.requester_id),
      ...(commentRows ?? []).map((comment) => comment.author_id),
    ]),
  ];
  const { data: authorRows } = authorIds.length
    ? await supabase.from("profiles").select("id, display_name, username").in("id", authorIds)
    : { data: [] };
  const authorNames = new Map(
    (authorRows ?? []).map((person) => [person.id, person.display_name || person.username]),
  );
  const updates = logs.map((log) => ({
    id: log.id,
    title: log.title,
    content: log.content,
    when: formatWhen(log.created_at),
    author: authorNames.get(log.author_id) ?? "builder",
    media: log.media_urls,
    kind: log.kind,
    postId: (logPosts ?? []).find((post) => post.build_log_id === log.id)?.id ?? null,
    comments: (commentRows ?? [])
      .filter((comment) => (logPosts ?? []).some((post) => post.id === comment.post_id && post.build_log_id === log.id))
      .map((comment) => ({
        id: comment.id,
        author: authorNames.get(comment.author_id) ?? "builder",
        content: comment.content,
      })),
  }));
  const roleOrder = ["owner", "maintainer", "contributor"];
  const team = roster
    .map((person) => {
      const profile = (authorRows ?? []).find((row) => row.id === person.profile_id);
      return {
        id: person.profile_id,
        name: profile?.display_name || profile?.username || "builder",
        username: profile?.username ?? "",
        role: person.role,
      };
    })
    .filter((person) => person.username)
    .sort((left, right) => roleOrder.indexOf(left.role) - roleOrder.indexOf(right.role) || left.name.localeCompare(right.name));
  const roleLabels: Record<string, string> = {
    owner: "Owner",
    maintainer: "Maintainer",
    contributor: "Contributor",
  };
  const peopleFor = (projectId: string) =>
    lineageMembers
      .filter((person) => person.project_id === projectId)
      .map((person) => ({
        name: authorNames.get(person.profile_id) ?? "builder",
        role: person.role,
      }))
      .sort((left, right) => roleOrder.indexOf(left.role) - roleOrder.indexOf(right.role) || left.name.localeCompare(right.name))
      .map((person) => `${person.name} (${roleLabels[person.role] ?? person.role})`)
      .join(", ");
  const lineage = [
    ...ancestors.map((item) => ({ id: item.id, kind: "Ancestor", name: item.name, slug: item.slug, people: peopleFor(item.id) })),
    { id: project.id, kind: "This project", name: project.name, slug: project.slug, people: peopleFor(project.id) },
    ...forks.map((item) => ({ id: item.id, kind: "Fork", name: item.name, slug: item.slug, people: peopleFor(item.id) })),
  ];
  const onProject = Boolean(membershipResult.data);
  const collaboration = requests.map((request) => ({
    id: request.id,
    name: authorNames.get(request.requester_id) ?? "builder",
    message: request.message,
    proposed: request.proposed_contribution,
    status: request.status,
    mine: request.requester_id === member?.id,
  }));
  const canRequest =
    Boolean(member) &&
    !isOwner &&
    !onProject &&
    (project.visibility === "public" || project.looking_for_contributors);
  const contributions = [
    ...roster.flatMap((person) => {
      if (!person.joined_at) return [];
      const name = authorNames.get(person.profile_id) ?? "builder";
      const role = roleLabels[person.role] ?? person.role;
      return [{ id: `join-${person.profile_id}`, at: person.joined_at, text: `${name} joined as ${role}` }];
    }),
    ...logs.map((log) => ({
      id: `log-${log.id}`,
      at: log.created_at,
      text: `${authorNames.get(log.author_id) ?? "builder"} recorded ${log.title}`,
    })),
  ]
    .sort((left, right) => left.at.localeCompare(right.at) || left.text.localeCompare(right.text))
    .map((entry) => ({ id: entry.id, text: entry.text, when: formatWhen(entry.at) }));
  const typeNote = projectTypeNotes[project.category as ProjectCategory];

  return (
    <article className="build-page">
      <p className="repo-crumb">
        <Link href="/forge">Forge</Link>
        <span aria-hidden="true"> / </span>
        <span>{username}</span>
      </p>
      <header className="repo-heading">
        <h1>
          <span className="repo-owner">{username}</span>
          <span aria-hidden="true"> / </span>
          <span>{project.name}</span>
        </h1>
        <span className="repo-visibility">{project.visibility === "private" ? "Private" : "Public"}</span>
        <span className="repo-visibility">{project.category}</span>
        {project.subcategory ? <span className="repo-visibility">{project.subcategory}</span> : null}
        {tools.map((tool) => (
          <span key={tool.id} className="repo-visibility">
            {tool.name}
          </span>
        ))}
        <ProjectFollowButton
          projectId={project.id}
          following={Boolean(watchResult.data)}
          signedIn={Boolean(member?.onboardingComplete && !member.suspended && !member.deletedAt)}
          next={`/forge/${project.slug}`}
        />
        {member ? (
          <form action={toggleProjectSave}>
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="next" value={`/forge/${project.slug}`} />
            <button className="text-button" type="submit" aria-pressed={Boolean(saveResult.data)}>
              {saveResult.data ? "Saved" : "Save project"}
            </button>
          </form>
        ) : null}
        <ShareButton path={`/forge/${project.slug}`} />
        {!isOwner && member ? (
          <form action={forkProject}>
            <input type="hidden" name="projectId" value={project.id} />
            <button className="text-button" type="submit">
              Fork
            </button>
          </form>
        ) : null}
      </header>
      {project.tagline ? <p className="repo-meta">{project.tagline}</p> : null}
      {needed.length ? <p className="repo-meta project-needs">Needs {needed.map((skill) => skill.name).join(", ")}</p> : null}
      {timeline ? <p className="repo-meta project-timeline">{timeline}</p> : null}
      {isOwner ? <TaglineForm projectId={project.id} tagline={project.tagline} /> : null}
      {isOwner && isProjectCategory(project.category) ? (
        <SubcategoryForm projectId={project.id} category={project.category} subcategory={project.subcategory} />
      ) : null}
      {isOwner ? <ToolsForm projectId={project.id} skills={skills} selected={[...usedIds]} /> : null}
      {isOwner ? <SkillsForm projectId={project.id} skills={skills} selected={[...neededIds]} /> : null}
      {isOwner && isProjectStatus(project.status) ? <StatusForm projectId={project.id} status={project.status} /> : null}
      {isOwner ? (
        <TimelineForm projectId={project.id} startsOn={project.starts_on} endsOn={project.ends_on} />
      ) : null}
      {!isOwner && member ? (
        <ReportForm kind="project" target={project.id} reported={reportedState(query.reported)} />
      ) : null}
      {parentResult.data ? (
        <p className="repo-crumb">
          Forked from <Link href={`/forge/${parentResult.data.slug}`}>{parentResult.data.name}</Link>
        </p>
      ) : null}
      <nav className="project-tabs" aria-label="Project sections">
        {tabs.map((item) => (
          <Link key={item.id} href={`/forge/${slug}?tab=${item.id}`} aria-current={tab === item.id ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="project-layout">
        <div>
          {tab === "overview" ? (
            <>
              <ProjectMedia
                projectId={project.id}
                cover={project.cover_image_url}
                images={galleryResult.data ?? []}
                isOwner={isOwner}
                isPublic={project.visibility === "public"}
              />
              <Overview description={project.description} forks={forksResult.data ?? []} />
              <section aria-labelledby="project-documentation-heading">
                <h2 id="project-documentation-heading">Documentation</h2>
                {project.detailed_description ? (
                  <p className="project-docs">{project.detailed_description}</p>
                ) : (
                  <p className="form-note">No documentation yet.</p>
                )}
                {isOwner ? (
                  <DocumentationForm projectId={project.id} documentation={project.detailed_description} />
                ) : null}
              </section>
              <section aria-labelledby="project-credits-heading">
                <h2 id="project-credits-heading">Credits</h2>
                {project.credits ? <p className="project-credits">{project.credits}</p> : <p className="form-note">No credits yet.</p>}
                {isOwner ? <CreditsForm projectId={project.id} credits={project.credits} /> : null}
              </section>
              <UpdateHistory slug={project.slug} updates={updates} />
              <ProjectTeam members={team} />
              <RelatedProjects projects={related} />
              <ProjectLineage entries={lineage} />
              <ContributionHistory entries={contributions} />
              <Collaboration
                projectId={project.id}
                isOwner={isOwner}
                canRequest={canRequest}
                requests={collaboration}
              />
              <Milestones
                projectId={project.id}
                milestones={milestoneResult.data ?? []}
                isOwner={isOwner}
              />
              <Versions
                projectId={project.id}
                isOwner={isOwner}
                versions={(versionResult.data ?? []).map((version) => ({
                  id: version.id,
                  title: version.title,
                  note: version.note,
                  when: formatWhen(version.created_at),
                }))}
              />
            </>
          ) : null}
          {tab === "commits" ? (
            <Commits projectId={project.id} slug={slug} canCommit={onProject} />
          ) : null}
          {tab === "pulls" ? (
            <Pulls
              projectId={project.id}
              slug={slug}
              description={project.description}
              isFork={Boolean(project.parent_project_id)}
              isOwner={isOwner}
              canOpen={isOwner && Boolean(project.parent_project_id)}
            />
          ) : null}
          {tab === "threads" ? <Threads projectId={project.id} slug={slug} threadId={query.thread} /> : null}
        </div>
        <aside className="project-about" aria-label="Project type">
          <h2>Type</h2>
          <p className="type-name">{project.category}</p>
          <p>{typeNote ?? "A builder project."}</p>
          <dl>
            <div>
              <dt>Owner</dt>
              <dd>{ownerResult.data?.display_name ?? username}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd className="project-status">{projectStatusLabel(project.status)}</dd>
            </div>
            <div>
              <dt>Forks</dt>
              <dd>{forksResult.data?.length ?? 0}</dd>
            </div>
          </dl>
          {isOwner ? (
            <ProjectAnalytics
              followers={followCount.count ?? 0}
              saves={Number(saveCount.data ?? 0)}
              forks={forksResult.data?.length ?? 0}
              updates={logs.length}
              threads={threadCount.count ?? 0}
              team={roster.length}
              requests={requests.filter((request) => request.status === "pending").length}
            />
          ) : null}
        </aside>
      </div>
    </article>
  );
}

function Overview({
  description,
  forks,
}: {
  description: string;
  forks: { name: string; slug: string }[];
}) {
  return (
    <section aria-labelledby="about-project">
      <h2 id="about-project">About</h2>
      <p>{description}</p>
      {forks.length > 0 ? (
        <>
          <h2>Forks</h2>
          <ul className="repo-list" role="list">
            {forks.map((fork) => (
              <li key={fork.slug} className="repo-row">
                <Link href={`/forge/${fork.slug}`}>{fork.name}</Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

async function Commits({
  projectId,
  slug,
  canCommit,
}: {
  projectId: string;
  slug: string;
  canCommit: boolean;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("build_logs")
    .select("id, title, content, media_urls, kind, created_at")
    .eq("project_id", projectId)
    .is("removed_at", null)
    .order("created_at", { ascending: false });
  const commits = data ?? [];
  return (
    <section aria-labelledby="commits-heading">
      <h2 id="commits-heading">Commits</h2>
      <p className="form-note">A commit records a change on this copy of the project.</p>
      {canCommit ? <CommitForm projectId={projectId} slug={slug} /> : null}
      {commits.length === 0 ? <p className="repo-empty">No commits yet.</p> : null}
      <ol className="repo-list">
        {commits.map((commit) => (
          <li key={commit.id} className="repo-row">
            <strong>{commit.title}</strong>
            {commit.kind !== "update" ? <span className="repo-visibility">{buildLogKindLabel(commit.kind)}</span> : null}
            <p>{commit.content}</p>
            <LogMedia urls={commit.media_urls} title={commit.title} />
            <p className="repo-meta">{formatWhen(commit.created_at)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

async function Pulls({
  projectId,
  slug,
  description,
  isFork,
  isOwner,
  canOpen,
}: {
  projectId: string;
  slug: string;
  description: string;
  isFork: boolean;
  isOwner: boolean;
  canOpen: boolean;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_pull_requests")
    .select("id, title, body, proposed_description, status, created_at, author_id, target_project_id")
    .or(`target_project_id.eq.${projectId},source_project_id.eq.${projectId}`)
    .order("created_at", { ascending: false });
  const requests = data ?? [];
  return (
    <section aria-labelledby="pulls-heading">
      <h2 id="pulls-heading">Pull requests</h2>
      <p className="form-note">
        Open a pull request from a fork. The original description changes only when its owner merges.
      </p>
      {canOpen ? <PullRequestForm projectId={projectId} slug={slug} currentDescription={description} /> : null}
      {!isFork && !isOwner ? <p className="repo-empty">Fork this project before you open a pull request.</p> : null}
      {requests.length === 0 ? <p className="repo-empty">No pull requests yet.</p> : null}
      <ul className="repo-list" role="list">
        {requests.map((request) => (
          <li key={request.id} className="repo-row">
            <div className="repo-title">
              <strong>{request.title}</strong>
              <span className="repo-visibility">{request.status}</span>
            </div>
            <p>{request.body}</p>
            <p className="repo-meta">Proposed description: {request.proposed_description}</p>
            {isOwner && request.status === "open" && request.target_project_id === projectId ? (
              <form className="form-actions" action={reviewPullRequest}>
                <input type="hidden" name="requestId" value={request.id} />
                <input type="hidden" name="slug" value={slug} />
                <button className="text-button" type="submit" name="decision" value="merged">
                  Merge
                </button>
                <button className="text-button" type="submit" name="decision" value="closed">
                  Close
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

async function Threads({
  projectId,
  slug,
  threadId,
}: {
  projectId: string;
  slug: string;
  threadId?: string;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, content, created_at")
    .eq("project_id", projectId)
    .eq("type", "idea")
    .is("removed_at", null)
    .order("created_at", { ascending: false });
  const threads = data ?? [];
  const open = threads.find((thread) => thread.id === threadId) ?? null;
  const { data: replies } = open
    ? await supabase
        .from("comments")
        .select("id, content, created_at")
        .eq("post_id", open.id)
        .is("removed_at", null)
        .order("created_at", { ascending: true })
    : { data: [] };

  return (
    <section aria-labelledby="threads-heading">
      <h2 id="threads-heading">Threads</h2>
      <p className="form-note">Start a thread to propose a change. Replies stay here and leave the project as it is.</p>
      <ThreadForm projectId={projectId} slug={slug} />
      {threads.length === 0 ? <p className="repo-empty">No threads yet.</p> : null}
      <ul className="repo-list" role="list">
        {threads.map((thread) => (
          <li key={thread.id} className="repo-row">
            <Link href={`/forge/${slug}?tab=threads&thread=${thread.id}`}>
              <strong>{thread.title}</strong>
            </Link>
            <p>{thread.content}</p>
            {open?.id === thread.id ? (
              <div className="thread-replies">
                {(replies ?? []).map((reply) => (
                  <p key={reply.id}>{reply.content}</p>
                ))}
                <ReplyForm postId={thread.id} slug={slug} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatWhen(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
