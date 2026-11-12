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
import { saveNotifyFollows } from "@/lib/profile/actions";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const { data: prefs } = member
    ? await supabase.from("profiles").select("notify_follows").eq("id", member.id).maybeSingle()
    : { data: null };

  return (
    <SectionPage title="Settings" lede="The colour scheme stays on this device. Blocked accounts and hidden posts are listed below.">
      <ThemePicker current={theme.id} />
      {member ? <BlockedAccounts userId={member.id} /> : null}
      {member ? <MutedAccounts userId={member.id} /> : null}
      {member ? (
        <form action={saveNotifyFollows}>
          <h2 id="notifications-heading">Notifications</h2>
          <label>
            <input id="notify-follows" type="checkbox" name="notify" value="1" defaultChecked={prefs?.notify_follows !== false} /> Tell me when someone follows me
          </label>
          <button className="text-button" type="submit">
            Save notification preference
          </button>
        </form>
      ) : null}
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
