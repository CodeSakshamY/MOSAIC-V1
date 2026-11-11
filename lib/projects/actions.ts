"use server";

import { redirect } from "next/navigation";
import { imageContentType, imageKind, MAX_PROFILE_PHOTO_BYTES } from "@/lib/auth/images";
import { getMember, memberGate } from "@/lib/auth/session";
import { isProjectCategory, isProjectSlug, projectSlug } from "@/lib/projects/slug";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/auth/actions";

export async function createProject(_state: ActionState, formData: FormData): Promise<ActionState> {
  const member = await getMember();
  if (!member) redirect("/profile?next=/forge");
  const gate = memberGate(member);
  if (gate) redirect(gate);

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const visibility = formData.get("visibility") === "private" ? "private" : "public";
  const slug = projectSlug(String(formData.get("slug") ?? name));

  if (name.length < 3 || name.length > 80) {
    return { error: "Use a project name of 3–80 characters." };
  }
  if (!isProjectSlug(slug)) {
    return { error: "That name does not make a usable project link. Use letters or numbers." };
  }
  if (description.length < 1 || description.length > 200) {
    return { error: "Add a description of 200 characters or fewer." };
  }
  if (!isProjectCategory(category)) {
    return { error: "Choose a category." };
  }

  const coverFile = formData.get("cover");
  if (visibility === "private" && coverFile instanceof File && coverFile.size > 0) {
    return { error: "A cover photo is only kept on a public project." };
  }
  const supabase = await createClient();
  const cover = await optionalPhoto(coverFile, member.id, "project-covers");
  if (cover && !cover.ok) return { error: cover.error };
  const { error } = await supabase.from("projects").insert({
    owner_id: member.id,
    name,
    slug,
    description,
    category,
    visibility,
    status: "idea",
    cover_image_url: cover?.ok ? cover.url : null,
  });
  if (error?.code === "23505") return { error: "A project with that link already exists." };
  if (error) return { error: "The project was not created." };
  redirect(`/forge/${slug}`);
}

async function optionalPhoto(value: FormDataEntryValue | null, userId: string, bucket: "project-covers" | "post-media") {
  if (!(value instanceof File) || value.size === 0) return null;
  const bytes = new Uint8Array(await value.arrayBuffer());
  const kind = imageKind(bytes, MAX_PROFILE_PHOTO_BYTES);
  if (!kind) return { ok: false as const, error: "Use a JPEG, PNG, or WebP photo under 5 MB." };
  const supabase = await createClient();
  const path = `${userId}/${crypto.randomUUID()}.${kind === "jpg" ? "jpg" : kind}`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: imageContentType(kind),
    upsert: false,
  });
  if (error) return { ok: false as const, error: "The photo was not uploaded." };
  return { ok: true as const, url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl };
}

async function requireMember() {
  const member = await getMember();
  if (!member) redirect("/profile?next=/forge");
  const gate = memberGate(member);
  if (gate) redirect(gate);
  return member;
}

export async function forkProject(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const supabase = await createClient();
  const { data: source } = await supabase
    .from("projects")
    .select("name, slug, description, category, visibility, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!source || source.owner_id === member.id) redirect("/forge");

  const name = `Fork of ${source.name}`.slice(0, 80);
  const base = projectSlug(`${source.slug}-fork`);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = attempt === 0 ? base : projectSlug(`${base}-${attempt + 1}`);
    if (!isProjectSlug(slug)) break;
    const { error } = await supabase.from("projects").insert({
      owner_id: member.id,
      name,
      slug,
      description: source.description,
      category: source.category,
      visibility: source.visibility,
      parent_project_id: projectId,
      status: "idea",
    });
    if (!error) redirect(`/forge/${slug}`);
    if (error.code !== "23505") break;
  }
  redirect(`/forge/${source.slug}?tab=overview`);
}

export async function createCommit(_state: ActionState, formData: FormData): Promise<ActionState> {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (title.length < 1 || title.length > 120) return { error: "A commit title needs 1–120 characters." };
  if (content.length < 1 || content.length > 8000) return { error: "Describe the change." };

  const supabase = await createClient();
  const { error } = await supabase.from("build_logs").insert({
    project_id: projectId,
    author_id: member.id,
    title,
    content,
  });
  if (error) return { error: "That commit was not saved. Only people on the project can commit." };
  redirect(`/forge/${slug}?tab=commits`);
}

export async function openPullRequest(_state: ActionState, formData: FormData): Promise<ActionState> {
  const member = await requireMember();
  const sourceId = String(formData.get("projectId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const proposed = String(formData.get("proposed") ?? "").trim();
  if (title.length < 1 || title.length > 120) return { error: "Give the pull request a title." };
  if (body.length < 1 || body.length > 2000) return { error: "Explain the change in 2000 characters or fewer." };
  if (proposed.length < 1 || proposed.length > 200) {
    return { error: "The proposed description must be 1–200 characters." };
  }

  const supabase = await createClient();
  const { data: source } = await supabase
    .from("projects")
    .select("parent_project_id, owner_id")
    .eq("id", sourceId)
    .maybeSingle();
  if (!source?.parent_project_id || source.owner_id !== member.id) {
    return { error: "Open a pull request from a fork you own." };
  }

  const { error } = await supabase.from("project_pull_requests").insert({
    target_project_id: source.parent_project_id,
    source_project_id: sourceId,
    author_id: member.id,
    title,
    body,
    proposed_description: proposed,
    status: "open",
  });
  if (error) return { error: "That pull request was not opened. One open request per fork is the limit." };
  redirect(`/forge/${slug}?tab=pulls`);
}

export async function reviewPullRequest(formData: FormData) {
  const member = await requireMember();
  const requestId = String(formData.get("requestId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const decision = formData.get("decision") === "merged" ? "merged" : "closed";
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_pull_requests")
    .update({ status: decision })
    .eq("id", requestId)
    .eq("status", "open");
  if (error || !member) redirect(`/forge/${slug}?tab=pulls`);
  redirect(`/forge/${slug}?tab=pulls`);
}

export async function startThread(_state: ActionState, formData: FormData): Promise<ActionState> {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (title.length < 1 || title.length > 160) return { error: "A thread title needs 1–160 characters." };
  if (content.length < 1 || content.length > 8000) return { error: "Write the thread." };

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("visibility")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return { error: "That project is not available." };

  const photo = await optionalPhoto(formData.get("photo"), member.id, "post-media");
  if (photo && !photo.ok) return { error: photo.error };

  const { error } = await supabase.from("posts").insert({
    author_id: member.id,
    type: "idea",
    project_id: projectId,
    title,
    content,
    media_urls: photo?.ok ? [photo.url] : [],
    visibility: project.visibility,
    is_demo: false,
  });
  if (error) return { error: "The thread was not started." };
  redirect(`/forge/${slug}?tab=threads`);
}

export async function replyToThread(_state: ActionState, formData: FormData): Promise<ActionState> {
  const member = await requireMember();
  const postId = String(formData.get("postId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (content.length < 1 || content.length > 2000) return { error: "A reply needs 1–2000 characters." };

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: member.id,
    content,
  });
  if (error) return { error: "The reply was not posted." };
  redirect(`/forge/${slug}?tab=threads&thread=${postId}`);
}
