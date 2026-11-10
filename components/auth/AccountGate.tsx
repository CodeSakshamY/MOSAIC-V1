import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMember } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/validation";

export async function AccountGate({ children }: { children: React.ReactNode }) {
  const member = await getMember();
  if (!member || (!member.deletedAt && !member.suspended)) return children;

  const path = safeNext((await headers()).get("x-polymath-path"));
  if (member.deletedAt && path !== "/account/closed") redirect("/account/closed");
  if (member.suspended && !member.deletedAt && path !== "/account/suspended") {
    redirect("/account/suspended");
  }
  return children;
}
