import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { videoKind } from "@/lib/auth/images";
import { preparePhoto } from "@/lib/media/prepare";
import type { Database } from "@/types/database";

const MAX_VIDEO_BYTES = 32 * 1024 * 1024;

export const photoLimits = {
  avatar: { maxBytes: 1_500_000, maxEdge: 1024 },
  banner: { maxBytes: 4_500_000, maxEdge: 1920 },
  cover: { maxBytes: 4_500_000, maxEdge: 1920 },
  post: { maxBytes: 4_500_000, maxEdge: 1920 },
} as const;

type Bucket = "avatars" | "post-media" | "project-covers";

export async function storeUserFile(
  supabase: SupabaseClient<Database>,
  userId: string,
  value: FormDataEntryValue | null,
  options: {
    bucket: Bucket;
    maxBytes: number;
    maxEdge: number;
    allowVideo?: boolean;
    required?: boolean;
  },
) {
  if (!(value instanceof File) || value.size === 0) {
    return options.required
      ? { ok: false as const, error: "Choose a photo." }
      : { ok: true as const, url: null };
  }

  const bytes = new Uint8Array(await value.arrayBuffer());
  const video = options.allowVideo ? videoKind(bytes) : null;
  if (video) {
    if (bytes.length > MAX_VIDEO_BYTES) return { ok: false as const, error: "Use a video under 32 MB." };
    return upload(supabase, userId, options.bucket, bytes, video, video === "mp4" ? "video/mp4" : "video/webm");
  }

  const photo = await preparePhoto(bytes, options.maxBytes, options.maxEdge);
  if (!photo) return { ok: false as const, error: "Use a JPEG, PNG, or WebP photo." };
  return upload(supabase, userId, options.bucket, photo.bytes, photo.extension, photo.contentType);
}

async function upload(
  supabase: SupabaseClient<Database>,
  userId: string,
  bucket: Bucket,
  bytes: Uint8Array,
  extension: string,
  contentType: string,
) {
  const path = `${userId}/${crypto.randomUUID()}.${extension === "jpg" ? "jpg" : extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType, upsert: false });
  if (error) return { ok: false as const, error: "The file was not uploaded." };
  return { ok: true as const, url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl };
}
