import { inviteToProject } from "@/lib/projects/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteForm({ projectId }: { projectId: string }) {
  return (
    <form className="form-stack" action={inviteToProject}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <Label htmlFor="invite-username">Invite a builder</Label>
        <Input id="invite-username" name="username" required maxLength={24} />
      </div>
      <button className="text-button" type="submit">
        Send invite
      </button>
    </form>
  );
}
