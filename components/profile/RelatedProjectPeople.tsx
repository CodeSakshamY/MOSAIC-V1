import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function RelatedProjectPeople({ memberId }: { memberId: string }) {
  const supabase = await createClient();
  const { data: mine } = await supabase
    .from("projects")
    .select("category")
    .eq("owner_id", memberId)
    .eq("visibility", "public")
    .is("removed_at", null);
  const categories = [...new Set((mine ?? []).map((project) => project.category))];
  if (categories.length === 0) return null;
  const { data: projects } = await supabase
    .from("projects")
    .select("owner_id, category, updated_at")
    .in("category", categories)
    .neq("owner_id", memberId)
    .eq("visibility", "public")
    .is("removed_at", null)
    .order("updated_at", { ascending: false })
    .limit(40);
  const ids: string[] = [];
  for (const project of projects ?? []) {
    if (!ids.includes(project.owner_id)) ids.push(project.owner_id);
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
    <section className="profile-section" aria-labelledby="related-projects-heading">
      <h2 id="related-projects-heading">Related projects</h2>
      <p className="form-note">Builders with a public project in a category you also work in.</p>
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
