import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth/actions";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember } from "@/lib/auth/session";

export const instant = false;

export const metadata: Metadata = { title: "Account closed" };

export default function ClosedPage() {
  return (
    <Suspense fallback={null}>
      <ClosedNotice />
    </Suspense>
  );
}

async function ClosedNotice() {
  const member = await getMember();
  if (!member) redirect("/login");
  if (!member.deletedAt) redirect(member.suspended ? "/account/suspended" : "/");

  return (
    <SectionPage
      title="This account is closed"
      lede="The profile is now “Deleted builder”. Projects and comments stay attached to that name. This login cannot be used again."
    >
      <form action={signOut} className="form-stack">
        <button className="text-button" type="submit">
          Sign out
        </button>
      </form>
    </SectionPage>
  );
}
