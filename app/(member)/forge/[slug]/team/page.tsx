import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectTeam } from "@/components/build/ProjectTeam";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Team",
};

export default async function ProjectTeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("visibility", "public")
    .is("removed_at", null)
    .maybeSingle();
  if (!project) notFound();
  const [{ data: members }, { data: logs }] = await Promise.all([
    supabase.from("project_members").select("profile_id, role, joined_at").eq("project_id", project.id).eq("status", "active"),
    supabase
      .from("build_logs")
      .select("id, title, author_id, created_at")
      .eq("project_id", project.id)
      .is("removed_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const ids = [...new Set([...(members ?? []).map((member) => member.profile_id), ...(logs ?? []).map((log) => log.author_id)])];
  const { data: profiles } = ids.length
    ? await supabase.from("profile_directory").select("id, username, display_name").in("id", ids)
    : { data: [] };
  const people = new Map((profiles ?? []).map((person) => [person.id, person]));
  const team = (members ?? []).flatMap((member) => {
    const person = people.get(member.profile_id);
    if (!person?.username) return [];
    return [{ id: member.profile_id, name: person.display_name || person.username, username: person.username, role: member.role }];
  });
  const activity = [
    ...(members ?? []).flatMap((member) => {
      if (!member.joined_at) return [];
      const person = people.get(member.profile_id);
      return [{ id: `join-${member.profile_id}`, at: member.joined_at, text: `${person?.display_name || "A builder"} joined` }];
    }),
    ...(logs ?? []).map((log) => ({
      id: log.id,
      at: log.created_at,
      text: `${people.get(log.author_id)?.display_name || "A builder"} recorded ${log.title}`,
    })),
  ]
    .sort((left, right) => right.at.localeCompare(left.at))
    .slice(0, 20);

  return (
    <article className="profile-page">
      <header className="page-header">
        <p>
          <Link href={`/forge/${project.slug}`}>{project.name}</Link>
        </p>
        <h1>Team</h1>
      </header>
      <ProjectTeam projectId={project.id} slug={project.slug} editable={false} members={team} />
      <section className="profile-section" aria-labelledby="team-activity-heading">
        <h2 id="team-activity-heading">Activity</h2>
        {activity.length === 0 ? <p className="form-note">No team activity yet.</p> : null}
        <ol className="repo-list">
          {activity.map((item) => (
            <li key={item.id}>{item.text}</li>
          ))}
        </ol>
      </section>
    </article>
  );
}
