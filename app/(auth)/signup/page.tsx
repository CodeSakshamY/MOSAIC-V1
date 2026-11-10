import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/CredentialForm";
import { SectionPage } from "@/components/shell/SectionPage";
import { brand } from "@/lib/brand";

export const instant = false;

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <SectionPage
      title="Create an account"
      lede={`${brand.name} is for people who build things. You will confirm your email, then set up a profile.`}
    >
      <SignupForm />
    </SectionPage>
  );
}
