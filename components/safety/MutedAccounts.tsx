import Link from "next/link";
import { toggleMute } from "@/lib/safety/actions";
import { createClient } from "@/lib/supabase/server";

export async function MutedAccounts({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: mutes } = await supabase.from("mutes").select("muted_id").eq("profile_id", userId).order("created_at", { ascending: false });
  const ids = (mutes ?? []).map((row) => row.muted_id);
  const { data: profiles } = ids.length
    ? await supabase.from("profile_directory").select("id, username, display_name").in("id", ids).is("deleted_at", null)
    : { data: [] };
  const people = (profiles ?? []).filter((person) => person.username);

  return (
    <section className="profile-section" aria-labelledby="muted-heading">
      <h2 id="muted-heading">Muted accounts</h2>
      <p className="form-note">Muted people stay on MOSAIC. Their posts drop out of your feed.</p>
      {people.length === 0 ? (
        <p>You have not muted anyone.</p>
      ) : (
        <ul className="notification-list" role="list">
          {people.map((person) => (
            <li key={person.id} className="notification-row">
              <Link href={`/people/${person.username}`}>{person.display_name}</Link>
              <form action={toggleMute}>
                <input type="hidden" name="username" value={person.username ?? ""} />
                <button className="text-button" type="submit">
                  Unmute
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
