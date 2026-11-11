"use server";

import { redirect } from "next/navigation";
import { getMember, memberGate } from "@/lib/auth/session";
import { photoLimits, storeUserFile } from "@/lib/media/store";
import { createClient } from "@/lib/supabase/server";

export async function createReel(_state: { error?: string } | null, formData: FormData) {
  const member = await getMember();
  if (!member) redirect("/profile?next=/discover?view=reels");
  const gate = memberGate(member);
  if (gate) redirect(gate);

  const file = formData.get("media");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo or a short video." };
  }
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 160);
  const supabase = await createClient();
  const stored = await storeUserFile(supabase, member.id, file, {
    bucket: "post-media",
    ...photoLimits.post,
    allowVideo: true,
    required: true,
  });
  if (!stored.ok || !stored.url) {
    return { error: stored.ok ? "Choose a photo or a short video." : stored.error };
  }
  const title = caption || (stored.url.match(/\.(mp4|webm)$/i) ? "Reel" : "Photo");
  const url = stored.url;
  const { error } = await supabase.from("posts").insert({
    author_id: member.id,
    type: "idea",
    title,
    content: caption || title,
    media_urls: [url],
    visibility: "public",
    is_demo: false,
  });
  if (error) return { error: "The post was not saved." };
  redirect("/discover?view=reels");
}
