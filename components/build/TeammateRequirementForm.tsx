import { saveTeammateRequirement } from "@/lib/projects/actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TeammateRequirementForm({ projectId, requirement }: { projectId: string; requirement: string | null }) {
  return (
    <form className="form-stack" action={saveTeammateRequirement}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <Label htmlFor="teammate-requirement">Teammate requirement</Label>
        <Textarea id="teammate-requirement" name="requirement" defaultValue={requirement ?? ""} maxLength={500} rows={3} />
        <p className="form-note">What a teammate would do on this project. Leave it blank to remove it.</p>
      </div>
      <button className="text-button" type="submit">
        Publish requirement
      </button>
    </form>
  );
}
