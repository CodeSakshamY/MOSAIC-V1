"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getMember, memberGate } from "@/lib/auth/session";
import { photoLimits, storeUserFile } from "@/lib/media/store";
import {
  parseDisplayName,
  parseGithubUsername,
  parseOptionalText,
  parsePassword,
  parseUsername,
  parseWebsite,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";
import { parseLookingFor } from "@/lib/auth/looking-for";
import { isCollaborationPreference } from "@/lib/profile/collaboration";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

async function requireOwner() {
  const member = await getMember();
  if (!member) redirect("/profile");
  const gate = memberGate(member);
  if (gate) redirect(gate);
  return member;
}

const interestIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function saveInterests(formData: FormData) {
  const member = await requireOwner();
  const ids = [...new Set(formData.getAll("interest").map(String))].filter((id) => interestIdPattern.test(id));
  const supabase = await createClient();
  const { data: known } = ids.length
    ? await supabase.from("interests").select("id").in("id", ids)
    : { data: [] as { id: string }[] };
  const valid = (known ?? []).map((row) => row.id);
  const { error: deleteError } = await supabase.from("profile_interests").delete().eq("profile_id", member.id);
  if (deleteError) return;
  if (valid.length > 0) {
    const { error } = await supabase
      .from("profile_interests")
      .insert(valid.map((interest_id) => ({ profile_id: member.id, interest_id })));
    if (error) return;
  }
  revalidatePath("/profile");
  if (member.username) revalidatePath(`/people/${member.username}`);
  redirect("/profile");
}

export async function saveCollaboration(formData: FormData) {
  const member = await requireOwner();
  const value = String(formData.get("collaboration") ?? "");
  const preference = value && isCollaborationPreference(value) ? value : null;
  if (value && !preference) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ collaboration_preference: preference })
    .eq("id", member.id);
  if (error) return;
  revalidatePath("/profile");
  if (member.username) revalidatePath(`/people/${member.username}`);
  redirect("/profile");
}

export async function saveLookingFor(_state: { error?: string } | null, formData: FormData) {
  const member = await requireOwner();
  const looking = parseLookingFor(formData.getAll("lookingFor").map(String));
  if (!looking.ok) return { error: looking.error };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ looking_for: looking.values }).eq("id", member.id);
  if (error) return { error: "Those choices were not saved." };
  revalidatePath("/profile");
  if (member.username) revalidatePath(`/people/${member.username}`);
  redirect("/profile");
}

export async function addProfileLink(_state: { error?: string } | null, formData: FormData) {
  const member = await requireOwner();
  const label = text(formData.get("label"), 40);
  const link = parseWebsite(String(formData.get("url") ?? ""));
  if (!label) return { error: "Add a label, such as LinkedIn." };
  if (!link.ok || !link.website) return { error: link.ok ? "Add an https link." : link.error };
  if (link.website.length > 300) return { error: "Keep the link to 300 characters." };
  const supabase = await createClient();
  const { count } = await supabase
    .from("profile_links")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", member.id);
  if ((count ?? 0) >= 8) return { error: "A profile can list 8 links." };
  const { error } = await supabase.from("profile_links").insert({
    profile_id: member.id,
    label,
    url: link.website,
  });
  if (error) return { error: "That link was not saved." };
  revalidatePath("/profile");
  if (member.username) revalidatePath(`/people/${member.username}`);
  redirect("/profile");
}

export async function saveProfileVisibility(formData: FormData) {
  const member = await requireOwner();
  const value = String(formData.get("visibility") ?? "");
  if (value !== "public" && value !== "private") return;
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ visibility: value }).eq("id", member.id);
  if (error) return;
  revalidatePath("/profile");
  if (member.username) revalidatePath(`/people/${member.username}`);
  redirect("/profile");
}

export async function addProfileSection(_state: { error?: string } | null, formData: FormData) {
  const member = await requireOwner();
  const title = text(formData.get("title"), 80);
  const body = text(formData.get("body"), 2000);
  if (!title) return { error: "Add a title." };
  if (!body) return { error: "Write the section." };
  const supabase = await createClient();
  const { count } = await supabase
    .from("profile_sections")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", member.id);
  if ((count ?? 0) >= 5) return { error: "A profile can have 5 sections." };
  const { error } = await supabase.from("profile_sections").insert({
    profile_id: member.id,
    title,
    body,
  });
  if (error) return { error: "That section was not saved." };
  revalidatePath("/profile");
  if (member.username) revalidatePath(`/people/${member.username}`);
  redirect("/profile");
}

export async function featureProject(formData: FormData) {
  const member = await requireOwner();
  const projectId = String(formData.get("projectId") ?? "");
  const feature = formData.get("feature") === "1";
  if (!interestIdPattern.test(projectId)) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, owner_id, visibility")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id || project.visibility !== "public") return;
  const { error } = await supabase
    .from("projects")
    .update({ profile_featured_at: feature ? new Date().toISOString() : null })
    .eq("id", projectId)
    .eq("owner_id", member.id);
  if (error) return;
  revalidatePath("/profile");
  if (member.username) revalidatePath(`/people/${member.username}`);
  redirect("/profile");
}

function year(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return { ok: true as const, year: null };
  if (!/^\d{4}$/.test(text)) return { ok: false as const, error: "Use a four-digit year, or leave it blank." };
  const parsed = Number(text);
  if (parsed < 1950 || parsed > 2100) return { ok: false as const, error: "Use a year between 1950 and 2100." };
  return { ok: true as const, year: parsed };
}

function text(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function savePhoto(
  supabase: SupabaseClient<Database>,
  userId: string,
  value: FormDataEntryValue | null,
  bucket: "avatars" | "post-media",
  limits: { maxBytes: number; maxEdge: number },
) {
  return storeUserFile(supabase, userId, value, { bucket, ...limits });
}

export async function addEducation(_state: { error?: string } | null, formData: FormData) {
  const member = await requireOwner();
  const school = text(formData.get("school"), 120);
  const credential = text(formData.get("credential"), 120);
  const start = year(formData.get("startYear"));
  const end = year(formData.get("endYear"));
  if (!school) return { error: "Add a school or programme." };
  if (!start.ok) return { error: start.error };
  if (!end.ok) return { error: end.error };
  if (start.year && end.year && end.year < start.year) return { error: "The end year is before the start year." };

  const supabase = await createClient();
  const { error } = await supabase.from("profile_education").insert({
    profile_id: member.id,
    school,
    credential: credential || null,
    start_year: start.year,
    end_year: end.year,
  });
  if (error) return { error: "Education was not saved." };
  redirect("/profile");
}

export async function addPublication(_state: { error?: string } | null, formData: FormData) {
  const member = await requireOwner();
  const title = text(formData.get("title"), 160);
  const venue = text(formData.get("venue"), 120);
  const summary = text(formData.get("summary"), 500);
  const published = year(formData.get("year"));
  const link = parseWebsite(String(formData.get("url") ?? ""));
  if (!title) return { error: "Add a title." };
  if (!published.ok) return { error: published.error };
  if (!link.ok) return { error: link.error };
  if (link.website && link.website.length > 300) return { error: "Keep the link to 300 characters." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("profile_publications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", member.id);
  if ((count ?? 0) >= 20) return { error: "A profile can list 20 publications." };
  const { error } = await supabase.from("profile_publications").insert({
    profile_id: member.id,
    title,
    venue: venue || null,
    year: published.year,
    url: link.website,
    summary: summary || null,
  });
  if (error) return { error: "That publication was not saved." };
  redirect("/profile");
}

export async function addCompetition(_state: { error?: string } | null, formData: FormData) {
  const member = await requireOwner();
  const name = text(formData.get("name"), 160);
  const host = text(formData.get("host"), 120);
  const result = text(formData.get("result"), 80);
  const held = year(formData.get("year"));
  const link = parseWebsite(String(formData.get("url") ?? ""));
  if (!name) return { error: "Add the competition name." };
  if (!held.ok) return { error: held.error };
  if (!link.ok) return { error: link.error };
  if (link.website && link.website.length > 300) return { error: "Keep the link to 300 characters." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("profile_competitions")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", member.id);
  if ((count ?? 0) >= 20) return { error: "A profile can list 20 competitions." };
  const { error } = await supabase.from("profile_competitions").insert({
    profile_id: member.id,
    name,
    host: host || null,
    year: held.year,
    result: result || null,
    url: link.website,
  });
  if (error) return { error: "That competition was not saved." };
  redirect("/profile");
}

export async function addCommunity(_state: { error?: string } | null, formData: FormData) {
  const member = await requireOwner();
  const name = text(formData.get("name"), 80);
  const role = text(formData.get("role"), 40);
  const held = year(formData.get("year"));
  if (!name) return { error: "Add the community name." };
  if (!held.ok) return { error: held.error };

  const supabase = await createClient();
  const { count } = await supabase
    .from("profile_communities")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", member.id);
  if ((count ?? 0) >= 20) return { error: "A profile can list 20 communities." };
  const { error } = await supabase.from("profile_communities").insert({
    profile_id: member.id,
    name,
    role: role || null,
    year: held.year,
  });
  if (error) return { error: "That community was not saved." };
  redirect("/profile");
}

export async function addExperience(_state: { error?: string } | null, formData: FormData) {
  const member = await requireOwner();
  const title = text(formData.get("title"), 120);
  const organization = text(formData.get("organization"), 120);
  const summary = text(formData.get("summary"), 500);
  const start = year(formData.get("startYear"));
  const end = year(formData.get("endYear"));
  if (!title || !organization) return { error: "Add a role and an organisation." };
  if (!start.ok) return { error: start.error };
  if (!end.ok) return { error: end.error };
  if (start.year && end.year && end.year < start.year) return { error: "The end year is before the start year." };

  const supabase = await createClient();
  const { error } = await supabase.from("profile_experience").insert({
    profile_id: member.id,
    title,
    organization,
    summary: summary || null,
    start_year: start.year,
    end_year: end.year,
  });
  if (error) return { error: "That role was not saved." };
  redirect("/profile");
}

export async function addCertificate(_state: { error?: string } | null, formData: FormData) {
  const member = await requireOwner();
  const name = text(formData.get("name"), 160);
  const issuer = text(formData.get("issuer"), 120);
  const issued = year(formData.get("year"));
  const url = text(formData.get("url"), 2000);
  if (!name || !issuer) return { error: "Add the certificate and who issued it." };
  if (!issued.ok) return { error: issued.error };
  if (url && !url.startsWith("https://")) return { error: "The certificate link must start with https://." };

  const supabase = await createClient();
  const photo = await savePhoto(supabase, member.id, formData.get("photo"), "post-media", photoLimits.post);
  if (!photo.ok) return { error: photo.error };
  const { error } = await supabase.from("profile_certificates").insert({
    profile_id: member.id,
    name,
    issuer,
    year: issued.year,
    credential_url: url || null,
    image_url: photo.url,
  });
  if (error) return { error: "That certificate was not saved." };
  redirect("/profile");
}

export async function addAchievement(_state: { error?: string } | null, formData: FormData) {
  const member = await requireOwner();
  const title = text(formData.get("title"), 160);
  const content = text(formData.get("content"), 2000);
  if (!title || !content) return { error: "Add a title and a short account of the achievement." };

  const supabase = await createClient();
  const photo = await savePhoto(supabase, member.id, formData.get("photo"), "post-media", photoLimits.post);
  if (!photo.ok) return { error: photo.error };
  const { error } = await supabase.from("posts").insert({
    author_id: member.id,
    type: "achievement",
    title,
    content,
    media_urls: photo.url ? [photo.url] : [],
    visibility: "public",
    is_demo: false,
  });
  if (error) return { error: "That achievement was not saved." };
  redirect("/profile");
}

export async function addAward(_state: { error?: string } | null, formData: FormData) {
  const member = await requireOwner();
  const title = text(formData.get("title"), 160);
  const issuer = text(formData.get("issuer"), 120);
  const awarded = year(formData.get("year"));
  if (!title || !issuer) return { error: "Add the award and who gave it." };
  if (!awarded.ok) return { error: awarded.error };

  const supabase = await createClient();
  const photo = await savePhoto(supabase, member.id, formData.get("photo"), "post-media", photoLimits.post);
  if (!photo.ok) return { error: photo.error };
  const { error } = await supabase.from("profile_awards").insert({
    profile_id: member.id,
    title,
    issuer,
    year: awarded.year,
    image_url: photo.url,
  });
  if (error) return { error: "That award was not saved." };
  redirect("/profile");
}

export async function removeProfileItem(formData: FormData) {
  const member = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const supabase = await createClient();
  if (kind === "education") {
    await supabase.from("profile_education").delete().eq("id", id).eq("profile_id", member.id);
  } else if (kind === "experience") {
    await supabase.from("profile_experience").delete().eq("id", id).eq("profile_id", member.id);
  } else if (kind === "certificate") {
    await supabase.from("profile_certificates").delete().eq("id", id).eq("profile_id", member.id);
  } else if (kind === "award") {
    await supabase.from("profile_awards").delete().eq("id", id).eq("profile_id", member.id);
  } else if (kind === "publication") {
    await supabase.from("profile_publications").delete().eq("id", id).eq("profile_id", member.id);
  } else if (kind === "competition") {
    await supabase.from("profile_competitions").delete().eq("id", id).eq("profile_id", member.id);
  } else if (kind === "community") {
    await supabase.from("profile_communities").delete().eq("id", id).eq("profile_id", member.id);
  } else if (kind === "link") {
    await supabase.from("profile_links").delete().eq("id", id).eq("profile_id", member.id);
  } else if (kind === "section") {
    await supabase.from("profile_sections").delete().eq("id", id).eq("profile_id", member.id);
  }
  redirect("/profile");
}

export async function updateProfile(_state: { error?: string } | null, formData: FormData) {
  const member = await requireOwner();
  const displayName = parseDisplayName(String(formData.get("displayName") ?? ""));
  if (!displayName.ok) return { error: displayName.error };
  const username = parseUsername(String(formData.get("username") ?? ""));
  if (!username.ok) return { error: username.error };
  const bio = parseOptionalText(String(formData.get("bio") ?? ""), 280, "Bio");
  if (!bio.ok) return { error: bio.error };
  const city = parseOptionalText(String(formData.get("city") ?? ""), 80, "City");
  if (!city.ok) return { error: city.error };
  const state = parseOptionalText(String(formData.get("state") ?? ""), 80, "State");
  if (!state.ok) return { error: state.error };
  const github = parseGithubUsername(String(formData.get("github") ?? ""));
  if (!github.ok) return { error: github.error };
  const website = parseWebsite(String(formData.get("website") ?? ""));
  if (!website.ok) return { error: website.error };
  const nextPassword = String(formData.get("password") ?? "");
  if (nextPassword) {
    const password = parsePassword(nextPassword);
    if (!password.ok) return { error: password.error };
  }

  const supabase = await createClient();
  const avatar = await savePhoto(supabase, member.id, formData.get("avatar"), "avatars", photoLimits.avatar);
  if (!avatar.ok) return { error: avatar.error };
  const banner = await savePhoto(supabase, member.id, formData.get("banner"), "post-media", photoLimits.banner);
  if (!banner.ok) return { error: banner.error };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName.displayName,
      username: username.username,
      bio: bio.text,
      city: city.text,
      state: state.text,
      github_username: github.github,
      website_url: website.website,
      ...(avatar.url ? { avatar_url: avatar.url } : {}),
      ...(banner.url ? { banner_url: banner.url } : {}),
    })
    .eq("id", member.id);
  if (error?.code === "23505") return { error: "That username is taken." };
  if (error) return { error: "The profile was not saved." };

  if (nextPassword) {
    const { error: passwordError } = await supabase.auth.updateUser({ password: nextPassword });
    if (passwordError) return { error: "The profile was saved, but the password was not changed." };
  }
  redirect("/profile");
}
