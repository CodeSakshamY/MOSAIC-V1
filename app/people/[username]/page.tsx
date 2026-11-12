import type { Metadata } from "next";
import { connection } from "next/server";
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
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.from("profile_directory").select("display_name, bio").eq("username", username).maybeSingle();
  return {
    title: data?.display_name || username,
    description: data?.bio || undefined,
  };
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
    .from("profile_directory")
    .select("id, display_name, username, visibility, deleted_at")
    .eq("username", username)
    .maybeSingle();
  if (!data || data.deleted_at || !data.username) notFound();
  if (data.visibility === "private" && member?.id !== data.id) {
    return (
      <article className="profile-page">
        <header className="profile-header">
          <h1>{data.display_name}</h1>
          <p>@{data.username}</p>
          <p>This profile is private.</p>
        </header>
      </article>
    );
  }

  return (
    <ProfessionalProfile
      profileId={data.id}
      editable={member?.id === data.id}
      reported={reportedState(query.reported)}
    />
  );
}
