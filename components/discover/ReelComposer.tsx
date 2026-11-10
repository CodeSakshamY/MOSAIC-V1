"use client";

import { useActionState } from "react";
import { createReel } from "@/lib/discover/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReelComposer() {
  const [state, action] = useActionState(createReel, null);
  return (
    <form className="form-stack reel-composer" action={action}>
      <div className="field">
        <Label htmlFor="reel-media">Photo or reel</Label>
        <Input id="reel-media" name="media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" required />
        <p className="form-note">Photos up to 5 MB. MP4 or WebM reels up to 32 MB.</p>
      </div>
      <div className="field">
        <Label htmlFor="reel-caption">Caption</Label>
        <Input id="reel-caption" name="caption" maxLength={160} />
      </div>
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton>Post</SubmitButton>
    </form>
  );
}
