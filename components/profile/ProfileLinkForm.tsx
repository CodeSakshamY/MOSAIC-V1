"use client";

import { useActionState } from "react";
import { addProfileLink } from "@/lib/profile/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileLinkForm() {
  const [state, action] = useActionState(addProfileLink, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="link-label">Label</Label>
        <Input id="link-label" name="label" required maxLength={40} />
      </div>
      <div className="field">
        <Label htmlFor="link-url">Link</Label>
        <Input id="link-url" name="url" type="url" required placeholder="https://" maxLength={300} />
      </div>
      <p className="form-note">LinkedIn or any other https link. Up to 8.</p>
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="text-button" type="submit">
        Add link
      </button>
    </form>
  );
}
