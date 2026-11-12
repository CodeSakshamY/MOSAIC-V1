"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMember, memberGate } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function staffClient() {
  const member = await getMember();
  if (!member) redirect("/profile?next=/moderation");
  const gate = memberGate(member);
  if (gate) redirect(gate);
  const supabase = await createClient();
  const { data: staff } = await supabase.rpc("current_user_is_staff");
  if (!staff) return null;
  return { supabase, member };
}

export async function dismissReport(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");
  const staff = await staffClient();
  if (!staff || !idPattern.test(reportId)) return;
  await staff.supabase
    .from("reports")
    .update({ status: "dismissed", reviewed_at: new Date().toISOString(), reviewed_by: staff.member.id })
    .eq("id", reportId)
    .eq("status", "open");
  revalidatePath("/moderation");
  redirect("/moderation");
}

export async function removeReported(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");
  const staff = await staffClient();
  if (!staff || !idPattern.test(reportId)) return;
  const { error } = await staff.supabase.rpc("staff_remove_report", { report: reportId });
  if (error) return;
  revalidatePath("/moderation");
  revalidatePath("/discover");
  redirect("/moderation");
}

export async function suspendReported(formData: FormData) {
  const profileId = String(formData.get("profileId") ?? "");
  const staff = await staffClient();
  if (!staff || !idPattern.test(profileId) || profileId === staff.member.id) return;
  await staff.supabase.from("account_sanctions").insert({
    profile_id: profileId,
    kind: "suspension",
    reason: "Suspended from the report queue.",
    created_by: staff.member.id,
  });
  revalidatePath("/moderation");
  redirect("/moderation");
}

export async function restoreSanction(formData: FormData) {
  const sanctionId = String(formData.get("sanctionId") ?? "");
  const staff = await staffClient();
  if (!staff || !idPattern.test(sanctionId)) return;
  await staff.supabase
    .from("account_sanctions")
    .update({ lifted_at: new Date().toISOString(), lifted_by: staff.member.id })
    .eq("id", sanctionId)
    .is("lifted_at", null);
  revalidatePath("/moderation");
  redirect("/moderation");
}
