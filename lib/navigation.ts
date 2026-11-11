import type { ComponentType } from "react";
import {
  Award,
  Bell,
  Compass,
  House,
  CircleUser,
  Shapes,
  Users,
} from "lucide-react";
import { ForgeIcon } from "@/components/navigation/ForgeIcon";

type NavIcon = ComponentType<{
  size?: number;
  strokeWidth?: number;
  "aria-hidden"?: boolean | "true";
}>;

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  mobile: boolean;
};

export const primaryNav: NavItem[] = [
  { href: "/", label: "Home", icon: House, mobile: true },
  { href: "/discover", label: "Discover", icon: Compass, mobile: true },
  { href: "/forge", label: "Forge", icon: ForgeIcon, mobile: true },
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
