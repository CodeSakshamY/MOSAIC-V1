"use client";

import { useActionState } from "react";
import { createFeedPost } from "@/lib/feed/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const kinds = [
  { value: "idea", label: "Idea" },
  { value: "help", label: "Question" },
  { value: "achievement", label: "Achievement" },
] as const;

export function FeedPostForm({ projects }: { projects: { id: string; name: string }[] }) {
  const [state, action] = useActionState(createFeedPost, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="feed-post-type">Kind</Label>
        <select id="feed-post-type" name="type" className="field-select" defaultValue="idea">
          {kinds.map((kind) => (
            <option key={kind.value} value={kind.value}>
              {kind.label}
            </option>
          ))}
          <option value="project">Showcase</option>
        </select>
      </div>
      <div className="field">
        <Label htmlFor="feed-post-project">Project</Label>
        <select id="feed-post-project" name="projectId" className="field-select" defaultValue="">
          <option value="">None</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <p className="form-note">Choose one of your public projects when the kind is Showcase.</p>
      </div>
      <div className="field">
        <Label htmlFor="feed-post-title">Title</Label>
        <Input id="feed-post-title" name="title" required maxLength={160} />
      </div>
      <div className="field">
        <Label htmlFor="feed-post-body">Post</Label>
        <Textarea id="feed-post-body" name="content" required maxLength={8000} rows={4} />
      </div>
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="text-button" type="submit">
        Publish
      </button>
    </form>
  );
}
