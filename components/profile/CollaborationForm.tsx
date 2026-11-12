import { saveCollaboration } from "@/lib/profile/actions";
import { collaborationPreferences } from "@/lib/profile/collaboration";
import { Label } from "@/components/ui/label";

export function CollaborationForm({ value }: { value: string | null }) {
  return (
    <form className="form-stack" action={saveCollaboration}>
      <div className="field">
        <Label htmlFor="collaboration-preference">How you like to collaborate</Label>
        <select id="collaboration-preference" name="collaboration" className="field-select" defaultValue={value ?? ""}>
          <option value="">No preference</option>
          {collaborationPreferences.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <button className="text-button" type="submit">
        Save collaboration
      </button>
    </form>
  );
}
