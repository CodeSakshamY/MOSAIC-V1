"use client";

import { useActionState, useState } from "react";
import { createProject } from "@/lib/projects/actions";
import { projectCategories, projectSlug } from "@/lib/projects/slug";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewProjectForm({ username }: { username: string }) {
  const [state, action] = useActionState(createProject, null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const link = projectSlug(slugEdited ? slug : name);

  return (
    <form className="form-stack new-project-form" action={action}>
      <div className="field">
        <Label htmlFor="project-name">Project name</Label>
        <Input
          id="project-name"
          name="name"
          required
          minLength={3}
          maxLength={80}
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="field">
        <Label htmlFor="project-slug">Project link</Label>
        <Input
          id="project-slug"
          name="slug"
          required
          minLength={3}
          maxLength={60}
          autoComplete="off"
          value={slugEdited ? slug : link}
          onChange={(event) => {
            setSlugEdited(true);
            setSlug(event.target.value);
          }}
        />
        <p className="form-note">
          {username || "you"}/{link || "project-name"}
        </p>
      </div>
      <div className="field">
        <Label htmlFor="project-description">Description</Label>
        <Input id="project-description" name="description" required maxLength={200} />
      </div>
      <div className="field">
        <Label htmlFor="project-category">Category</Label>
        <select id="project-category" name="category" className="field-select" required defaultValue="Software">
          {projectCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <Label htmlFor="project-cover">Cover photo</Label>
        <Input id="project-cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" />
        <p className="form-note">Optional. It shows on Discover for public projects.</p>
      </div>
      <fieldset className="field">
        <legend>Visibility</legend>
        <label className="visibility-choice">
          <input type="radio" name="visibility" value="public" defaultChecked />
          Public — anyone can read it
        </label>
        <label className="visibility-choice">
          <input type="radio" name="visibility" value="private" />
          Private — only you can read it
        </label>
      </fieldset>
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton>Create project</SubmitButton>
    </form>
  );
}
