import { updateTools } from "@/lib/projects/actions";

export function ToolsForm({
  projectId,
  skills,
  selected,
}: {
  projectId: string;
  skills: { id: string; name: string }[];
  selected: string[];
}) {
  const chosen = new Set(selected);
  return (
    <form className="form-stack" action={updateTools}>
      <input type="hidden" name="projectId" value={projectId} />
      <fieldset className="field">
        <legend>Tools used</legend>
        <ul id="project-tools" className="choice-list" role="list">
          {skills.map((skill) => (
            <li key={skill.id}>
              <label>
                <input type="checkbox" name="tool" value={skill.id} defaultChecked={chosen.has(skill.id)} /> {skill.name}
              </label>
            </li>
          ))}
        </ul>
        <p className="form-note">Optional. Pick up to 8 from the fixed list.</p>
      </fieldset>
      <button className="text-button" type="submit">
        Save tools
      </button>
    </form>
  );
}
