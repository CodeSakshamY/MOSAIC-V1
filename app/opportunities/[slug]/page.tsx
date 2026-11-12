import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember } from "@/lib/auth/session";
import { opportunityCategoryLabel } from "@/lib/opportunities/categories";
import { toggleOpportunitySave } from "@/lib/opportunities/actions";
import { reportOpportunity } from "@/lib/safety/actions";
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reported?: string }>;
}) {
  const { slug } = await params;
  const reported = (await searchParams).reported;
  const member = await getMember();
  const supabase = await createClient();
  const { data } = await supabase
    .from("opportunities")
    .select("id, title, organizer, official_url, deadline, description, category, eligibility, country, state, created_by")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("removed_at", null)
    .maybeSingle();
  if (!data) notFound();
  const signedIn = Boolean(member?.onboardingComplete && !member.suspended && !member.deletedAt);
  const { data: saved } = member && signedIn
    ? await supabase.from("opportunity_saves").select("opportunity_id").eq("opportunity_id", data.id).eq("profile_id", member.id).maybeSingle()
    : { data: null };

  return (
    <SectionPage editorial title={data.title} lede={`${opportunityCategoryLabel(data.category)} · ${data.organizer}`}>
      <p>{data.description}</p>
      {data.eligibility ? <p>{data.eligibility}</p> : null}
      {data.country || data.state ? <p className="form-note">{[data.country, data.state].filter(Boolean).join(" · ")}</p> : null}
      <p>
        <a href={data.official_url}>Official application link</a>
      </p>
      <p className="form-note">{data.deadline ? `Deadline ${data.deadline.slice(0, 10)}` : "No deadline was provided."}</p>
      {signedIn ? (
        <form action={toggleOpportunitySave}>
          <input type="hidden" name="opportunityId" value={data.id} />
          <input type="hidden" name="slug" value={slug} />
          <button className="text-button" type="submit" aria-pressed={Boolean(saved)}>
            {saved ? "Saved" : "Save opportunity"}
          </button>
        </form>
      ) : null}
      {member && member.id !== data.created_by && !member.deletedAt ? (
        <form className="form-stack" action={reportOpportunity}>
          <input type="hidden" name="opportunityId" value={data.id} />
          <input type="hidden" name="slug" value={slug} />
          <label htmlFor="opportunity-report">Report this listing</label>
          <select id="opportunity-report" name="reason" className="field-select" defaultValue="outdated">
            <option value="outdated">Outdated</option>
            <option value="misleading">Misleading</option>
          </select>
          <button className="text-button" type="submit">
            Send report
          </button>
          {reported === "1" ? <p>Report sent. It stays open until someone reviews it.</p> : null}
          {reported === "missing" ? <p className="form-error">The report was not sent.</p> : null}
        </form>
      ) : null}
    </SectionPage>
  );
}
