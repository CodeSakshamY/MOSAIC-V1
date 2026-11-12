"use client";

import { useActionState } from "react";
import { requestEmailChange } from "@/lib/auth/actions";

export function EmailChange({ email }: { email: string | null }) {
  const [state, action] = useActionState(requestEmailChange, null);
  return (
    <form className="form-stack" action={action}>
      <h2 id="email-heading">Email</h2>
      <p className="form-note">Current address: {email ?? "Not available"}</p>
      <div className="field">
        <label htmlFor="new-email">New email</label>
        <input id="new-email" name="email" type="email" required maxLength={200} className="repo-search-input" />
      </div>
      {state?.notice ? <p>{state.notice}</p> : null}
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="text-button" type="submit">
        Request email change
      </button>
    </form>
  );
}
