import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/CredentialForm";
import { ProfessionalProfile } from "@/components/profile/ProfessionalProfile";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember, memberGate } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/validation";

export const instant = false;

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <ProfileContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProfileContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const member = await getMember();
  if (!member) {
    const next = params.next ? safeNext(params.next) : "/profile";
    return (
      <SectionPage
        title="Log in"
        lede="Your profile is the only place that asks for an account. Home and Discover stay open to read. Liking and commenting send you here."
      >
        <LoginForm next={next} initialError={params.error} />
      </SectionPage>
    );
  }

  const gate = memberGate(member);
  if (gate) redirect(gate);

  return <ProfessionalProfile profileId={member.id} editable />;
}
