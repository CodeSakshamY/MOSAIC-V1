import Link from "next/link";
import { Bell } from "lucide-react";
import { getMember } from "@/lib/auth/session";
import { notificationNav } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";

export async function NotificationLink({ compact = false }: { compact?: boolean }) {
  const member = await getMember();
  let unread = 0;
  if (member && !member.deletedAt && !member.suspended && member.onboardingComplete) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", member.id)
      .is("read_at", null);
    unread = count ?? 0;
  }
  const label = unread > 0 ? `${notificationNav.label}, ${unread} unread` : notificationNav.label;
  return (
    <Link href={notificationNav.href} className={compact ? "sidebar-meta notify-link" : "nav-link"} aria-label={label}>
      <Bell aria-hidden="true" size={18} strokeWidth={1.5} />
      {compact ? null : (
        <span className="nav-label min-[760px]:max-[1099px]:sr-only">{notificationNav.label}</span>
      )}
      {unread > 0 ? <span className="nav-count">{unread > 9 ? "9+" : unread}</span> : null}
    </Link>
  );
}
