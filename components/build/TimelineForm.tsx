import { updateTimeline } from "@/lib/projects/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TimelineForm({
  projectId,
  startsOn,
  endsOn,
}: {
  projectId: string;
  startsOn: string | null;
  endsOn: string | null;
}) {
  return (
    <form className="form-stack" action={updateTimeline}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <Label htmlFor="timeline-start">Start</Label>
        <Input id="timeline-start" name="startsOn" type="date" min="2000-01-01" max="2100-12-31" defaultValue={startsOn ?? ""} />
      </div>
      <div className="field">
        <Label htmlFor="timeline-end">End</Label>
        <Input id="timeline-end" name="endsOn" type="date" min="2000-01-01" max="2100-12-31" defaultValue={endsOn ?? ""} />
      </div>
      <p className="form-note">Optional. Leave a date empty to clear it. The end stays on or after the start.</p>
      <button className="text-button" type="submit">
        Save timeline
      </button>
    </form>
  );
}
