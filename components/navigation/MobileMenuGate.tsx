import { MobileMenu } from "@/components/navigation/MobileMenu";
import { getMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function MobileMenuGate() {
  const member = await getMember();
  const signedIn = Boolean(member && !member.deletedAt);
  let unread = 0;
  if (member && !member.deletedAt && !member.suspended && member.onboardingComplete) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", member.id)
      .is("read_at", null);
    unread = count ?? 0;
  }
  return <MobileMenu signedIn={signedIn} displayName={signedIn ? member?.displayName ?? null : null} unread={unread} />;
}
