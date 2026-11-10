const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function imageKind(bytes: Uint8Array): "jpg" | "png" | "webp" | null {
  if (bytes.length > MAX_AVATAR_BYTES) return null;
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

export function imageContentType(kind: "jpg" | "png" | "webp") {
  if (kind === "jpg") return "image/jpeg";
  if (kind === "png") return "image/png";
  return "image/webp";
}
