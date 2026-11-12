"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMember, memberGate } from "@/lib/auth/session";
import { parseEmail, parsePassword, safeNext } from "@/lib/auth/validation";

export type ActionState = { error?: string; notice?: string } | null;

async function origin() {
  const headerList = await headers();
  return headerList.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";
}

function authError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) return "Email or password is wrong.";
  if (lower.includes("email not confirmed")) {
    return "Confirm your email before you log in. Check your inbox.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "An account with that email already exists. Log in instead.";
  }
  return "That did not work. Try again.";
}

export async function signUp(_state: ActionState, formData: FormData): Promise<ActionState> {
  const email = parseEmail(String(formData.get("email") ?? ""));
  if (!email.ok) return { error: email.error };
  const password = parsePassword(String(formData.get("password") ?? ""));
  if (!password.ok) return { error: password.error };
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== password.password) return { error: "Those passwords do not match." };

  const supabase = await createClient();
  const site = await origin();
  const { data, error } = await supabase.auth.signUp({
    email: email.email,
    password: password.password,
    options: {
      emailRedirectTo: `${site}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { error: authError(error.message) };
  if (data.session) redirect("/onboarding");
  return {
    notice: `Check ${email.email} for a confirmation link, then come back to finish your profile.`,
  };
}

export async function signIn(_state: ActionState, formData: FormData): Promise<ActionState> {
  const email = parseEmail(String(formData.get("email") ?? ""));
  if (!email.ok) return { error: email.error };
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "Enter your password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.email,
    password,
  });
  if (error) return { error: authError(error.message) };

  const member = await getMember(supabase);
  if (!member) return { error: "You are signed in, but the profile is missing. Refresh and try again." };
  redirect(memberGate(member) ?? safeNext(String(formData.get("next") ?? "")));
}

export async function requestPasswordReset(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = parseEmail(String(formData.get("email") ?? ""));
  if (!email.ok) return { error: email.error };
  const supabase = await createClient();
  const site = await origin();
  await supabase.auth.resetPasswordForEmail(email.email, {
    redirectTo: `${site}/auth/callback?next=/reset-password`,
  });
  return {
    notice: "If that email has an account, a reset link is on its way.",
  };
}

export async function updatePassword(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = parsePassword(String(formData.get("password") ?? ""));
  if (!password.ok) return { error: password.error };
  const supabase = await createClient();
  const member = await getMember(supabase);
  if (!member) return { error: "Open the reset link from your email, then choose a new password." };
  const { error } = await supabase.auth.updateUser({ password: password.password });
  if (error) return { error: "That password was not saved. Request a new link and try again." };
  redirect(memberGate(member) ?? "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function closeAccount(_state: ActionState, formData: FormData): Promise<ActionState> {
  const member = await getMember();
  if (!member) redirect("/profile?next=/settings");
  const gate = memberGate(member);
  if (gate) redirect(gate);
  if (formData.get("confirm") !== "yes") return { error: "Confirm that this closes the account." };
  const typed = String(formData.get("username") ?? "").trim();
  if (!member.username || typed !== member.username) return { error: "Type your username to close the account." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("anonymize_profile", { target: member.id });
  if (error) return { error: "The account was not closed." };
  redirect("/account/closed");
}
