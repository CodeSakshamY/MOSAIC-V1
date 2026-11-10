import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/CredentialForm";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember } from "@/lib/auth/session";

export const instant = false;

export const metadata: Metadata = { title: "Choose a password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

async function ResetPasswordContent() {
  const member = await getMember();
  return (
    <SectionPage
      title="Choose a password"
      lede={
        member
          ? "This replaces the password on your account."
          : "Open the reset link from your email, then choose a new password."
      }
    >
      {member ? <ResetPasswordForm /> : null}
    </SectionPage>
  );
}
