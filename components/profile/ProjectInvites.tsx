import Link from "next/link";
import { respondToInvite } from "@/lib/projects/actions";
import { createClient } from "@/lib/supabase/server";

export async function ProjectInvites({ memberId }: { memberId: string }) {
  const supabase = await createClient();
  const { data: invites } = await supabase
    .from("project_invites")
    .select("id, project_id")
    .eq("invitee_id", memberId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(8);
  const rows = invites ?? [];
  if (rows.length === 0) return null;
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, slug")
    .in("id", rows.map((row) => row.project_id))
    .eq("visibility", "public")
    .is("removed_at", null);
  const byId = new Map((projects ?? []).map((project) => [project.id, project]));
  const visible = rows.flatMap((row) => {
    const project = byId.get(row.project_id);
    return project ? [{ ...row, project }] : [];
  });
  if (visible.length === 0) return null;
  return (
    <section className="profile-section" aria-labelledby="invitations-heading">
      <h2 id="invitations-heading">Invitations</h2>
      <ul className="repo-list" role="list">
        {visible.map((invite) => (
          <li key={invite.id}>
            <p>
              Invitation to <Link href={`/forge/${invite.project.slug}`}>{invite.project.name}</Link>
            </p>
            <form action={respondToInvite}>
              <input type="hidden" name="inviteId" value={invite.id} />
              <input type="hidden" name="accept" value="1" />
              <button className="text-button" type="submit">
                Accept invitation
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
