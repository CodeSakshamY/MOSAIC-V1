import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BlockedAccounts } from "@/components/safety/BlockedAccounts";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember } from "@/lib/auth/session";
import { themeFromId } from "@/lib/theme/themes";

export const instant = false;

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const saved = (await cookies()).get("mosaic-theme")?.value;
  const theme = themeFromId(saved);
  const member = await getMember();

  return (
    <SectionPage title="Settings" lede="The colour scheme stays on this device. Blocked accounts are listed below.">
      <ThemePicker current={theme.id} />
      {member ? <BlockedAccounts userId={member.id} /> : null}
    </SectionPage>
  );
}
