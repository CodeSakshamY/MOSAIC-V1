import type { Metadata } from "next";
import { EventForm } from "@/components/opportunities/EventForm";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember } from "@/lib/auth/session";
import { isOpportunityCategory, opportunityCategories, opportunityCategoryLabel } from "@/lib/opportunities/categories";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Opportunities",
};

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string; country?: string; region?: string; eligibility?: string }>;
}) {
  const params = await searchParams;
  const discipline = params.discipline && isOpportunityCategory(params.discipline) ? params.discipline : "";
  const country = /^[A-Za-z]{2}$/.test(params.country ?? "") ? (params.country ?? "").toUpperCase() : "";
  const region = (params.region ?? "").trim().replace(/[%_\\,]/g, "").replace(/\s+/g, " ").slice(0, 80);
  const eligibility = (params.eligibility ?? "").trim().replace(/[%_\\,]/g, "").replace(/\s+/g, " ").slice(0, 80);
  const member = await getMember();
  const supabase = await createClient();
  let query = supabase
    .from("opportunities")
    .select("id, title, organizer, official_url, deadline, description, category, start_date, is_online, eligibility, country, state")
    .eq("is_published", true)
    .is("removed_at", null)
    .order("created_at", { ascending: false })
    .limit(30);
  if (discipline) query = query.eq("category", discipline);
  if (country) query = query.eq("country", country);
  if (region) query = query.ilike("state", `%${region}%`);
  if (eligibility) query = query.ilike("eligibility", `%${eligibility}%`);
  const { data } = await query;
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
      <form className="discover-filters" action="/opportunities">
        <div className="field">
          <label htmlFor="filter-discipline">Discipline</label>
          <select id="filter-discipline" name="discipline" className="field-select" defaultValue={discipline}>
            <option value="">Any</option>
            {opportunityCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-country">Country</label>
          <input id="filter-country" name="country" defaultValue={country} maxLength={2} className="repo-search-input" />
        </div>
        <div className="field">
          <label htmlFor="filter-region">Region</label>
          <input id="filter-region" name="region" defaultValue={region} maxLength={80} className="repo-search-input" />
        </div>
        <div className="field">
          <label htmlFor="filter-eligibility">Eligibility</label>
          <input id="filter-eligibility" name="eligibility" defaultValue={eligibility} maxLength={80} className="repo-search-input" />
        </div>
        <button className="text-button" type="submit">
          Apply filters
        </button>
      </form>
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
            {item.eligibility ? <p>{item.eligibility}</p> : null}
            {item.country || item.state ? <p className="form-note">{[item.country, item.state].filter(Boolean).join(" · ")}</p> : null}
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
