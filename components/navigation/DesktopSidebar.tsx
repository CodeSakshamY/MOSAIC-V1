import { Suspense } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { AccountPanel } from "@/components/navigation/AccountPanel";
import { NavLinks } from "@/components/navigation/NavLinks";
import { notificationNav } from "@/lib/navigation";

export function DesktopSidebar() {
  return (
    <div className="sidebar">
      <Logo />
      <nav aria-label="Primary">
        <NavLinks placement="sidebar" />
      </nav>
      <div className="sidebar-foot">
        <Link href={notificationNav.href} className="nav-link">
          <Bell aria-hidden="true" size={18} strokeWidth={1.5} />
          <span className="nav-label min-[760px]:max-[1099px]:sr-only">
            {notificationNav.label}
          </span>
        </Link>
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
