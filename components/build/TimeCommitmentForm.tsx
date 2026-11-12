import { saveTimeCommitment } from "@/lib/projects/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TimeCommitmentForm({ projectId, commitment }: { projectId: string; commitment: string | null }) {
  return (
    <form className="form-stack" action={saveTimeCommitment}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <Label htmlFor="time-commitment">Time commitment</Label>
        <Input id="time-commitment" name="commitment" defaultValue={commitment ?? ""} maxLength={80} />
        <p className="form-note">For example, a few hours a week. Leave it blank to remove it.</p>
      </div>
      <button className="text-button" type="submit">
        Save time
      </button>
    </form>
  );
}
