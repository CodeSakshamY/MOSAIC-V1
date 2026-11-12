import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function ResearchCollaborators() {
  const supabase = await createClient();
  const { data: interest } = await supabase.from("interests").select("id").eq("slug", "research").maybeSingle();
  const { data: links } = interest
    ? await supabase
        .from("profile_interests")
        .select("profile_id")
        .eq("interest_id", interest.id)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };
  const { data: projects } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("category", "Research")
    .eq("visibility", "public")
    .is("removed_at", null)
    .order("updated_at", { ascending: false })
    .limit(20);
  const ids: string[] = [];
  for (const row of [...(links ?? []), ...(projects ?? []).map((project) => ({ profile_id: project.owner_id }))]) {
    if (!ids.includes(row.profile_id)) ids.push(row.profile_id);
    if (ids.length === 8) break;
  }
  if (ids.length === 0) return null;
  const { data: people } = await supabase
    .from("profile_directory")
    .select("id, username, display_name")
    .in("id", ids)
    .eq("visibility", "public")
    .eq("onboarding_complete", true)
    .not("username", "is", null);
  const byId = new Map((people ?? []).map((person) => [person.id, person]));
  const ordered = ids.map((id) => byId.get(id)).filter((person) => person?.username);
  if (ordered.length === 0) return null;
  return (
    <section className="profile-section" aria-labelledby="research-collaborators-heading">
      <h2 id="research-collaborators-heading">Research collaborators</h2>
      <ul className="skill-row" role="list">
        {ordered.map((person) =>
          person?.username ? (
            <li key={person.id}>
              <Link href={`/people/${person.username}`}>{person.display_name}</Link>
            </li>
          ) : null,
        )}
      </ul>
    </section>
  );
}
