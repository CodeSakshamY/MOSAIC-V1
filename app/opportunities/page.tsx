import type { Metadata } from "next";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Opportunities",
};

export default async function OpportunitiesPage() {
  const member = await getMember();
  const supabase = await createClient();
  const { data } = await supabase
    .from("opportunities")
    .select("id, title, organizer, official_url, deadline, description")
    .eq("is_published", true)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(30);
  const opportunities = data ?? [];
  const signedIn = Boolean(member?.onboardingComplete && !member.suspended && !member.deletedAt);

  return (
    <SectionPage
      editorial
      title="Opportunities"
      lede="Announcements keep the organiser's official link. A deadline appears only when the person who posted it entered one."
    >
      {signedIn ? <OpportunityForm /> : null}
      {opportunities.length === 0 ? <p>No opportunities yet.</p> : null}
      <ul className="repo-list" role="list">
        {opportunities.map((item) => (
          <li key={item.id} className="repo-row">
            <div className="repo-title">
              <strong>{item.title}</strong>
              <span className="repo-visibility">{item.organizer}</span>
            </div>
            <p>{item.description}</p>
            <p>
              <a href={item.official_url}>Official link</a>
            </p>
            <p className="form-note">{item.deadline ? `Deadline ${item.deadline.slice(0, 10)}` : "No deadline was provided."}</p>
          </li>
        ))}
      </ul>
    </SectionPage>
  );
}
