import type { Metadata } from "next";
import { SectionPage } from "@/components/shell/SectionPage";

export const metadata: Metadata = {
  title: "Discover",
};

export default function DiscoverPage() {
  return (
    <SectionPage
      editorial
      title="What builders are making"
      lede="Trending projects, new work, people, and communities will be gathered here from the same records as the feed. You can read this without an account. Liking and commenting use the profile login."
    />
  );
}
