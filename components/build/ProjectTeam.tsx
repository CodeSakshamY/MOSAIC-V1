import Link from "next/link";

const roleLabels: Record<string, string> = {
  owner: "Owner",
  maintainer: "Maintainer",
  contributor: "Contributor",
};

export function ProjectTeam({
  members,
}: {
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
          </li>
        ))}
      </ul>
    </section>
  );
}
