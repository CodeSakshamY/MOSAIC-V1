import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicPeople } from "@/components/profile/PublicPeople";
import { SectionPage } from "@/components/shell/SectionPage";

export const metadata: Metadata = {
  title: "People",
};

export default function PeoplePage() {
  return (
    <SectionPage title="People" lede="Open a profile to see education, work, certificates, and projects.">
      <Suspense fallback={null}>
        <PublicPeople />
      </Suspense>
    </SectionPage>
  );
}
