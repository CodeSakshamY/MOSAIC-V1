import type { Metadata } from "next";
import { NotificationInbox } from "@/components/notifications/NotificationInbox";
import { SectionPage } from "@/components/shell/SectionPage";
import { getMember } from "@/lib/auth/session";

export const instant = false;

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const member = await getMember();
  return (
    <SectionPage
      title="Notifications"
      lede="Follows, comments, replies, and project updates are listed here."
    >
      {member ? <NotificationInbox userId={member.id} /> : null}
    </SectionPage>
  );
}
