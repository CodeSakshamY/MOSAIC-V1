import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getMember, memberGate } from "@/lib/auth/session";

export const instant = false;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}

async function AuthGate({ children }: { children: React.ReactNode }) {
  const member = await getMember();
  if (member) redirect(memberGate(member) ?? "/");
  return children;
}
