"use server";

import { redirect } from "next/navigation";
import { reelMedia } from "@/lib/auth/images";
import { getMember, memberGate } from "@/lib/auth/session";
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
  const bytes = new Uint8Array(await file.arrayBuffer());
  const media = reelMedia(bytes);
  if (!media) {
    return { error: "Use a JPEG, PNG, or WebP photo under 5 MB, or an MP4 or WebM video under 32 MB." };
  }

  const caption = String(formData.get("caption") ?? "").trim().slice(0, 160);
  const title = caption || (media.contentType.startsWith("video/") ? "Reel" : "Photo");
  const supabase = await createClient();
  const path = `${member.id}/${crypto.randomUUID()}.${media.extension}`;
  const { error: uploadError } = await supabase.storage.from("post-media").upload(path, bytes, {
    contentType: media.contentType,
    upsert: false,
  });
  if (uploadError) return { error: "The file was not uploaded." };

  const url = supabase.storage.from("post-media").getPublicUrl(path).data.publicUrl;
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
