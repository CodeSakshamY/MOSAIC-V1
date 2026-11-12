import { createClient } from "@/lib/supabase/server";

export async function RecommendedCommunities({ memberId }: { memberId: string }) {
  const supabase = await createClient();
  const { data: mine } = await supabase.from("profile_communities").select("name").eq("profile_id", memberId);
  const names = [...new Set((mine ?? []).map((row) => row.name))];
  if (names.length === 0) return null;
  const { data: others } = await supabase
    .from("profile_communities")
    .select("name")
    .in("name", names)
    .neq("profile_id", memberId)
    .limit(40);
  const shared = [...new Set((others ?? []).map((row) => row.name))].slice(0, 8);
  if (shared.length === 0) return null;
  return (
    <section className="profile-section" aria-labelledby="listed-communities-heading">
      <h2 id="listed-communities-heading">Communities builders listed</h2>
      <p className="form-note">Names other builders typed on their profiles. MOSAIC groups are not open yet.</p>
      <ul className="skill-row" role="list">
        {shared.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </section>
  );
}
