"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/profile/actions";
import { passwordHint } from "@/lib/auth/validation";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProfileEditForm({
  displayName,
  username,
  bio,
  city,
  state,
  github,
  website,
}: {
  displayName: string;
  username: string;
  bio: string | null;
  city: string | null;
  state: string | null;
  github: string | null;
  website: string | null;
}) {
  const [formState, action] = useActionState(updateProfile, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="edit-banner">Banner</Label>
        <Input id="edit-banner" name="banner" type="file" accept="image/jpeg,image/png,image/webp" />
        <p className="form-note">A wide photo across the top. JPEG, PNG, or WebP, up to 5 MB.</p>
      </div>
      <div className="field">
        <Label htmlFor="edit-avatar">Profile photo</Label>
        <Input id="edit-avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" />
        <p className="form-note">JPEG, PNG, or WebP, up to 2 MB. Leave it empty to keep the current photo.</p>
      </div>
      <div className="field">
        <Label htmlFor="edit-name">Name</Label>
        <Input id="edit-name" name="displayName" required maxLength={60} defaultValue={displayName} />
      </div>
      <div className="field">
        <Label htmlFor="edit-username">Username</Label>
        <Input id="edit-username" name="username" required minLength={3} maxLength={24} defaultValue={username} />
      </div>
      <div className="field">
        <Label htmlFor="edit-bio">Bio</Label>
        <Textarea id="edit-bio" name="bio" maxLength={280} rows={4} defaultValue={bio ?? ""} />
        <p className="form-note">Up to 280 characters. This is the Bio section on your profile.</p>
      </div>
      <div className="field">
        <Label htmlFor="edit-city">City</Label>
        <Input id="edit-city" name="city" maxLength={80} defaultValue={city ?? ""} />
      </div>
      <div className="field">
        <Label htmlFor="edit-state">State</Label>
        <Input id="edit-state" name="state" maxLength={80} defaultValue={state ?? ""} />
      </div>
      <div className="field">
        <Label htmlFor="edit-github">GitHub username</Label>
        <Input id="edit-github" name="github" maxLength={39} defaultValue={github ?? ""} />
      </div>
      <div className="field">
        <Label htmlFor="edit-website">Website</Label>
        <Input id="edit-website" name="website" type="url" placeholder="https://" defaultValue={website ?? ""} />
      </div>
      <div className="field">
        <Label htmlFor="edit-password">New password</Label>
        <Input id="edit-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} />
        <p className="form-note">Leave this blank to keep your current password. {passwordHint}</p>
      </div>
      {formState?.error ? (
        <p className="form-error" role="alert">
          {formState.error}
        </p>
      ) : null}
      <SubmitButton>Save profile</SubmitButton>
    </form>
  );
}
