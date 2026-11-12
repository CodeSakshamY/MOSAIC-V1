"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMember, memberGate } from "@/lib/auth/session";
import { parseWebsite } from "@/lib/auth/validation";
import { isOpportunityCategory } from "@/lib/opportunities/categories";
import { projectSlug } from "@/lib/projects/slug";
import { createClient } from "@/lib/supabase/server";

export async function announceOpportunity(_state: { error?: string } | null, formData: FormData) {
  const member = await getMember();
  if (!member) redirect("/profile?next=/opportunities");
  const gate = memberGate(member);
  if (gate) redirect(gate);
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const organizer = String(formData.get("organizer") ?? "").trim().slice(0, 120);
  const description = String(formData.get("description") ?? "").trim().slice(0, 8000);
  const category = String(formData.get("category") ?? "");
  const link = parseWebsite(String(formData.get("url") ?? ""));
  const deadlineText = String(formData.get("deadline") ?? "").trim();
  const eligibility = String(formData.get("eligibility") ?? "").trim().slice(0, 1000);
  const region = String(formData.get("region") ?? "").trim().slice(0, 80);
  const countryText = String(formData.get("country") ?? "").trim();
  if (title.length < 3) return { error: "Add a title." };
  if (!organizer) return { error: "Add the organiser." };
  if (!description) return { error: "Describe the opportunity." };
  if (!isOpportunityCategory(category)) return { error: "Choose a category." };
  if (!link.ok || !link.website) return { error: link.ok ? "Add the official https link." : link.error };
  if (countryText && !/^[A-Za-z]{2}$/.test(countryText)) return { error: "Use a two-letter country code, or leave it empty." };
  let deadline: string | null = null;
  if (deadlineText) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadlineText)) return { error: "Use a real date, or leave the deadline empty." };
    deadline = `${deadlineText}T00:00:00.000Z`;
  }
  const slug = projectSlug(title);
  if (slug.length < 3) return { error: "Use a title that can become a link." };
  const supabase = await createClient();
  const { error } = await supabase.from("opportunities").insert({
    title,
    slug,
    organizer,
    description,
    category,
    official_url: link.website,
    deadline,
    eligibility: eligibility || null,
    country: countryText ? countryText.toUpperCase() : null,
    state: region || null,
    is_published: true,
    is_verified: false,
    is_demo: false,
    created_by: member.id,
  });
  if (error) return { error: "That announcement was not saved." };
  revalidatePath("/opportunities");
  revalidatePath("/discover");
  redirect("/opportunities");
}

export async function announceEvent(_state: { error?: string } | null, formData: FormData) {
  const member = await getMember();
  if (!member) redirect("/profile?next=/opportunities");
  const gate = memberGate(member);
  if (gate) redirect(gate);
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const description = String(formData.get("description") ?? "").trim().slice(0, 8000);
  const link = parseWebsite(String(formData.get("url") ?? ""));
  const start = String(formData.get("start") ?? "").trim();
  if (title.length < 3) return { error: "Add a title." };
  if (!description) return { error: "Describe the event." };
  if (!link.ok || !link.website) return { error: link.ok ? "Add the registration https link." : link.error };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return { error: "Enter the date the organiser published." };
  const slug = projectSlug(`event ${title}`);
  if (slug.length < 3) return { error: "Use a title that can become a link." };
  const supabase = await createClient();
  const { error } = await supabase.from("opportunities").insert({
    title,
    slug,
    organizer: member.displayName,
    description,
    category: "workshop",
    official_url: link.website,
    start_date: `${start}T00:00:00.000Z`,
    is_online: formData.get("online") === "1",
    is_published: true,
    is_verified: false,
    is_demo: false,
    created_by: member.id,
  });
  if (error) return { error: "That event was not saved." };
  revalidatePath("/opportunities");
  revalidatePath("/discover");
  redirect("/opportunities");
}
