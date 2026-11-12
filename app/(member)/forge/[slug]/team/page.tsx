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
  const { data: members } = await supabase
    .from("project_members")
    .select("profile_id, role")
    .eq("project_id", project.id)
    .eq("status", "active");
  const ids = (members ?? []).map((member) => member.profile_id);
  const { data: profiles } = ids.length
    ? await supabase.from("profile_directory").select("id, username, display_name").in("id", ids)
    : { data: [] };
  const people = new Map((profiles ?? []).map((person) => [person.id, person]));
  const team = (members ?? []).flatMap((member) => {
    const person = people.get(member.profile_id);
    if (!person?.username) return [];
    return [{ id: member.profile_id, name: person.display_name || person.username, username: person.username, role: member.role }];
  });

  return (
    <article className="profile-page">
      <header className="page-header">
        <p>
          <Link href={`/forge/${project.slug}`}>{project.name}</Link>
        </p>
        <h1>Team</h1>
      </header>
      <ProjectTeam projectId={project.id} slug={project.slug} editable={false} members={team} />
    </article>
  );
}
