import { updateTagline } from "@/lib/projects/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TaglineForm({ projectId, tagline }: { projectId: string; tagline: string | null }) {
  return (
    <form className="form-stack" action={updateTagline}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <Label htmlFor="project-tagline">Tagline</Label>
        <Input id="project-tagline" name="tagline" maxLength={80} defaultValue={tagline ?? ""} />
      </div>
      <button className="text-button" type="submit">
        Save tagline
      </button>
    </form>
  );
}
