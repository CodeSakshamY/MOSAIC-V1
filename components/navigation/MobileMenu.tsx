"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings, X, Bell } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { isCurrentPath, notificationNav, primaryNav } from "@/lib/navigation";

export function MobileMenu({
  signedIn,
  displayName,
  unread,
}: {
  signedIn: boolean;
  displayName: string | null;
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const titleId = useId();
  const notice = unread > 0 ? `${notificationNav.label}, ${unread} unread` : notificationNav.label;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        className="menu-button"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
      >
        <Menu aria-hidden="true" size={22} strokeWidth={1.5} />
        <span className="sr-only">Show more</span>
      </button>
      <div className="mobile-drawer" data-open={open ? "true" : "false"} hidden={!open}>
        <button className="mobile-drawer-backdrop" type="button" aria-label="Close menu" onClick={() => setOpen(false)} />
        <div className="mobile-drawer-panel" id="mobile-menu" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className="mobile-drawer-head">
            <p id={titleId}>Menu</p>
            <button className="menu-button" type="button" onClick={() => setOpen(false)}>
              <X aria-hidden="true" size={22} strokeWidth={1.5} />
              <span className="sr-only">Close</span>
            </button>
          </div>
          {signedIn && displayName ? <p className="sidebar-note">{displayName}</p> : null}
          <nav aria-label="All sections">
            <ul className="nav-list" role="list">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                const current = isCurrentPath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link href={item.href} className="nav-link" aria-current={current ? "page" : undefined}>
                      <Icon aria-hidden="true" size={18} strokeWidth={1.5} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
              <li>
        <Link href={notificationNav.href} className="nav-link" aria-label={notice}>
          <Bell aria-hidden="true" size={18} strokeWidth={1.5} />
                  <span>{notificationNav.label}</span>
                  {unread > 0 ? <span className="nav-count">{unread > 9 ? "9+" : unread}</span> : null}
                </Link>
              </li>
              <li>
                <Link href="/settings" className="nav-link">
                  <Settings aria-hidden="true" size={18} strokeWidth={1.5} />
                  <span>Settings</span>
                </Link>
              </li>
            </ul>
          </nav>
          {signedIn ? (
            <form action={signOut}>
              <button className="nav-link account-button" type="submit">
                Sign out
              </button>
            </form>
          ) : (
            <Link href="/profile" className="nav-link">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
