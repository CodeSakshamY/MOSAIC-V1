"use client";

import { useActionState } from "react";
import { retreatOnboarding, saveOnboarding } from "@/lib/auth/onboarding";
import { lookingForOptions } from "@/lib/auth/looking-for";
import { ageGroups } from "@/lib/profile/age-groups";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; name: string };

export function OnboardingForm({
  step,
  skills,
  interests,
}: {
  step: number;
  skills: Option[];
  interests: Option[];
}) {
  const [state, action] = useActionState(saveOnboarding, null);
  return (
    <form className="form-stack" action={action}>
      <p className="form-note">Step {Math.min(step, 9)} of 9</p>
      {step === 1 ? (
        <>
          <div className="field">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" autoComplete="username" required minLength={3} maxLength={24} />
          </div>
          <div className="field">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" name="displayName" autoComplete="name" required maxLength={60} />
          </div>
        </>
      ) : null}
      {step === 2 ? (
        <div className="field">
          <Label htmlFor="avatar">Profile picture</Label>
          <Input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" />
          <p className="form-note">JPEG, PNG, or WebP. 2 MB maximum. You can skip this.</p>
        </div>
      ) : null}
      {step === 3 ? (
        <>
          <div className="field">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" maxLength={80} />
          </div>
          <div className="field">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" maxLength={80} />
          </div>
          <div className="field">
            <Label htmlFor="country">Country code</Label>
            <Input id="country" name="country" defaultValue="IN" maxLength={2} required />
          </div>
        </>
      ) : null}
      {step === 4 ? (
        <div className="field">
          <Label htmlFor="ageGroup">Age band</Label>
          <select id="ageGroup" name="ageGroup" className="field-select" required defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {ageGroups.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
          <p className="form-note">We store the band, not a date of birth. Under 13 cannot join.</p>
        </div>
      ) : null}
      {step === 5 ? (
        <div className="field">
          <Label htmlFor="education">Education</Label>
          <Input id="education" name="education" maxLength={120} />
          <p className="form-note">Optional. A school or course name is enough.</p>
        </div>
      ) : null}
      {step === 6 ? <ChoiceList name="skill" options={skills} /> : null}
      {step === 7 ? <ChoiceList name="interest" options={interests} /> : null}
      {step === 8 ? (
        <>
          <div className="field">
            <Label htmlFor="github">GitHub username</Label>
            <Input id="github" name="github" autoComplete="off" />
          </div>
          <div className="field">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" placeholder="https://" />
          </div>
        </>
      ) : null}
      {step >= 9 ? (
        <fieldset className="field">
          <legend>What do you want from Polymath?</legend>
          <ul className="choice-list" role="list">
            {lookingForOptions.map((option) => (
              <li key={option.value}>
                <label>
                  <input type="checkbox" name="lookingFor" value={option.value} /> {option.label}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}
      {state?.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="form-actions">
        {step === 2 ? (
          <button className="text-button" type="submit" name="intent" value="skip">
            Skip
          </button>
        ) : null}
        <SubmitButton>{step >= 9 ? "Finish" : "Continue"}</SubmitButton>
      </div>
    </form>
  );
}

function ChoiceList({ name, options }: { name: string; options: Option[] }) {
  return (
    <fieldset className="field">
      <legend>{name === "skill" ? "Skills" : "Interests"}</legend>
      <ul className="choice-list" role="list">
        {options.map((option) => (
          <li key={option.id}>
            <label>
              <input type="checkbox" name={name} value={option.id} /> {option.name}
            </label>
          </li>
        ))}
      </ul>
      <p className="form-note">Optional. Choose any that fit.</p>
    </fieldset>
  );
}

export function BackButton() {
  return (
    <form action={retreatOnboarding}>
      <button className="text-button" type="submit">
        Back
      </button>
    </form>
  );
}
