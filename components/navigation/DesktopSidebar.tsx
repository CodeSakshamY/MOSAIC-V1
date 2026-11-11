import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { AccountPanel } from "@/components/navigation/AccountPanel";
import { NavLinks } from "@/components/navigation/NavLinks";
import { NotificationLink } from "@/components/navigation/NotificationLink";

export function DesktopSidebar() {
  return (
    <div className="sidebar">
      <Logo />
      <nav aria-label="Primary">
        <NavLinks placement="sidebar" />
      </nav>
      <div className="sidebar-foot">
        <Suspense fallback={null}>
          <NotificationLink />
        </Suspense>
        <Suspense fallback={null}>
          <AccountPanel />
        </Suspense>
        {process.env.NODE_ENV === "development" ? (
          <Link href="/dev/ui" className="sidebar-meta max-[1099px]:hidden">
            Components
          </Link>
        ) : null}
      </div>
    </div>
  );
}
