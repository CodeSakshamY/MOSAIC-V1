import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMember, memberGate } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/validation";

export const instant = false;

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <MemberGate>{children}</MemberGate>
    </Suspense>
  );
}

async function MemberGate({ children }: { children: React.ReactNode }) {
  const member = await getMember();
  const path = safeNext((await headers()).get("x-polymath-path"));
  if (!member) redirect(`/profile?next=${encodeURIComponent(path === "/" ? "/settings" : path)}`);
  const gate = memberGate(member);
  if (gate) redirect(gate);
  return children;
}
