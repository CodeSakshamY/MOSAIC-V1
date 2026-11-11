import { Suspense } from "react";
import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NotificationLink } from "@/components/navigation/NotificationLink";
import { notificationNav } from "@/lib/navigation";

export function TopBar() {
  return (
    <header className="topbar">
      <Logo />
      <span className="topbar-actions">
        <Link href="/settings" className="sidebar-meta" aria-label="Settings">
          <Settings aria-hidden="true" size={18} strokeWidth={1.5} />
        </Link>
        <Suspense
          fallback={
            <Link href={notificationNav.href} className="sidebar-meta" aria-label={notificationNav.label}>
              <Bell aria-hidden="true" size={18} strokeWidth={1.5} />
            </Link>
          }
        >
          <NotificationLink compact />
        </Suspense>
      </span>
    </header>
  );
}
