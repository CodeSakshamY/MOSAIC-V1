"use client";

import { useActionState } from "react";
import {
  addAchievement,
  addAward,
  addCertificate,
  addCommunity,
  addCompetition,
  addEducation,
  addExperience,
  addPublication,
} from "@/lib/profile/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function ErrorLine({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="form-error" role="alert">
      {error}
    </p>
  );
}

export function CommunityForm() {
  const [state, action] = useActionState(addCommunity, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="community-name">Community</Label>
        <Input id="community-name" name="name" required maxLength={80} />
      </div>
      <div className="field">
        <Label htmlFor="community-role">Role</Label>
        <Input id="community-role" name="role" maxLength={40} />
      </div>
      <div className="field">
        <Label htmlFor="community-year">Year</Label>
        <Input id="community-year" name="year" inputMode="numeric" maxLength={4} />
      </div>
      <p className="form-note">List a group you have taken part in. MOSAIC groups are not open yet.</p>
      <ErrorLine error={state?.error} />
      <SubmitButton>Add community</SubmitButton>
    </form>
  );
}

export function CompetitionForm() {
  const [state, action] = useActionState(addCompetition, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="competition-name">Competition</Label>
        <Input id="competition-name" name="name" required maxLength={160} />
      </div>
      <div className="field">
        <Label htmlFor="competition-host">Organiser</Label>
        <Input id="competition-host" name="host" maxLength={120} />
      </div>
      <div className="field">
        <Label htmlFor="competition-year">Year</Label>
        <Input id="competition-year" name="year" inputMode="numeric" maxLength={4} />
      </div>
      <div className="field">
        <Label htmlFor="competition-result">Result</Label>
        <Input id="competition-result" name="result" maxLength={80} />
      </div>
      <div className="field">
        <Label htmlFor="competition-url">Link</Label>
        <Input id="competition-url" name="url" type="url" placeholder="https://" maxLength={300} />
      </div>
      <p className="form-note">Write the result yourself. MOSAIC does not rank competitions.</p>
      <ErrorLine error={state?.error} />
      <SubmitButton>Add competition</SubmitButton>
    </form>
  );
}

export function PublicationForm() {
  const [state, action] = useActionState(addPublication, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="publication-title">Title</Label>
        <Input id="publication-title" name="title" required maxLength={160} />
      </div>
      <div className="field">
        <Label htmlFor="publication-venue">Venue</Label>
        <Input id="publication-venue" name="venue" maxLength={120} />
      </div>
      <div className="field">
        <Label htmlFor="publication-year">Year</Label>
        <Input id="publication-year" name="year" inputMode="numeric" maxLength={4} />
      </div>
      <div className="field">
        <Label htmlFor="publication-url">Link</Label>
        <Input id="publication-url" name="url" type="url" placeholder="https://" maxLength={300} />
      </div>
      <div className="field">
        <Label htmlFor="publication-summary">Summary</Label>
        <Textarea id="publication-summary" name="summary" maxLength={500} rows={3} />
      </div>
      <ErrorLine error={state?.error} />
      <SubmitButton>Add publication</SubmitButton>
    </form>
  );
}

export function EducationForm() {
  const [state, action] = useActionState(addEducation, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="school">School or programme</Label>
        <Input id="school" name="school" required maxLength={120} />
      </div>
      <div className="field">
        <Label htmlFor="credential">Credential</Label>
        <Input id="credential" name="credential" maxLength={120} />
      </div>
      <YearFields prefix="education" />
      <ErrorLine error={state?.error} />
      <SubmitButton>Add education</SubmitButton>
    </form>
  );
}

export function ExperienceForm() {
  const [state, action] = useActionState(addExperience, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="role-title">Role</Label>
        <Input id="role-title" name="title" required maxLength={120} />
      </div>
      <div className="field">
        <Label htmlFor="organization">Organisation</Label>
        <Input id="organization" name="organization" required maxLength={120} />
      </div>
      <div className="field">
        <Label htmlFor="summary">What you did</Label>
        <Textarea id="summary" name="summary" maxLength={500} rows={3} />
      </div>
      <YearFields prefix="work" />
      <ErrorLine error={state?.error} />
      <SubmitButton>Add work</SubmitButton>
    </form>
  );
}

export function CertificateForm() {
  const [state, action] = useActionState(addCertificate, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="certificate-name">Certificate</Label>
        <Input id="certificate-name" name="name" required maxLength={160} />
      </div>
      <div className="field">
        <Label htmlFor="issuer">Issuer</Label>
        <Input id="issuer" name="issuer" required maxLength={120} />
      </div>
      <div className="field">
        <Label htmlFor="certificate-year">Year</Label>
        <Input id="certificate-year" name="year" inputMode="numeric" maxLength={4} />
      </div>
      <div className="field">
        <Label htmlFor="credential-url">Link</Label>
        <Input id="credential-url" name="url" type="url" placeholder="https://" />
      </div>
      <PhotoField id="certificate-photo" />
      <ErrorLine error={state?.error} />
      <SubmitButton>Add certificate</SubmitButton>
    </form>
  );
}

export function AchievementForm() {
  const [state, action] = useActionState(addAchievement, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="achievement-title">Achievement</Label>
        <Input id="achievement-title" name="title" required maxLength={160} />
      </div>
      <div className="field">
        <Label htmlFor="achievement-body">What happened</Label>
        <Textarea id="achievement-body" name="content" required maxLength={2000} rows={3} />
      </div>
      <PhotoField id="achievement-photo" />
      <ErrorLine error={state?.error} />
      <SubmitButton>Add achievement</SubmitButton>
    </form>
  );
}

export function AwardForm() {
  const [state, action] = useActionState(addAward, null);
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <Label htmlFor="award-title">Award</Label>
        <Input id="award-title" name="title" required maxLength={160} />
      </div>
      <div className="field">
        <Label htmlFor="award-issuer">Given by</Label>
        <Input id="award-issuer" name="issuer" required maxLength={120} />
      </div>
      <div className="field">
        <Label htmlFor="award-year">Year</Label>
        <Input id="award-year" name="year" inputMode="numeric" maxLength={4} />
      </div>
      <PhotoField id="award-photo" />
      <ErrorLine error={state?.error} />
      <SubmitButton>Add award</SubmitButton>
    </form>
  );
}

function PhotoField({ id }: { id: string }) {
  return (
    <div className="field">
      <Label htmlFor={id}>Photo</Label>
      <Input id={id} name="photo" type="file" accept="image/*" />
      <p className="form-note">Optional. JPEG, PNG, or WebP, up to 5 MB.</p>
    </div>
  );
}

function YearFields({ prefix }: { prefix: string }) {
  return (
    <div className="form-actions">
      <div className="field">
        <Label htmlFor={`${prefix}-start-year`}>Start year</Label>
        <Input id={`${prefix}-start-year`} name="startYear" inputMode="numeric" maxLength={4} />
      </div>
      <div className="field">
        <Label htmlFor={`${prefix}-end-year`}>End year</Label>
        <Input id={`${prefix}-end-year`} name="endYear" inputMode="numeric" maxLength={4} />
      </div>
    </div>
  );
}
