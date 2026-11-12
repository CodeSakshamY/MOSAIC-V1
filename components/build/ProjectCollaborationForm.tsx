import { saveProjectCollaboration } from "@/lib/projects/actions";
import { collaborationPreferences, type CollaborationPreference } from "@/lib/profile/collaboration";
import { Label } from "@/components/ui/label";

export function ProjectCollaborationForm({
  projectId,
  value,
}: {
  projectId: string;
  value: CollaborationPreference | null;
}) {
  return (
    <form className="form-stack" action={saveProjectCollaboration}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <Label htmlFor="project-collaboration">Where teammates meet</Label>
        <select id="project-collaboration" name="collaboration" className="field-select" defaultValue={value ?? ""}>
          <option value="">No preference</option>
          {collaborationPreferences.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <button className="text-button" type="submit">
        Save meeting preference
      </button>
    </form>
  );
}
