import { addMilestone, removeMilestone } from "@/lib/projects/actions";
import { formatProjectDay } from "@/lib/projects/timeline";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Milestones({
  projectId,
  milestones,
  isOwner,
}: {
  projectId: string;
  milestones: { id: string; title: string; happens_on: string }[];
  isOwner: boolean;
}) {
  if (!isOwner && milestones.length === 0) return null;
  return (
    <section aria-labelledby="project-milestones-heading">
      <h2 id="project-milestones-heading">Milestones</h2>
      {milestones.length ? (
        <ol className="project-milestones repo-list">
          {milestones.map((milestone) => (
            <li key={milestone.id}>
              <p>
                {formatProjectDay(milestone.happens_on)} · {milestone.title}
              </p>
              {isOwner ? (
                <form action={removeMilestone}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="milestoneId" value={milestone.id} />
                  <button className="text-button" type="submit">
                    Remove {milestone.title}
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="form-note">No milestones yet.</p>
      )}
      {isOwner ? (
        <form className="form-stack" action={addMilestone}>
          <input type="hidden" name="projectId" value={projectId} />
          <div className="field">
            <Label htmlFor="milestone-title">Milestone</Label>
            <Input id="milestone-title" name="title" required maxLength={80} />
          </div>
          <div className="field">
            <Label htmlFor="milestone-day">Date</Label>
            <Input id="milestone-day" name="happensOn" type="date" required min="2000-01-01" max="2100-12-31" />
          </div>
          <button className="text-button" type="submit">
            Add milestone
          </button>
        </form>
      ) : null}
    </section>
  );
}
