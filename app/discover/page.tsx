import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoverFeed, discoverView } from "@/components/discover/DiscoverFeed";
import { SectionPage } from "@/components/shell/SectionPage";

export const metadata: Metadata = {
  title: "Discover",
};

export default function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <DiscoverPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DiscoverPageContent({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  return (
    <SectionPage
      className="discover-page"
      editorial
      title="Discover"
      lede="Look through people, projects, and ideas. Posts are the written feed. Reels are the photo posts. Reading does not need an account."
    >
      <DiscoverFeed view={discoverView(params.view)} />
    </SectionPage>
  );
}
