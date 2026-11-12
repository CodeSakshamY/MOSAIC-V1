import Link from "next/link";

export function RelatedUpdates({
  updates,
}: {
  updates: { id: string; title: string; projectName: string; slug: string }[];
}) {
  return (
    <section aria-labelledby="related-updates-heading">
      <h2 id="related-updates-heading">Related updates</h2>
      <p className="form-note">Build logs from other public projects in this category.</p>
      {updates.length === 0 ? <p>No related updates yet.</p> : null}
      <ul className="repo-list" role="list">
        {updates.map((update) => (
          <li key={update.id} className="repo-row">
            <div className="repo-title">
              <Link href={`/forge/${update.slug}`}>{update.title}</Link>
              <span className="repo-visibility">{update.projectName}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
