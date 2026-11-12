import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoverFeed, discoverView, readDiscoverFilters } from "@/components/discover/DiscoverFeed";
import { SectionPage } from "@/components/shell/SectionPage";

export const metadata: Metadata = {
  title: "Discover",
};

export default function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; age?: string; place?: string; skill?: string; discipline?: string; interest?: string; experience?: string; availability?: string; looking?: string; type?: string }>;
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
  searchParams: Promise<{ view?: string; q?: string; age?: string; place?: string; skill?: string; discipline?: string; interest?: string; experience?: string; availability?: string; looking?: string; type?: string }>;
}) {
  const params = await searchParams;
  return (
    <SectionPage
      className="discover-page"
      editorial
      title="Discover"
      lede="Look through people, projects, and ideas. Posts are the written feed. Reels are the photo posts. Reading does not need an account."
    >
      <DiscoverFeed view={discoverView(params.view)} filters={readDiscoverFilters(params)} />
    </SectionPage>
  );
}
