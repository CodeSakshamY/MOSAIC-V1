import type { Metadata } from "next";
import { SectionPage } from "@/components/shell/SectionPage";

export const metadata: Metadata = {
  title: "People",
};

export default function PeoplePage() {
  return (
    <SectionPage
      title="People"
      lede="A search for builders by skill, interest, and city will live here."
    />
  );
}
