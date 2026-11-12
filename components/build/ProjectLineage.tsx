import Link from "next/link";

export function ProjectLineage({
  entries,
}: {
  entries: { id: string; kind: string; name: string; slug: string; people: string }[];
}) {
  return (
    <section className="project-lineage" aria-labelledby="project-lineage-heading">
      <h2 id="project-lineage-heading">Lineage</h2>
      <p className="form-note">Ancestors, this project, and forks, with the people on each.</p>
      <ol className="repo-list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <p>
              <span className="repo-meta">{entry.kind}</span>{" "}
              {entry.kind === "This project" ? (
                entry.name
              ) : (
                <Link href={`/forge/${entry.slug}`}>{entry.name}</Link>
              )}
            </p>
            <p>{entry.people || "No contributors listed."}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
