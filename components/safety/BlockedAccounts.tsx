import Link from "next/link";
import { unblock } from "@/lib/safety/actions";
import { createClient } from "@/lib/supabase/server";

export async function BlockedAccounts({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: blocks } = await supabase
    .from("blocks")
    .select("blocked_id, created_at")
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });
  const ids = (blocks ?? []).map((row) => row.blocked_id);
  const { data: profiles } = ids.length
    ? await supabase.from("profile_directory").select("id, username, display_name").in("id", ids).is("deleted_at", null)
    : { data: [] };
  const people = (profiles ?? []).filter((person) => person.username);

  return (
    <section className="profile-section" aria-labelledby="blocked-heading">
      <h2 id="blocked-heading">Blocked accounts</h2>
      {people.length === 0 ? (
        <p>You have not blocked anyone.</p>
      ) : (
        <ul className="notification-list" role="list">
          {people.map((person) => (
            <li key={person.id} className="notification-row">
              <Link href={`/people/${person.username}`}>{person.display_name}</Link>
              <form action={unblock}>
                <input type="hidden" name="username" value={person.username ?? ""} />
                <button className="text-button" type="submit">
                  Unblock
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
