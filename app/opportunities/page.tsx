import type { Metadata } from "next";
import { SectionPage } from "@/components/shell/SectionPage";

export const metadata: Metadata = {
  title: "Opportunities",
};

export default function OpportunitiesPage() {
  return (
    <SectionPage
      editorial
      title="Find something worth entering."
      lede="Hackathons, research programs, fellowships, and maker events will be listed here, each with its official source."
    />
  );
}
