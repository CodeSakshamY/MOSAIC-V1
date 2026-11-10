import { redirect } from "next/navigation";

export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.next) query.set("next", params.next);
  if (params.error) query.set("error", params.error);
  const suffix = query.toString();
  redirect(suffix ? `/profile?${suffix}` : "/profile");
}
