import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfessionalProfile } from "@/components/profile/ProfessionalProfile";
import { reportedState } from "@/components/safety/ReportForm";
import { getMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: username };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ reported?: string }>;
}) {
  const { username } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const member = await getMember();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, deleted_at")
    .eq("username", username)
    .maybeSingle();
  if (!data || data.deleted_at) notFound();

  return (
    <ProfessionalProfile
      profileId={data.id}
      editable={member?.id === data.id}
      reported={reportedState(query.reported)}
    />
  );
}
