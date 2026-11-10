import {
  Award,
  Bell,
  Compass,
  Hammer,
  House,
  CircleUser,
  Shapes,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  mobile: boolean;
};

export const primaryNav: NavItem[] = [
  { href: "/", label: "Home", icon: House, mobile: true },
  { href: "/discover", label: "Discover", icon: Compass, mobile: true },
  { href: "/build", label: "Build", icon: Hammer, mobile: true },
  { href: "/people", label: "People", icon: Users, mobile: true },
  { href: "/opportunities", label: "Opportunities", icon: Award, mobile: false },
  { href: "/communities", label: "Communities", icon: Shapes, mobile: false },
  { href: "/profile", label: "Profile", icon: CircleUser, mobile: true },
];

export const notificationNav = {
  href: "/notifications",
  label: "Notifications",
  icon: Bell,
} as const;

export function isCurrentPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
