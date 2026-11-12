import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BlockedAccounts } from "@/components/safety/BlockedAccounts";
import { MutedAccounts } from "@/components/safety/MutedAccounts";
import { HiddenPosts } from "@/components/safety/HiddenPosts";
import { DeleteAccount } from "@/components/settings/DeleteAccount";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember } from "@/lib/auth/session";
import { signOutOtherSessions } from "@/lib/auth/actions";
import { themeFromId } from "@/lib/theme/themes";

export const instant = false;

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ sessions?: string }>;
}) {
  const saved = (await cookies()).get("mosaic-theme")?.value;
  const theme = themeFromId(saved);
  const member = await getMember();
  const params = await searchParams;

  return (
    <SectionPage title="Settings" lede="The colour scheme stays on this device. Blocked accounts and hidden posts are listed below.">
      <ThemePicker current={theme.id} />
      {member ? <BlockedAccounts userId={member.id} /> : null}
      {member ? <MutedAccounts userId={member.id} /> : null}
      {member ? <HiddenPosts userId={member.id} /> : null}
      {member?.username ? <DeleteAccount /> : null}
      {member ? (
        <p>
          <a href="/account/export">Download account data</a>
        </p>
      ) : null}
      {member ? (
        <form action={signOutOtherSessions}>
          <h2 id="sessions-heading">Sessions</h2>
          <p className="form-note">This browser stays signed in. Every other session for this account is signed out.</p>
          {params.sessions === "closed" ? <p>Other sessions were signed out.</p> : null}
          <button className="text-button" type="submit">
            Sign out other sessions
          </button>
        </form>
      ) : null}
    </SectionPage>
  );
}
