import Link from "next/link";
import { assignProjectRole } from "@/lib/projects/actions";

const roleLabels: Record<string, string> = {
  owner: "Owner",
  maintainer: "Maintainer",
  contributor: "Contributor",
};

export function ProjectTeam({
  projectId,
  editable,
  members,
}: {
  projectId: string;
  editable: boolean;
  members: { id: string; name: string; username: string; role: string }[];
}) {
  return (
    <section className="project-team" aria-labelledby="project-team-heading">
      <h2 id="project-team-heading">Team</h2>
      {members.length === 0 ? <p className="repo-empty">No one is on this project yet.</p> : null}
      <ul className="repo-list">
        {members.map((person) => (
          <li key={person.id}>
            <Link href={`/people/${person.username}`}>{person.name}</Link>
            <span className="repo-visibility">{roleLabels[person.role] ?? person.role}</span>
            {editable && person.role !== "owner" ? (
              <form action={assignProjectRole}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="profileId" value={person.id} />
                <input type="hidden" name="role" value={person.role === "maintainer" ? "contributor" : "maintainer"} />
                <button className="text-button" type="submit">
                  {person.role === "maintainer" ? `Make ${person.name} a contributor` : `Make ${person.name} a maintainer`}
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
