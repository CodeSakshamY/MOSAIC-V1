import { LogMedia } from "@/components/build/LogMedia";

export function UpdateHistory({
  updates,
}: {
  updates: { id: string; title: string; content: string; when: string; author: string; media: string[] }[];
}) {
  return (
    <section className="project-updates" aria-labelledby="project-updates-heading">
      <h2 id="project-updates-heading">Updates</h2>
      <p className="form-note">Build logs on this project, newest first. New ones are written from Commits.</p>
      {updates.length === 0 ? <p className="repo-empty">No updates yet.</p> : null}
      <ol className="repo-list">
        {updates.map((update) => (
          <li key={update.id}>
            <strong>{update.title}</strong>
            <p>{update.content}</p>
            <LogMedia urls={update.media} title={update.title} />
            <p className="repo-meta">
              {update.author}
              <span aria-hidden="true">·</span>
              {update.when}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
