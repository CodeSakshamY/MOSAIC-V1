import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/CredentialForm";
import { SectionPage } from "@/components/shell/SectionPage";

export const instant = false;

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <SectionPage title="Reset password" lede="We will email you a link to choose a new password.">
      <ForgotPasswordForm />
    </SectionPage>
  );
}
