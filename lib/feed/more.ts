"use server";

import { getMember } from "@/lib/auth/session";
import { loadHome, parseCursor, parseHomeTab, type HomeItem } from "@/lib/feed/home";

export async function loadMoreHome(
  tab: string,
  cursor: string,
): Promise<{ items: HomeItem[]; nextCursor: string | null }> {
  const member = await getMember();
  const when = parseCursor(cursor);
  if (!member?.onboardingComplete || member.suspended || member.deletedAt || !when) {
    return { items: [], nextCursor: null };
  }
  const feed = await loadHome(member.id, parseHomeTab(tab), when);
  return { items: feed.items, nextCursor: feed.nextCursor };
}
