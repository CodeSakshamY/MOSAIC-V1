"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMember, memberGate } from "@/lib/auth/session";
import { photoLimits, storeUserFile } from "@/lib/media/store";
import { parseProjectDay } from "@/lib/projects/timeline";
import { isReactionType } from "@/lib/feed/reactions";
import { isBuildLogKind } from "@/lib/projects/log-kind";
import { isProjectCategory, isProjectSlug, isProjectStatus, isProjectSubcategory, projectSlug } from "@/lib/projects/slug";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/auth/actions";

export async function createProject(_state: ActionState, formData: FormData): Promise<ActionState> {
  const member = await getMember();
  if (!member) redirect("/profile?next=/forge");
  const gate = memberGate(member);
  if (gate) redirect(gate);

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const subcategory = String(formData.get("subcategory") ?? "").trim();
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
  if (tagline.length > 80) {
    return { error: "Keep the tagline to 80 characters." };
  }
  if (subcategory && !isProjectSubcategory(category, subcategory)) {
    return { error: "Choose a subcategory for that project type." };
  }
  if (!isProjectCategory(category)) {
    return { error: "Choose a category." };
  }

  const coverFile = formData.get("cover");
  if (visibility === "private" && coverFile instanceof File && coverFile.size > 0) {
    return { error: "A cover photo is only kept on a public project." };
  }
  const supabase = await createClient();
  const cover = await storeUserFile(supabase, member.id, coverFile, {
    bucket: "project-covers",
    ...photoLimits.cover,
  });
  if (cover && !cover.ok) return { error: cover.error };
  const { error } = await supabase.from("projects").insert({
    owner_id: member.id,
    name,
    slug,
    description,
    tagline: tagline || null,
    subcategory: subcategory || null,
    category,
    visibility,
    status: "idea",
    cover_image_url: cover?.ok ? cover.url : null,
  });
  if (error?.code === "23505") return { error: "A project with that link already exists." };
  if (error) return { error: "The project was not created." };
  redirect(`/forge/${slug}`);
}

async function requireMember() {
  const member = await getMember();
  if (!member) redirect("/profile?next=/forge");
  const gate = memberGate(member);
  if (gate) redirect(gate);
  return member;
}

const projectIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateTagline(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const tagline = String(formData.get("tagline") ?? "").trim();
  if (!projectIdPattern.test(projectId) || tagline.length > 80) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  const { error } = await supabase
    .from("projects")
    .update({ tagline: tagline || null })
    .eq("id", projectId)
    .eq("owner_id", member.id);
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
  revalidatePath("/forge");
  revalidatePath("/discover");
}

export async function updateSubcategory(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const subcategory = String(formData.get("subcategory") ?? "").trim();
  if (!projectIdPattern.test(projectId)) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id, category")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  if (subcategory && !isProjectSubcategory(project.category, subcategory)) return;
  const { error } = await supabase
    .from("projects")
    .update({ subcategory: subcategory || null })
    .eq("id", projectId)
    .eq("owner_id", member.id);
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
  revalidatePath("/forge");
  revalidatePath("/discover");
}

async function replaceProjectSkills(formData: FormData, field: "tool" | "skill", relation: "uses" | "seeking") {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectIdPattern.test(projectId)) return;
  const requested = [...new Set(formData.getAll(field).map((value) => String(value)))];
  if (requested.length > 8 || requested.some((id) => !projectIdPattern.test(id))) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  const { data: known } = requested.length
    ? await supabase.from("skills").select("id").in("id", requested)
    : { data: [] };
  const allowed = new Set((known ?? []).map((row) => row.id));
  if (requested.some((id) => !allowed.has(id))) return;
  const { data: existing } = await supabase
    .from("project_skills")
    .select("skill_id")
    .eq("project_id", projectId)
    .eq("relation", relation);
  const have = new Set((existing ?? []).map((row) => row.skill_id));
  const next = new Set(requested);
  const remove = [...have].filter((id) => !next.has(id));
  const add = [...next].filter((id) => !have.has(id));
  if (remove.length) {
    const { error } = await supabase
      .from("project_skills")
      .delete()
      .eq("project_id", projectId)
      .eq("relation", relation)
      .in("skill_id", remove);
    if (error) return;
  }
  if (add.length) {
    const { error } = await supabase.from("project_skills").insert(
      add.map((skillId) => ({ project_id: projectId, skill_id: skillId, relation })),
    );
    if (error) return;
  }
  revalidatePath(`/forge/${project.slug}`);
  revalidatePath("/forge");
  revalidatePath("/discover");
}

export async function updateTools(formData: FormData) {
  await replaceProjectSkills(formData, "tool", "uses");
}

export async function updateSkillsRequired(formData: FormData) {
  await replaceProjectSkills(formData, "skill", "seeking");
}

export async function updateStatus(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!projectIdPattern.test(projectId) || !isProjectStatus(status)) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  const { error } = await supabase.from("projects").update({ status }).eq("id", projectId).eq("owner_id", member.id);
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
  revalidatePath("/forge");
  revalidatePath("/discover");
}

export async function setOpenToCollaborators(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const open = formData.get("open") === "1";
  if (!projectIdPattern.test(projectId)) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  const { error } = await supabase
    .from("projects")
    .update({ looking_for_contributors: open })
    .eq("id", projectId)
    .eq("owner_id", member.id);
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
}

export async function updateTimeline(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const startsOn = parseProjectDay(String(formData.get("startsOn") ?? ""));
  const endsOn = parseProjectDay(String(formData.get("endsOn") ?? ""));
  if (!projectIdPattern.test(projectId) || startsOn === undefined || endsOn === undefined) return;
  if (startsOn && endsOn && endsOn < startsOn) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  const { error } = await supabase
    .from("projects")
    .update({ starts_on: startsOn, ends_on: endsOn })
    .eq("id", projectId)
    .eq("owner_id", member.id);
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
  revalidatePath("/forge");
}

export async function updateDocumentation(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const documentation = String(formData.get("documentation") ?? "").trim();
  if (!projectIdPattern.test(projectId) || documentation.length > 8000) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  const { error } = await supabase
    .from("projects")
    .update({ detailed_description: documentation || null })
    .eq("id", projectId)
    .eq("owner_id", member.id);
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
}

export async function updateCredits(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const credits = String(formData.get("credits") ?? "").trim();
  if (!projectIdPattern.test(projectId) || credits.length > 2000) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  const { error } = await supabase
    .from("projects")
    .update({ credits: credits || null })
    .eq("id", projectId)
    .eq("owner_id", member.id);
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
}

export async function requestContribution(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const proposal = String(formData.get("proposal") ?? "").trim();
  if (!projectIdPattern.test(projectId) || message.length < 1 || message.length > 1000) return;
  if (proposal.length < 1 || proposal.length > 1000) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id === member.id) return;
  const { error } = await supabase.from("contribution_requests").insert({
    project_id: projectId,
    requester_id: member.id,
    message,
    proposed_contribution: proposal,
  });
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
}

export async function reviewContribution(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const requestId = String(formData.get("requestId") ?? "");
  const decision = formData.get("decision") === "accepted" ? "accepted" : formData.get("decision") === "rejected" ? "rejected" : "";
  if (!projectIdPattern.test(projectId) || !projectIdPattern.test(requestId) || !decision) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  const { error } = await supabase
    .from("contribution_requests")
    .update({ status: decision })
    .eq("id", requestId)
    .eq("project_id", projectId)
    .eq("status", "pending");
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
}

export async function withdrawContribution(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const requestId = String(formData.get("requestId") ?? "");
  if (!projectIdPattern.test(projectId) || !projectIdPattern.test(requestId)) return;
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("slug").eq("id", projectId).maybeSingle();
  if (!project) return;
  const { error } = await supabase
    .from("contribution_requests")
    .update({ status: "withdrawn" })
    .eq("id", requestId)
    .eq("project_id", projectId)
    .eq("requester_id", member.id)
    .eq("status", "pending");
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
}

export async function addMilestone(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const happensOn = parseProjectDay(String(formData.get("happensOn") ?? ""));
  if (!projectIdPattern.test(projectId) || title.length < 1 || title.length > 80 || !happensOn) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  const { count } = await supabase
    .from("project_milestones")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if ((count ?? 0) >= 12) return;
  const major = formData.get("major") === "1";
  const { error } = await supabase.from("project_milestones").insert({
    project_id: projectId,
    title,
    happens_on: happensOn,
    major,
  });
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
}

export async function removeMilestone(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  if (!projectIdPattern.test(projectId) || !projectIdPattern.test(milestoneId)) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  await supabase.from("project_milestones").delete().eq("id", milestoneId).eq("project_id", projectId);
  revalidatePath(`/forge/${project.slug}`);
}

export async function highlightMilestone(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "");
  const major = formData.get("major") === "1";
  if (!projectIdPattern.test(projectId) || !projectIdPattern.test(milestoneId)) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  const { error } = await supabase
    .from("project_milestones")
    .update({ major })
    .eq("id", milestoneId)
    .eq("project_id", projectId);
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
}

export async function addVersion(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!projectIdPattern.test(projectId) || title.length < 1 || title.length > 80 || note.length > 1000) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  const { count } = await supabase
    .from("project_versions")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if ((count ?? 0) >= 20) return;
  const { error } = await supabase.from("project_versions").insert({
    project_id: projectId,
    title,
    note: note || null,
  });
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
}

export async function removeVersion(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const versionId = String(formData.get("versionId") ?? "");
  if (!projectIdPattern.test(projectId) || !projectIdPattern.test(versionId)) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  await supabase.from("project_versions").delete().eq("id", versionId).eq("project_id", projectId);
  revalidatePath(`/forge/${project.slug}`);
}

export async function updateCover(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectIdPattern.test(projectId)) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id, visibility")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  const remove = formData.get("remove") === "1";
  let url: string | null = null;
  if (!remove) {
    if (project.visibility !== "public") return;
    const stored = await storeUserFile(supabase, member.id, formData.get("cover"), {
      bucket: "project-covers",
      ...photoLimits.cover,
      required: true,
    });
    if (!stored.ok || !stored.url) return;
    url = stored.url;
  }
  const { error } = await supabase.from("projects").update({ cover_image_url: url }).eq("id", projectId).eq("owner_id", member.id);
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
  revalidatePath("/discover");
}

export async function addGalleryImage(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectIdPattern.test(projectId)) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id, visibility")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id || project.visibility !== "public") return;
  const { count } = await supabase.from("project_gallery").select("id", { count: "exact", head: true }).eq("project_id", projectId);
  if ((count ?? 0) >= 8) return;
  const stored = await storeUserFile(supabase, member.id, formData.get("photo"), {
    bucket: "project-covers",
    ...photoLimits.cover,
    required: true,
  });
  if (!stored.ok || !stored.url) return;
  const { error } = await supabase.from("project_gallery").insert({ project_id: projectId, image_url: stored.url });
  if (error) return;
  revalidatePath(`/forge/${project.slug}`);
}

export async function removeGalleryImage(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");
  if (!projectIdPattern.test(projectId) || !projectIdPattern.test(imageId)) return;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("slug, owner_id")
    .eq("id", projectId)
    .is("removed_at", null)
    .maybeSingle();
  if (!project || project.owner_id !== member.id) return;
  await supabase.from("project_gallery").delete().eq("id", imageId).eq("project_id", projectId);
  revalidatePath(`/forge/${project.slug}`);
}

export async function forkProject(formData: FormData) {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const supabase = await createClient();
  const { data: source } = await supabase
    .from("projects")
    .select("name, slug, description, tagline, subcategory, category, visibility, owner_id")
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
      tagline: source.tagline,
      subcategory: source.subcategory,
      category: source.category,
      visibility: source.visibility,
      parent_project_id: projectId,
      status: "idea",
    });
    if (!error) {
      const { data: created } = await supabase.from("projects").select("id").eq("slug", slug).maybeSingle();
      if (!created) break;
      const { data: links } = await supabase
        .from("project_skills")
        .select("skill_id, relation")
        .eq("project_id", projectId)
        .in("relation", ["uses", "seeking"]);
      if (links?.length) {
        await supabase.from("project_skills").insert(
          links.map((row) => ({ project_id: created.id, skill_id: row.skill_id, relation: row.relation })),
        );
      }
      redirect(`/forge/${slug}`);
    }
    if (error?.code !== "23505") break;
  }
  redirect(`/forge/${source.slug}?tab=overview`);
}

export async function createCommit(_state: ActionState, formData: FormData): Promise<ActionState> {
  const member = await requireMember();
  const projectId = String(formData.get("projectId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const kind = String(formData.get("kind") ?? "update");
  if (title.length < 1 || title.length > 120) return { error: "A commit title needs 1–120 characters." };
  if (content.length < 1 || content.length > 8000) return { error: "Describe the change." };
  if (!isBuildLogKind(kind)) return { error: "Choose what this commit records." };
  const files = formData.getAll("file").filter((item): item is File => item instanceof File && item.size > 0);
  if (files.length > 4) return { error: "A commit can have 4 files." };

  const supabase = await createClient();
  const urls: string[] = [];
  for (const file of files) {
    const stored = await storeUserFile(supabase, member.id, file, {
      bucket: "post-media",
      ...photoLimits.post,
      allowVideo: true,
      allowDocument: true,
    });
    if (!stored.ok) return { error: stored.error };
    if (stored.url) urls.push(stored.url);
  }
  const { error } = await supabase.from("build_logs").insert({
    project_id: projectId,
    author_id: member.id,
    title,
    content,
    kind,
    media_urls: urls,
  });
  if (error) return { error: "That commit was not saved. Only people on the project can commit." };
  redirect(`/forge/${slug}?tab=commits`);
}

export async function commentOnUpdate(formData: FormData) {
  const member = await requireMember();
  const postId = String(formData.get("postId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!projectIdPattern.test(postId) || !isProjectSlug(slug) || content.length < 1 || content.length > 2000) return;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("type", "build_log")
    .is("removed_at", null)
    .maybeSingle();
  if (!post) return;
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: member.id,
    content,
  });
  if (error) return;
  revalidatePath(`/forge/${slug}`);
}

export async function reactToUpdate(formData: FormData) {
  const member = await requireMember();
  const postId = String(formData.get("postId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const type = String(formData.get("type") ?? "");
  if (!projectIdPattern.test(postId) || !isProjectSlug(slug) || !isReactionType(type)) return;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("type", "build_log")
    .is("removed_at", null)
    .maybeSingle();
  if (!post) return;
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("user_id", member.id)
    .eq("post_id", postId)
    .eq("type", type)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from("reactions").delete().eq("id", existing.id).eq("user_id", member.id);
    if (error) return;
  } else {
    if (type === "upvote" || type === "downvote") {
      await supabase
        .from("reactions")
        .delete()
        .eq("user_id", member.id)
        .eq("post_id", postId)
        .eq("type", type === "upvote" ? "downvote" : "upvote");
    }
    const { error } = await supabase.from("reactions").insert({
      user_id: member.id,
      post_id: postId,
      type,
    });
    if (error) return;
  }
  revalidatePath(`/forge/${slug}`);
  revalidatePath("/");
  revalidatePath("/discover");
  revalidatePath(`/posts/${postId}`);
}

export async function toggleFollowUpdate(formData: FormData) {
  const member = await requireMember();
  const buildLogId = String(formData.get("buildLogId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!projectIdPattern.test(buildLogId) || !isProjectSlug(slug)) return;
  const supabase = await createClient();
  const { data: log } = await supabase
    .from("build_logs")
    .select("id")
    .eq("id", buildLogId)
    .is("removed_at", null)
    .maybeSingle();
  if (!log) return;
  const { data: existing } = await supabase
    .from("build_log_follows")
    .select("profile_id")
    .eq("profile_id", member.id)
    .eq("build_log_id", buildLogId)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("build_log_follows").delete().eq("profile_id", member.id).eq("build_log_id", buildLogId)
    : await supabase.from("build_log_follows").insert({ profile_id: member.id, build_log_id: buildLogId });
  if (error) return;
  revalidatePath(`/forge/${slug}`);
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

  const photo = await storeUserFile(supabase, member.id, formData.get("photo"), {
    bucket: "post-media",
    ...photoLimits.post,
  });
  if (photo && !photo.ok) return { error: photo.error };

  const { error } = await supabase.from("posts").insert({
    author_id: member.id,
    type: "idea",
    project_id: projectId,
    title,
    content,
    media_urls: photo.ok && photo.url ? [photo.url] : [],
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
