import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Person = { id: string; username: string | null; display_name: string };

function People({ people }: { people: Person[] }) {
  const visible = people.filter((person) => person.username);
  if (visible.length === 0) return <p className="form-note">None yet.</p>;
  return (
    <ul className="skill-row" role="list">
      {visible.map((person) => (
        <li key={person.id}>
          <Link href={`/people/${person.username}`}>{person.display_name}</Link>
        </li>
      ))}
    </ul>
  );
}

export async function FoundingTeams() {
  const supabase = await createClient();
  const [{ data: founders }, { data: schools }] = await Promise.all([
    supabase
      .from("profile_directory")
      .select("id, username, display_name")
      .eq("visibility", "public")
      .eq("onboarding_complete", true)
      .contains("looking_for", ["projects"])
      .order("display_name")
      .limit(30),
    supabase.from("profile_education").select("profile_id").limit(200),
  ]);
  const schoolIds = [...new Set((schools ?? []).map((row) => row.profile_id))];
  const { data: students } = schoolIds.length
    ? await supabase
        .from("profile_directory")
        .select("id, username, display_name")
        .in("id", schoolIds)
        .eq("visibility", "public")
        .eq("onboarding_complete", true)
        .contains("looking_for", ["teammates"])
        .order("display_name")
        .limit(30)
    : { data: [] };
  if ((founders ?? []).length === 0 && (students ?? []).length === 0) return null;
  return (
    <section className="profile-section" aria-labelledby="founding-heading">
      <h2 id="founding-heading">Co-founders and student teams</h2>
      <h3 id="cofounders-heading">Co-founders</h3>
      <p className="form-note">Builders looking to discover projects.</p>
      <People people={founders ?? []} />
      <h3 id="student-teams-heading">Student teams</h3>
      <p className="form-note">Builders who listed a school and are looking for teammates.</p>
      <People people={students ?? []} />
    </section>
  );
}
