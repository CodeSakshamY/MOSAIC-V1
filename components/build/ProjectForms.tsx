"use client";

import { useActionState } from "react";
import {
  createCommit,
  openPullRequest,
  replyToThread,
  startThread,
} from "@/lib/projects/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/auth/actions";

function ErrorLine({ state }: { state: ActionState }) {
  if (!state?.error) return null;
  return (
    <p className="form-error" role="alert">
      {state.error}
    </p>
  );
}

export function CommitForm({ projectId, slug }: { projectId: string; slug: string }) {
  const [state, action] = useActionState(createCommit, null);
  return (
    <form className="form-stack" action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="field">
        <Label htmlFor="commit-title">Commit title</Label>
        <Input id="commit-title" name="title" required maxLength={120} />
      </div>
      <div className="field">
        <Label htmlFor="commit-body">What changed</Label>
        <Textarea id="commit-body" name="content" required rows={4} />
      </div>
      <ErrorLine state={state} />
      <SubmitButton>Commit</SubmitButton>
    </form>
  );
}

export function PullRequestForm({
  projectId,
  slug,
  currentDescription,
}: {
  projectId: string;
  slug: string;
  currentDescription: string;
}) {
  const [state, action] = useActionState(openPullRequest, null);
  return (
    <form className="form-stack" action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="field">
        <Label htmlFor="pr-title">Pull request title</Label>
        <Input id="pr-title" name="title" required maxLength={120} />
      </div>
      <div className="field">
        <Label htmlFor="pr-body">Why this change</Label>
        <Textarea id="pr-body" name="body" required rows={3} />
      </div>
      <div className="field">
        <Label htmlFor="pr-proposed">Proposed description</Label>
        <Textarea
          id="pr-proposed"
          name="proposed"
          required
          maxLength={200}
          rows={3}
          defaultValue={currentDescription}
        />
        <p className="form-note">The original project keeps its description until its owner merges this.</p>
      </div>
      <ErrorLine state={state} />
      <SubmitButton>Open pull request</SubmitButton>
    </form>
  );
}

export function ThreadForm({ projectId, slug }: { projectId: string; slug: string }) {
  const [state, action] = useActionState(startThread, null);
  return (
    <form className="form-stack" action={action}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="field">
        <Label htmlFor="thread-title">Thread title</Label>
        <Input id="thread-title" name="title" required maxLength={160} />
      </div>
      <div className="field">
        <Label htmlFor="thread-body">Proposal</Label>
        <Textarea id="thread-body" name="content" required rows={4} />
        <p className="form-note">A thread can explore a change. It does not edit the project.</p>
      </div>
      <div className="field">
        <Label htmlFor="thread-photo">Photo</Label>
        <Input id="thread-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      </div>
      <ErrorLine state={state} />
      <SubmitButton>Start thread</SubmitButton>
    </form>
  );
}

export function ReplyForm({ postId, slug }: { postId: string; slug: string }) {
  const [state, action] = useActionState(replyToThread, null);
  return (
    <form className="form-stack" action={action}>
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />
      <div className="field">
        <Label htmlFor="thread-reply">Reply</Label>
        <Textarea id="thread-reply" name="content" required maxLength={2000} rows={3} />
      </div>
      <ErrorLine state={state} />
      <SubmitButton>Reply</SubmitButton>
    </form>
  );
}
