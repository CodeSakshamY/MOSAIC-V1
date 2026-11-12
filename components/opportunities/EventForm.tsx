"use client";

import { useActionState } from "react";
import { announceEvent } from "@/lib/opportunities/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EventForm() {
  const [state, action] = useActionState(announceEvent, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="event-title">Event</Label>
        <Input id="event-title" name="title" required minLength={3} maxLength={160} />
      </div>
      <div className="field">
        <Label htmlFor="event-start">Date</Label>
        <Input id="event-start" name="start" type="date" required />
      </div>
      <div className="field">
        <Label htmlFor="event-url">Registration link</Label>
        <Input id="event-url" name="url" type="url" required placeholder="https://" maxLength={300} />
      </div>
      <div className="field">
        <label>
          <input type="checkbox" name="online" value="1" /> Online
        </label>
      </div>
      <div className="field">
        <Label htmlFor="event-description">Details</Label>
        <Textarea id="event-description" name="description" required maxLength={8000} rows={3} />
      </div>
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="text-button" type="submit">
        Announce event
      </button>
    </form>
  );
}
