import { updateStatus } from "@/lib/projects/actions";
import { projectStatuses, type ProjectStatus } from "@/lib/projects/slug";
import { Label } from "@/components/ui/label";

export function StatusForm({ projectId, status }: { projectId: string; status: ProjectStatus }) {
  return (
    <form className="form-stack" action={updateStatus}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <Label htmlFor="edit-status">Status</Label>
        <select id="edit-status" name="status" className="field-select" defaultValue={status}>
          {projectStatuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <button className="text-button" type="submit">
        Save status
      </button>
    </form>
  );
}
