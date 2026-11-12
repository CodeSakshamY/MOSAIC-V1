"use client";

import { useActionState } from "react";
import { saveLookingFor } from "@/lib/profile/actions";
import { lookingForOptions } from "@/lib/auth/looking-for";

export function LookingForForm({ selected }: { selected: string[] }) {
  const chosen = new Set(selected);
  const [state, action] = useActionState(saveLookingFor, null);
  return (
    <form className="form-stack" action={action}>
      <fieldset className="field">
        <legend>Edit what you are looking for</legend>
        <ul className="choice-list" role="list">
          {lookingForOptions.map((option) => (
            <li key={option.value}>
              <label>
                <input type="checkbox" name="lookingFor" value={option.value} defaultChecked={chosen.has(option.value)} />{" "}
                {option.label}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="text-button" type="submit">
        Save looking for
      </button>
    </form>
  );
}
