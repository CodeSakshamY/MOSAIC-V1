import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember } from "@/lib/auth/session";
import { opportunityCategoryLabel } from "@/lib/opportunities/categories";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await getMember();
  const supabase = await createClient();
  const { data } = await supabase
    .from("opportunities")
    .select("title, organizer, official_url, deadline, description, category, eligibility, country, state")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("removed_at", null)
    .maybeSingle();
  if (!data) notFound();

  return (
    <SectionPage editorial title={data.title} lede={`${opportunityCategoryLabel(data.category)} · ${data.organizer}`}>
      <p>{data.description}</p>
      {data.eligibility ? <p>{data.eligibility}</p> : null}
      {data.country || data.state ? <p className="form-note">{[data.country, data.state].filter(Boolean).join(" · ")}</p> : null}
      <p>
        <a href={data.official_url}>Official application link</a>
      </p>
      <p className="form-note">{data.deadline ? `Deadline ${data.deadline.slice(0, 10)}` : "No deadline was provided."}</p>
    </SectionPage>
  );
}
