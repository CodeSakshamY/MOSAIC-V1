import { updateCredits } from "@/lib/projects/actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreditsForm({ projectId, credits }: { projectId: string; credits: string | null }) {
  return (
    <form className="form-stack" action={updateCredits}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <Label htmlFor="project-credits">Credits</Label>
        <Textarea id="project-credits" name="credits" rows={4} maxLength={2000} defaultValue={credits ?? ""} />
        <p className="form-note">Optional. Name the people and work this project rests on. Leave it empty to clear it.</p>
      </div>
      <button className="text-button" type="submit">
        Save credits
      </button>
    </form>
  );
}
