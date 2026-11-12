import { saveInterests } from "@/lib/profile/actions";

export function InterestsForm({
  options,
  selected,
}: {
  options: { id: string; name: string }[];
  selected: string[];
}) {
  const chosen = new Set(selected);
  return (
    <form className="form-stack" action={saveInterests}>
      <fieldset className="field">
        <legend>Edit interests</legend>
        <ul className="choice-list" role="list">
          {options.map((option) => (
            <li key={option.id}>
              <label>
                <input type="checkbox" name="interest" value={option.id} defaultChecked={chosen.has(option.id)} /> {option.name}
              </label>
            </li>
          ))}
        </ul>
        <p className="form-note">Optional. Choose any that fit. An empty save clears them.</p>
      </fieldset>
      <button className="text-button" type="submit">
        Save interests
      </button>
    </form>
  );
}
