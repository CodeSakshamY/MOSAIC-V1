import { markAllNotificationsRead, markNotificationRead, openNotification } from "@/lib/notifications/actions";
import { createClient } from "@/lib/supabase/server";

type Item = {
  id: string;
  type: string;
  message: string;
  read_at: string | null;
  created_at: string;
  actor_id: string | null;
  post_id: string | null;
  project_id: string | null;
};

export async function NotificationInbox({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, message, read_at, created_at, actor_id, post_id, project_id")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const items = (data ?? []) as Item[];
  const unread = items.filter((item) => !item.read_at).length;

  if (items.length === 0) {
    return <p className="repo-empty">No notifications yet. A follow, comment, or project update will show up here.</p>;
  }

  return (
    <>
      {unread > 0 ? (
        <form action={markAllNotificationsRead}>
          <button className="text-button" type="submit">
            Mark all read
          </button>
        </form>
      ) : null}
      <ul className="notification-list" role="list">
        {items.map((item) => (
          <li key={item.id} className={item.read_at ? "notification-row" : "notification-row is-unread"}>
            <form action={openNotification}>
              <input type="hidden" name="id" value={item.id} />
              <button className="notification-open" type="submit">
                {item.message}
              </button>
            </form>
            <time dateTime={item.created_at}>{when(item.created_at)}</time>
            <form action={markNotificationRead}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="read" value={item.read_at ? "0" : "1"} />
              <button className="text-button" type="submit">
                {item.read_at ? "Mark unread" : "Mark read"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}

function when(value: string) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
