import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function peopleWhoShareAnInterest(memberId: string) {
  const supabase = await createClient();
  const { data: mine } = await supabase.from("profile_interests").select("interest_id").eq("profile_id", memberId);
  const interestIds = (mine ?? []).map((row) => row.interest_id);
  if (interestIds.length === 0) return [];
  const { data: links } = await supabase
    .from("profile_interests")
    .select("profile_id")
    .in("interest_id", interestIds)
    .neq("profile_id", memberId)
    .order("created_at", { ascending: false })
    .limit(40);
  const ids: string[] = [];
  for (const row of links ?? []) {
    if (!ids.includes(row.profile_id)) ids.push(row.profile_id);
    if (ids.length === 8) break;
  }
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("profile_directory")
    .select("id, username, display_name")
    .in("id", ids)
    .eq("visibility", "public")
    .eq("onboarding_complete", true)
    .not("username", "is", null)
    .order("display_name");
  return (data ?? []).filter((person) => person.username);
}

export async function SharedPeople({ memberId }: { memberId: string }) {
  const people = await peopleWhoShareAnInterest(memberId);
  if (people.length === 0) return null;
  return (
    <section className="profile-section" aria-labelledby="shared-builders-heading">
      <h2 id="shared-builders-heading">Builders who share an interest</h2>
      <ul className="skill-row" role="list">
        {people.map((person) => (
          <li key={person.id}>
            <Link href={`/people/${person.username}`}>{person.display_name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
