import type { Metadata } from "next";
import { SectionPage } from "@/components/shell/SectionPage";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Guidelines" };

export default function GuidelinesPage() {
  return (
    <SectionPage
      title="Community guidelines"
      lede={`Draft rules for ${brand.name}. A lawyer has not reviewed this copy. It is the product boundary the app enforces.`}
      editorial
    >
      <div className="prose-block">
        <h2>Who can join</h2>
        <p>Accounts are for people aged 13 and older. Age is stored as a band, never as a date of birth. We do not collect a phone number, a street address, or coordinates.</p>
        <h2>How to treat people</h2>
        <p>No harassment, impersonation, or spam. Do not post someone else’s private information. Credit work that is not yours.</p>
        <h2>What this version does not do</h2>
        <p>There are no direct messages. There is no behavioural advertising profile. Opportunities must link to an official page, and the app does not invent deadlines.</p>
        <h2>If something is wrong</h2>
        <p>Reporting tools arrive with moderation. Until then, do not use the product to threaten anyone or to share sexual content involving anyone under 18.</p>
      </div>
    </SectionPage>
  );
}
