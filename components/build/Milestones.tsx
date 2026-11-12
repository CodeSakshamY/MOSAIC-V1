import { addMilestone, highlightMilestone, removeMilestone } from "@/lib/projects/actions";
import { formatProjectDay } from "@/lib/projects/timeline";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MajorMilestones({
  milestones,
}: {
  milestones: { id: string; title: string; happens_on: string }[];
}) {
  if (milestones.length === 0) return null;
  return (
    <section className="project-major" aria-labelledby="major-milestones-heading">
      <h2 id="major-milestones-heading">Major milestones</h2>
      <ul className="repo-list">
        {milestones.map((milestone) => (
          <li key={milestone.id}>
            <strong>{milestone.title}</strong>
            <span className="repo-visibility">Major</span>
            <p className="repo-meta">{formatProjectDay(milestone.happens_on)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Milestones({
  projectId,
  milestones,
  isOwner,
}: {
  projectId: string;
  milestones: { id: string; title: string; happens_on: string; major: boolean }[];
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
                {milestone.major ? <span className="repo-visibility">Major</span> : null}
              </p>
              {isOwner ? (
                <form action={highlightMilestone}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="milestoneId" value={milestone.id} />
                  <input type="hidden" name="major" value={milestone.major ? "0" : "1"} />
                  <button className="text-button" type="submit">
                    {milestone.major ? `Remove highlight ${milestone.title}` : `Highlight ${milestone.title}`}
                  </button>
                </form>
              ) : null}
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
          <div className="field">
            <input id="milestone-major" name="major" type="checkbox" value="1" />
            <Label htmlFor="milestone-major">Highlight as major</Label>
          </div>
          <button className="text-button" type="submit">
            Add milestone
          </button>
        </form>
      ) : null}
    </section>
  );
}
