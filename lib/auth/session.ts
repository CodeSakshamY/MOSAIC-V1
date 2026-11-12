import "server-only";
import { connection } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Member = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string;
  onboardingComplete: boolean;
  onboardingStep: number;
  deletedAt: string | null;
  suspended: boolean;
};

type Client = SupabaseClient<Database>;

export async function getMember(existing?: Client): Promise<Member | null> {
  await connection();
  const supabase = existing ?? (await createClient());
  const { data, error } = await supabase.auth.getClaims();
  const id = data?.claims.sub;
  if (error || !id) return null;

  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  const [profileResult, privateResult, statusResult] = await Promise.all([
    supabase
      .from("profile_directory")
      .select("username, display_name, onboarding_complete, deleted_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("profile_private")
      .select("onboarding_step")
      .eq("profile_id", id)
      .maybeSingle(),
    supabase.rpc("current_member_status"),
  ]);

  return {
    id,
    email,
    username: profileResult.data?.username ?? null,
    displayName: profileResult.data?.display_name ?? "Builder",
    onboardingComplete: profileResult.data?.onboarding_complete ?? false,
    onboardingStep: privateResult.data?.onboarding_step ?? 1,
    deletedAt: profileResult.data?.deleted_at ?? null,
    suspended: statusResult.data === "suspended",
  };
}

export function memberGate(member: Member) {
  if (member.deletedAt) return "/account/closed";
  if (member.suspended) return "/account/suspended";
  if (!member.onboardingComplete) return "/onboarding";
  return null;
}
