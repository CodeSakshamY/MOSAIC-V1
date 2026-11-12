"use client";

import { useActionState } from "react";
import { announceOpportunity } from "@/lib/opportunities/actions";
import { opportunityCategories } from "@/lib/opportunities/categories";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function OpportunityForm() {
  const [state, action] = useActionState(announceOpportunity, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="opportunity-title">Title</Label>
        <Input id="opportunity-title" name="title" required minLength={3} maxLength={160} />
      </div>
      <div className="field">
        <Label htmlFor="opportunity-organizer">Organiser</Label>
        <Input id="opportunity-organizer" name="organizer" required maxLength={120} />
      </div>
      <div className="field">
        <Label htmlFor="opportunity-category">Category</Label>
        <select id="opportunity-category" name="category" className="field-select" defaultValue="hackathon">
          {opportunityCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <Label htmlFor="opportunity-url">Official link</Label>
        <Input id="opportunity-url" name="url" type="url" required placeholder="https://" maxLength={300} />
      </div>
      <div className="field">
        <Label htmlFor="opportunity-deadline">Deadline</Label>
        <Input id="opportunity-deadline" name="deadline" type="date" />
        <p className="form-note">Leave this empty when the organiser has not published a deadline.</p>
      </div>
      <div className="field">
        <Label htmlFor="opportunity-description">Details</Label>
        <Textarea id="opportunity-description" name="description" required maxLength={8000} rows={4} />
      </div>
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="text-button" type="submit">
        Announce
      </button>
    </form>
  );
}
