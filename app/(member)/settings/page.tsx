import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BlockedAccounts } from "@/components/safety/BlockedAccounts";
import { MutedAccounts } from "@/components/safety/MutedAccounts";
import { HiddenPosts } from "@/components/safety/HiddenPosts";
import { DeleteAccount } from "@/components/settings/DeleteAccount";
import { EmailChange } from "@/components/settings/EmailChange";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember } from "@/lib/auth/session";
import { changePassword, signOutOtherSessions } from "@/lib/auth/actions";
import { saveCommentsOpen, saveNotifyFollows, saveProfileVisibility } from "@/lib/profile/actions";
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
    ? await supabase.from("profiles").select("notify_follows, visibility, comments_open").eq("id", member.id).maybeSingle()
    : { data: null };

  return (
    <SectionPage title="Settings" lede="The colour scheme stays on this device. Blocked accounts and hidden posts are listed below.">
      <ThemePicker current={theme.id} />
      {member ? <BlockedAccounts userId={member.id} /> : null}
      {member ? <MutedAccounts userId={member.id} /> : null}
      {member ? (
        <form action={saveProfileVisibility}>
          <h2 id="privacy-heading">Privacy</h2>
          <label htmlFor="settings-visibility">Who can see your profile</label>
          <select id="settings-visibility" name="visibility" className="field-select" defaultValue={prefs?.visibility ?? "public"}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <button className="text-button" type="submit">
            Save privacy
          </button>
        </form>
      ) : null}
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
      {member ? (
        <form action={saveCommentsOpen}>
          <h2 id="comments-heading">Comments</h2>
          <label>
            <input id="comments-open" type="checkbox" name="comments" value="1" defaultChecked={prefs?.comments_open !== false} /> Let people comment on my posts
          </label>
          <button className="text-button" type="submit">
            Save comment preference
          </button>
        </form>
      ) : null}
      {member ? <HiddenPosts userId={member.id} /> : null}
      {member?.username ? <DeleteAccount /> : null}
      {member ? <EmailChange email={member.email} /> : null}
      {member ? (
        <p>
          <a href="/account/export">Download account data</a>
        </p>
      ) : null}
      {member ? (
        <form action={changePassword}>
          <h2 id="password-heading">Password</h2>
          <label htmlFor="new-password">New password</label>
          <input id="new-password" name="password" type="password" required minLength={8} autoComplete="new-password" className="repo-search-input" />
          <button className="text-button" type="submit">
            Change password
          </button>
        </form>
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
