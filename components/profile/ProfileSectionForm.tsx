"use client";

import { useActionState } from "react";
import { addProfileSection } from "@/lib/profile/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProfileSectionForm() {
  const [state, action] = useActionState(addProfileSection, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="section-title">Section title</Label>
        <Input id="section-title" name="title" required maxLength={80} />
      </div>
      <div className="field">
        <Label htmlFor="section-body">Section</Label>
        <Textarea id="section-body" name="body" required maxLength={2000} rows={4} />
      </div>
      <p className="form-note">Up to 5 sections.</p>
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="text-button" type="submit">
        Add section
      </button>
    </form>
  );
}
