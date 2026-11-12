import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function PublicPeople() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_directory")
    .select("username, display_name, education, city, state")
    .eq("onboarding_complete", true)
    .eq("visibility", "public")
    .not("username", "is", null)
    .order("display_name")
    .limit(30);
  const people = (data ?? []).filter((person) => person.username);

  return (
    <section className="profile-section" aria-labelledby="discover-people">
      <h2 id="discover-people">People</h2>
      {people.length === 0 ? <p>No public profiles yet.</p> : null}
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
    </section>
  );
}
