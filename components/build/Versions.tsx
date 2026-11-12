import { addVersion, removeVersion } from "@/lib/projects/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function Versions({
  projectId,
  versions,
  isOwner,
}: {
  projectId: string;
  versions: { id: string; title: string; note: string | null; when: string }[];
  isOwner: boolean;
}) {
  return (
    <section className="project-versions" aria-labelledby="project-versions-heading">
      <h2 id="project-versions-heading">Versions</h2>
      <p className="form-note">Newest first. A version is a named point in the project.</p>
      {versions.length === 0 ? <p className="repo-empty">No versions yet.</p> : null}
      <ol className="repo-list">
        {versions.map((version) => (
          <li key={version.id}>
            <p>
              {version.title}
              <span className="repo-meta"> · {version.when}</span>
            </p>
            {version.note ? <p>{version.note}</p> : null}
            {isOwner ? (
              <form action={removeVersion}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="versionId" value={version.id} />
                <button className="text-button" type="submit">
                  Remove {version.title}
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ol>
      {isOwner ? (
        <form className="form-stack" action={addVersion}>
          <input type="hidden" name="projectId" value={projectId} />
          <div className="field">
            <Label htmlFor="version-title">Version</Label>
            <Input id="version-title" name="title" required maxLength={80} />
          </div>
          <div className="field">
            <Label htmlFor="version-note">Note</Label>
            <Textarea id="version-note" name="note" rows={3} maxLength={1000} />
          </div>
          <button className="text-button" type="submit">
            Save version
          </button>
        </form>
      ) : null}
    </section>
  );
}
