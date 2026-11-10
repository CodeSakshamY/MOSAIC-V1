import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getMember } from "@/lib/auth/session";
import { brand } from "@/lib/brand";

export const instant = false;

export const metadata: Metadata = {
  title: {
    absolute: `Home · ${brand.name}`,
  },
};

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeFeed />
    </Suspense>
  );
}

async function HomeFeed() {
  const member = await getMember();
  return (
    <div className="home-layout">
      <section aria-label="Feed">
        <header className="page-header">
          <h1>Home</h1>
          <p className="lede">
            Projects, build logs, and opportunities from builders will appear
            here.
          </p>
        </header>
        <div className="empty-feed">
          {member?.onboardingComplete ? (
            <>
              <h2>Your feed is empty</h2>
              <p>
                Discover is where you look through projects, people, and
                opportunities. Start a project from Build, and it will show up
                in this column once it is public.
              </p>
              <p>
                <Link href="/build">Build</Link>
                {" · "}
                <Link href="/discover">Discover</Link>
                {" · "}
                <Link href="/people">People</Link>
                {" · "}
                <Link href="/opportunities">Opportunities</Link>
              </p>
            </>
          ) : (
            <>
              <h2>Nothing published yet</h2>
              <p>
                When builders publish projects and progress, this column is
                where they show up. Reading it does not need an account.
                Accounts are for people aged 13 and older.
              </p>
            </>
          )}
        </div>
      </section>
      <aside className="rail" aria-label="Related">
        <section>
          <h2>Projects</h2>
          <p>No public projects yet.</p>
        </section>
        <section>
          <h2>People</h2>
          <p>No builders to show yet.</p>
        </section>
        <section>
          <h2>Opportunities</h2>
          <p>No opportunities yet.</p>
        </section>
      </aside>
    </div>
  );
}
