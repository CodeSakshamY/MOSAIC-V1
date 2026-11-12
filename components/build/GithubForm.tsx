import { saveGithubUrl } from "@/lib/projects/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GithubForm({ projectId, githubUrl }: { projectId: string; githubUrl: string | null }) {
  return (
    <form className="form-stack" action={saveGithubUrl}>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="field">
        <Label htmlFor="project-github">GitHub repository</Label>
        <Input id="project-github" name="github" type="url" defaultValue={githubUrl ?? ""} maxLength={2000} placeholder="https://github.com/owner/project" />
        <p className="form-note">An https link. Leave it blank to remove it.</p>
      </div>
      <button className="text-button" type="submit">
        Save repository
      </button>
    </form>
  );
}
