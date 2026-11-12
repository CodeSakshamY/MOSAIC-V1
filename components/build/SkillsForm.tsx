import { updateSkillsRequired } from "@/lib/projects/actions";

export function SkillsForm({
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
    <form className="form-stack" action={updateSkillsRequired}>
      <input type="hidden" name="projectId" value={projectId} />
      <fieldset className="field">
        <legend>Skills required</legend>
        <ul id="project-skills" className="choice-list" role="list">
          {skills.map((skill) => (
            <li key={skill.id}>
              <label>
                <input type="checkbox" name="skill" value={skill.id} defaultChecked={chosen.has(skill.id)} /> {skill.name}
              </label>
            </li>
          ))}
        </ul>
        <p className="form-note">Optional. Pick up to 8 skills this project needs.</p>
      </fieldset>
      <button className="text-button" type="submit">
        Save skills
      </button>
    </form>
  );
}
