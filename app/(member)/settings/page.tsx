import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { SectionPage } from "@/components/shell/SectionPage";
import { themeFromId } from "@/lib/theme/themes";

export const instant = false;

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const saved = (await cookies()).get("mosaic-theme")?.value;
  const theme = themeFromId(saved);

  return (
    <SectionPage title="Settings" lede="The colour scheme stays on this device.">
      <ThemePicker current={theme.id} />
    </SectionPage>
  );
}
