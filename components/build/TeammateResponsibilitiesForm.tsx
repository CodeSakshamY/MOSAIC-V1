import { saveTeammateResponsibilities } from "@/lib/projects/actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TeammateResponsibilitiesForm({
  projectId,
  responsibilities,
}: {
  projectId: string;
  responsibilities: string | null;
}) {
  return (
    <form className="form-stack" action={saveTeammateResponsibilities}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <Label htmlFor="teammate-responsibilities">Responsibilities</Label>
        <Textarea
          id="teammate-responsibilities"
          name="responsibilities"
          defaultValue={responsibilities ?? ""}
          maxLength={500}
          rows={3}
        />
        <p className="form-note">The contribution you expect. Leave it blank to remove it.</p>
      </div>
      <button className="text-button" type="submit">
        Save responsibilities
      </button>
    </form>
  );
}
