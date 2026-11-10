import type { Metadata } from "next";
import { SectionPage } from "@/components/shell/SectionPage";

export const instant = false;

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <SectionPage
      title="Settings"
      lede="Sign out is in the sidebar. Profile editing arrives with profiles. Accounts are for people aged 13 and older. Age is stored as a band, never as a date of birth."
    />
  );
}
