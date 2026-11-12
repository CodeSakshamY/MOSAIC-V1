import type { Metadata } from "next";
import { EventForm } from "@/components/opportunities/EventForm";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember } from "@/lib/auth/session";
import { opportunityCategoryLabel } from "@/lib/opportunities/categories";
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
    .select("id, title, organizer, official_url, deadline, description, category, start_date, is_online")
    .eq("is_published", true)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(30);
  const opportunities = (data ?? []).filter((item) => item.category !== "workshop" && item.category !== "maker_event");
  const events = (data ?? []).filter((item) => item.category === "workshop" || item.category === "maker_event");
  const signedIn = Boolean(member?.onboardingComplete && !member.suspended && !member.deletedAt);

  return (
    <SectionPage
      editorial
      title="Opportunities"
      lede="Announcements keep the organiser's official link. A deadline appears only when the person who posted it entered one."
    >
      {signedIn ? <OpportunityForm /> : null}
      {signedIn ? <EventForm /> : null}
      <h2 id="events-heading">Events</h2>
      {events.length === 0 ? <p>No events yet.</p> : null}
      <ul className="repo-list" role="list">
        {events.map((item) => (
          <li key={item.id} className="repo-row">
            <div className="repo-title">
              <strong>{item.title}</strong>
              <span className="repo-visibility">{item.is_online ? "Online" : "In person"}</span>
            </div>
            <p>{item.description}</p>
            <p>
              <a href={item.official_url}>Registration link</a>
            </p>
            <p className="form-note">{item.start_date ? `Date ${item.start_date.slice(0, 10)}` : "No date was provided."}</p>
          </li>
        ))}
      </ul>
      <h2>Opportunities</h2>
      {opportunities.length === 0 ? <p>No opportunities yet.</p> : null}
      <ul className="repo-list" role="list">
        {opportunities.map((item) => (
          <li key={item.id} className="repo-row">
            <div className="repo-title">
              <strong>{item.title}</strong>
              <span className="repo-visibility">{opportunityCategoryLabel(item.category)} · {item.organizer}</span>
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
