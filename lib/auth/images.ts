export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

export type ImageKind = "jpg" | "png" | "webp";

export function imageKind(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

export function imageContentType(kind: ImageKind) {
  if (kind === "jpg") return "image/jpeg";
  if (kind === "png") return "image/png";
  return "image/webp";
}

const MAX_REEL_BYTES = 32 * 1024 * 1024;

export function videoKind(bytes: Uint8Array) {
  if (bytes.length > MAX_REEL_BYTES) return null;
  if (bytes.length >= 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    return "mp4" as const;
  }
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return "webm" as const;
  }
  return null;
}

export function reelMedia(bytes: Uint8Array): { extension: string; contentType: string } | null {
  const image = imageKind(bytes);
  if (image) return { extension: image, contentType: imageContentType(image) };
  const video = videoKind(bytes);
  if (video === "mp4") return { extension: "mp4", contentType: "video/mp4" };
  if (video === "webm") return { extension: "webm", contentType: "video/webm" };
  return null;
}

export function isVideoUrl(url: string) {
  return /\.(mp4|webm)(\?|$)/i.test(url);
}
