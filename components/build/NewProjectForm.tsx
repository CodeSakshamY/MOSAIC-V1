"use client";

import { useActionState, useState } from "react";
import { createProject } from "@/lib/projects/actions";
import { projectCategories, projectSlug, projectSubcategories, type ProjectCategory } from "@/lib/projects/slug";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewProjectForm({ username }: { username: string }) {
  const [state, action] = useActionState(createProject, null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [category, setCategory] = useState<ProjectCategory>("Software");
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
        <Label htmlFor="project-tagline">Tagline</Label>
        <Input id="project-tagline" name="tagline" maxLength={80} />
        <p className="form-note">Optional. One line under the project name. The description stays the longer summary.</p>
      </div>
      <div className="field">
        <Label htmlFor="project-description">Description</Label>
        <Input id="project-description" name="description" required maxLength={200} />
      </div>
      <div className="field">
        <Label htmlFor="project-category">Category</Label>
        <select
          id="project-category"
          name="category"
          className="field-select"
          required
          value={category}
          onChange={(event) => setCategory(event.target.value as ProjectCategory)}
        >
          {projectCategories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <Label htmlFor="project-subcategory">Subcategory</Label>
        <select key={category} id="project-subcategory" name="subcategory" className="field-select" defaultValue="">
          <option value="">None</option>
          {projectSubcategories[category].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <Label htmlFor="project-cover">Cover photo</Label>
        <Input id="project-cover" name="cover" type="file" accept="image/*" />
        <p className="form-note">Optional. Large photos are reduced to fit. It shows on Discover for public projects.</p>
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
