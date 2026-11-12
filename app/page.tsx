import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HomeCard } from "@/components/feed/HomeCard";
import { HomePager } from "@/components/feed/HomePager";
import { RecommendedCommunities } from "@/components/profile/RecommendedCommunities";
import { SharedPeople } from "@/components/profile/SharedPeople";
import { TrendingProjects } from "@/components/discover/TrendingProjects";
import { getMember } from "@/lib/auth/session";
import { brand } from "@/lib/brand";
import { loadHome, loadPublicProjects, parseCursor, parseHomeTab, type HomeTab } from "@/lib/feed/home";

export const instant = false;

export const metadata: Metadata = {
  title: {
    absolute: `Home · ${brand.name}`,
  },
};

const tabs: { id: HomeTab; label: string; lede: string }[] = [
  { id: "projects", label: "Your projects", lede: "Updates and threads on your projects." },
  { id: "following", label: "Following", lede: "Posts from people and projects you follow, newest first." },
  { id: "for-you", label: "For you", lede: "Public posts scored from your interests, skills, follows, and how recent they are." },
  { id: "nearby", label: "Nearby", lede: "Public posts from your city, or your state when the city has none." },
];

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; cursor?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <HomeFeed searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeFeed({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; cursor?: string }>;
}) {
  const member = await getMember();
  if (member?.deletedAt) redirect("/account/closed");
  if (member?.suspended) redirect("/account/suspended");
  const params = await searchParams;
  if (!member?.onboardingComplete) {
    const projects = await loadPublicProjects();
    return (
      <div className="home-layout">
        <header className="page-header">
          <h1>Home</h1>
          <p className="lede">Recent public projects.</p>
        </header>
        {projects.length === 0 ? (
          <div className="empty-feed">
            <h2>Nothing public yet</h2>
            <p>
              <Link href="/profile">Log in</Link> to see your own projects, or browse <Link href="/discover">Discover</Link>.
            </p>
          </div>
        ) : (
          <ul className="repo-list" role="list">
            {projects.map((project) => (
              <li key={project.id} className="repo-row">
                <div className="repo-title">
                  <strong>
                    <Link href={project.href}>{project.title}</Link>
                  </strong>
                  <span className="repo-visibility">Project</span>
                </div>
                <p className="discover-copy">{project.content}</p>
              </li>
            ))}
          </ul>
        )}
        <TrendingProjects />
      </div>
    );
  }

  const tab = parseHomeTab(params.tab);
  const current = tabs.find((item) => item.id === tab) ?? tabs[0]!;
  const feed = await loadHome(member.id, tab, parseCursor(params.cursor));
  const profileHref = member.username ? `/people/${member.username}` : "/settings";

  return (
    <div className="home-layout">
      <section aria-label={current.label}>
        <header className="page-header">
          <h1>Home</h1>
          <p className="lede">{current.lede}</p>
          <nav className="repo-filters" aria-label="Home">
            {tabs.map((item) => (
              <Link key={item.id} href={item.id === "projects" ? "/" : `/?tab=${item.id}`} aria-current={item.id === tab ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {feed.note ? <p className="feed-reason">{feed.note}</p> : null}
        {feed.items.length === 0 ? (
          <div className="empty-feed">
            <h2>Nothing here yet</h2>
            <p>
              {feed.empty}{" "}
              {tab === "projects" ? (
                <Link href="/forge">Open Forge</Link>
              ) : tab === "following" ? (
                <Link href="/discover?view=people">Find people</Link>
              ) : tab === "nearby" ? (
                <Link href={profileHref}>Edit your profile</Link>
              ) : (
                <Link href="/discover">Browse Discover</Link>
              )}
            </p>
          </div>
        ) : (
          <ul className="repo-list" role="list">
            {feed.items.map((item) => (
              <HomeCard key={item.id} item={item} dismiss={tab === "for-you"} />
            ))}
          </ul>
        )}
        {feed.nextCursor ? (
          <HomePager tab={tab} cursor={feed.nextCursor} dismiss={tab === "for-you"} />
        ) : null}
        <SharedPeople memberId={member.id} />
        <RecommendedCommunities memberId={member.id} />
        <TrendingProjects />
      </section>
    </div>
  );
}
