import Link from "next/link";

export function RelatedProjects({
  projects,
}: {
  projects: { id: string; name: string; slug: string; note: string }[];
}) {
  return (
    <section className="project-related" aria-labelledby="project-related-heading">
      <h2 id="project-related-heading">Related</h2>
      <p className="form-note">Public projects that share a tool or the same subcategory.</p>
      {projects.length === 0 ? <p className="repo-empty">No related projects yet.</p> : null}
      <ul className="repo-list">
        {projects.map((project) => (
          <li key={project.id}>
            <Link href={`/forge/${project.slug}`}>{project.name}</Link>
            <p className="repo-meta">{project.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
