export function ProjectAnalytics({
  followers,
  saves,
  forks,
  updates,
  threads,
  team,
  requests,
}: {
  followers: number;
  saves: number;
  forks: number;
  updates: number;
  threads: number;
  team: number;
  requests: number;
}) {
  const rows = [
    ["followers", "Followers", followers],
    ["saves", "Saves", saves],
    ["forks", "Forks", forks],
    ["updates", "Updates", updates],
    ["threads", "Threads", threads],
    ["team", "Team", team],
    ["requests", "Requests", requests],
  ] as const;
  return (
    <section className="project-analytics" aria-labelledby="project-analytics-heading">
      <h2 id="project-analytics-heading">Analytics</h2>
      <p className="form-note">Counts from this project. Only the owner sees them.</p>
      <dl>
        {rows.map(([key, label, value]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd data-count={key}>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
