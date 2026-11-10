import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth/actions";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember } from "@/lib/auth/session";

export const instant = false;

export const metadata: Metadata = { title: "Account suspended" };

export default function SuspendedPage() {
  return (
    <Suspense fallback={null}>
      <SuspendedNotice />
    </Suspense>
  );
}

async function SuspendedNotice() {
  const member = await getMember();
  if (!member) redirect("/login");
  if (member.deletedAt) redirect("/account/closed");
  if (!member.suspended) redirect(member.onboardingComplete ? "/" : "/onboarding");

  return (
    <SectionPage
      title="This account is suspended"
      lede="You can read this notice and sign out. Posting, following, and editing stay off until a moderator lifts the suspension."
    >
      <form action={signOut} className="form-stack">
        <button className="text-button" type="submit">
          Sign out
        </button>
      </form>
    </SectionPage>
  );
}
