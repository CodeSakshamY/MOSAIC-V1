import type { Metadata } from "next";
import { SectionPage } from "@/components/shell/SectionPage";

export const instant = false;

export const metadata: Metadata = {
  title: "Notifications",
};

export default function NotificationsPage() {
  return (
    <SectionPage
      title="Notifications"
      lede="Follows, comments, and contribution requests will be listed here."
    />
  );
}
