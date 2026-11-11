"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrentPath, primaryNav } from "@/lib/navigation";

export function NavLinks({ placement }: { placement: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const items =
    placement === "mobile"
      ? primaryNav.filter((item) => item.mobile)
      : primaryNav;

  return (
    <ul className="nav-list" role="list">
      {items.map((item) => {
        const Icon = item.icon;
        const current = isCurrentPath(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className="nav-link"
              aria-current={current ? "page" : undefined}
              data-nav={item.href === "/forge" ? "build" : undefined}
            >
              {placement === "mobile" && item.href === "/forge" ? (
                <span className="mobile-build-icon">
                  <Icon aria-hidden="true" size={18} strokeWidth={1.5} />
                </span>
              ) : (
                <Icon aria-hidden="true" size={18} strokeWidth={1.5} />
              )}
              <span
                className={
                  placement === "sidebar"
                    ? "nav-label min-[760px]:max-[1099px]:sr-only"
                    : undefined
                }
              >
                {item.label}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
