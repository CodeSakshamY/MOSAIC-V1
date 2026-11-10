import type { Metadata } from "next";
import { SectionPage } from "@/components/shell/SectionPage";

export const metadata: Metadata = {
  title: "Communities",
};

export default function CommunitiesPage() {
  return (
    <SectionPage
      title="Communities"
      lede="Groups around a discipline, a city, or a school will gather projects and members here. There is no chat in this version."
    />
  );
}
