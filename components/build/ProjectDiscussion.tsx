import { getMember } from "@/lib/auth/session";
import { addProjectDiscussion } from "@/lib/projects/actions";
import { createClient } from "@/lib/supabase/server";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export async function ProjectDiscussion({ projectId }: { projectId: string }) {
  const supabase = await createClient();
  const member = await getMember();
  const { data } = await supabase
    .from("project_discussion")
    .select("id, body, author_id, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  const ids = [...new Set((data ?? []).map((note) => note.author_id))];
  const { data: profiles } = ids.length
    ? await supabase.from("profile_directory").select("id, username, display_name").in("id", ids)
    : { data: [] };
  const names = new Map((profiles ?? []).map((person) => [person.id, person.display_name || person.username]));
  const signedIn = Boolean(member?.onboardingComplete && !member.suspended && !member.deletedAt);

  return (
    <section className="profile-section" aria-labelledby="project-discussion-heading">
      <h2 id="project-discussion-heading">Discussion</h2>
      <p className="form-note">A running conversation, separate from titled threads.</p>
      {(data ?? []).length === 0 ? <p>No discussion yet.</p> : null}
      <ol className="repo-list">
        {(data ?? []).map((note) => (
          <li key={note.id}>
            <p>{note.body}</p>
            <p className="repo-meta">{names.get(note.author_id) ?? "A builder"}</p>
          </li>
        ))}
      </ol>
      {signedIn ? (
        <form className="form-stack" action={addProjectDiscussion}>
          <input type="hidden" name="projectId" value={projectId} />
          <div className="field">
            <Label htmlFor="discussion-body">Add to the discussion</Label>
            <Textarea id="discussion-body" name="body" required maxLength={1000} rows={3} />
          </div>
          <button className="text-button" type="submit">
            Post to discussion
          </button>
        </form>
      ) : null}
    </section>
  );
}
