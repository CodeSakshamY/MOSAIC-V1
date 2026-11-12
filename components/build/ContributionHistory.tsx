export function ContributionHistory({
  entries,
}: {
  entries: { id: string; when: string; text: string }[];
}) {
  return (
    <section className="project-contributions" aria-labelledby="project-contributions-heading">
      <h2 id="project-contributions-heading">Contributions</h2>
      <p className="form-note">Joins and build logs, oldest first.</p>
      {entries.length === 0 ? <p className="repo-empty">No contributions yet.</p> : null}
      <ol className="repo-list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <p>{entry.text}</p>
            <p className="repo-meta">{entry.when}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
