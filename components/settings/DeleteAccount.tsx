"use client";

import { useActionState } from "react";
import { closeAccount } from "@/lib/auth/actions";

export function DeleteAccount() {
  const [state, action] = useActionState(closeAccount, null);
  return (
    <form className="form-stack" action={action}>
      <h2 id="delete-account-heading">Delete account</h2>
      <p className="form-note">This closes the account. The public name becomes Deleted builder. Projects and comments stay attached to that name.</p>
      <div className="field">
        <label htmlFor="close-username">Username</label>
        <input id="close-username" name="username" required maxLength={30} autoComplete="off" className="repo-search-input" />
      </div>
      <label>
        <input id="close-confirm" type="checkbox" name="confirm" value="yes" /> I understand this closes the account
      </label>
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="text-button" type="submit">
        Delete account
      </button>
    </form>
  );
}
