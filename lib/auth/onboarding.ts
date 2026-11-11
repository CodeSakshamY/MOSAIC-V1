"use server";

import { redirect } from "next/navigation";
import { photoLimits, storeUserFile } from "@/lib/media/store";
import { parseLookingFor } from "@/lib/auth/looking-for";
import { getMember } from "@/lib/auth/session";
import {
  parseAgeGroup,
  parseCountry,
  parseDisplayName,
  parseGithubUsername,
  parseOptionalText,
  parseUsername,
  parseWebsite,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/auth/actions";

async function requireOnboarding() {
  const supabase = await createClient();
  const member = await getMember(supabase);
  if (!member) redirect("/login");
  if (member.deletedAt) redirect("/account/closed");
  if (member.suspended) redirect("/account/suspended");
  if (member.onboardingComplete) redirect("/");
  return { supabase, member };
}

async function advance(step: number) {
  const { supabase, member } = await requireOnboarding();
  const { error } = await supabase
    .from("profile_private")
    .update({ onboarding_step: step })
    .eq("profile_id", member.id);
  if (error) return { error: "That step was not saved. Try again." } satisfies ActionState;
  redirect("/onboarding");
}

export async function retreatOnboarding() {
  const { supabase, member } = await requireOnboarding();
  if (member.onboardingStep <= 1) return;
  await supabase
    .from("profile_private")
    .update({ onboarding_step: member.onboardingStep - 1 })
    .eq("profile_id", member.id);
}

export async function saveOnboarding(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, member } = await requireOnboarding();
  const step = member.onboardingStep;

  if (step === 1) {
    const username = parseUsername(String(formData.get("username") ?? ""));
    if (!username.ok) return { error: username.error };
    const displayName = parseDisplayName(String(formData.get("displayName") ?? ""));
    if (!displayName.ok) return { error: displayName.error };
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.username, display_name: displayName.displayName })
      .eq("id", member.id);
    if (error) {
      if (error.code === "23505") return { error: "That username is taken." };
      return { error: "That username was not saved." };
    }
    return advance(2);
  }

  if (step === 2) {
    if (formData.get("intent") === "skip") return advance(3);
    const file = formData.get("avatar");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Choose an image, or skip this step." };
    }
    const avatar = await storeUserFile(supabase, member.id, file, {
      bucket: "avatars",
      ...photoLimits.avatar,
      required: true,
    });
    if (!avatar.ok || !avatar.url) return { error: avatar.ok ? "Choose an image, or skip this step." : avatar.error };
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatar.url })
      .eq("id", member.id);
    if (error) return { error: "The image was uploaded but not saved on your profile." };
    return advance(3);
  }

  if (step === 3) {
    const city = parseOptionalText(String(formData.get("city") ?? ""), 80, "City");
    if (!city.ok) return { error: city.error };
    const state = parseOptionalText(String(formData.get("state") ?? ""), 80, "State");
    if (!state.ok) return { error: state.error };
    const country = parseCountry(String(formData.get("country") ?? "IN"));
    if (!country.ok) return { error: country.error };
    const { error } = await supabase
      .from("profiles")
      .update({ city: city.text, state: state.text, country: country.country })
      .eq("id", member.id);
    if (error) return { error: "Location was not saved." };
    return advance(4);
  }

  if (step === 4) {
    const age = parseAgeGroup(String(formData.get("ageGroup") ?? ""));
    if (!age.ok) return { error: age.error };
    const { error } = await supabase
      .from("profiles")
      .update({ age_group: age.ageGroup })
      .eq("id", member.id);
    if (error) return { error: "Age band was not saved." };
    return advance(5);
  }

  if (step === 5) {
    const education = parseOptionalText(String(formData.get("education") ?? ""), 120, "Education");
    if (!education.ok) return { error: education.error };
    const { error } = await supabase
      .from("profiles")
      .update({ education: education.text })
      .eq("id", member.id);
    if (error) return { error: "Education was not saved." };
    return advance(6);
  }

  if (step === 6 || step === 7) {
    const ids = formData
      .getAll(step === 6 ? "skill" : "interest")
      .map(String)
      .filter((id) => /^[0-9a-f-]{36}$/.test(id));
    if (step === 6) {
      const { error: deleteError } = await supabase
        .from("profile_skills")
        .delete()
        .eq("profile_id", member.id);
      if (deleteError) return { error: "Those choices were not saved." };
      if (ids.length > 0) {
        const { error } = await supabase
          .from("profile_skills")
          .insert(ids.map((skill_id) => ({ profile_id: member.id, skill_id })));
        if (error) return { error: "Those choices were not saved." };
      }
    } else {
      const { error: deleteError } = await supabase
        .from("profile_interests")
        .delete()
        .eq("profile_id", member.id);
      if (deleteError) return { error: "Those choices were not saved." };
      if (ids.length > 0) {
        const { error } = await supabase
          .from("profile_interests")
          .insert(ids.map((interest_id) => ({ profile_id: member.id, interest_id })));
        if (error) return { error: "Those choices were not saved." };
      }
    }
    return advance(step + 1);
  }

  if (step === 8) {
    const github = parseGithubUsername(String(formData.get("github") ?? ""));
    if (!github.ok) return { error: github.error };
    const website = parseWebsite(String(formData.get("website") ?? ""));
    if (!website.ok) return { error: website.error };
    const { error } = await supabase
      .from("profiles")
      .update({ github_username: github.github, website_url: website.website })
      .eq("id", member.id);
    if (error) return { error: "Those links were not saved." };
    return advance(9);
  }

  const looking = parseLookingFor(formData.getAll("lookingFor").map(String));
  if (!looking.ok) return { error: looking.error };
  const { error } = await supabase
    .from("profiles")
    .update({ looking_for: looking.values, onboarding_complete: true })
    .eq("id", member.id);
  if (error) return { error: "That was not saved." };
  await supabase.from("profile_private").update({ onboarding_step: 9 }).eq("profile_id", member.id);
  redirect("/");
}
