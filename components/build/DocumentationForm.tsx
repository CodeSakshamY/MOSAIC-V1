import { updateDocumentation } from "@/lib/projects/actions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DocumentationForm({
  projectId,
  documentation,
}: {
  projectId: string;
  documentation: string | null;
}) {
  return (
    <form className="form-stack" action={updateDocumentation}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <Label htmlFor="project-documentation">Documentation</Label>
        <Textarea
          id="project-documentation"
          name="documentation"
          rows={6}
          maxLength={8000}
          defaultValue={documentation ?? ""}
        />
        <p className="form-note">Optional. The written record for this project. Leave it empty to clear it.</p>
      </div>
      <button className="text-button" type="submit">
        Save documentation
      </button>
    </form>
  );
}
