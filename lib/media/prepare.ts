import sharp from "sharp";
import { imageContentType, imageKind, type ImageKind } from "@/lib/auth/images";

export async function preparePhoto(bytes: Uint8Array, maxBytes: number, maxEdge: number) {
  let source = bytes;
  let kind = imageKind(source);
  if (!kind) {
    try {
      const converted = await sharp(source, { failOn: "none" }).rotate().jpeg({ quality: 82 }).toBuffer();
      source = new Uint8Array(converted);
      kind = "jpg";
    } catch {
      return null;
    }
  }

  const meta = await sharp(source).metadata();
  const edge = Math.max(meta.width ?? 0, meta.height ?? 0);
  if (source.length <= maxBytes && edge > 0 && edge <= maxEdge) {
    return { bytes: source, extension: kind, contentType: imageContentType(kind) };
  }

  let quality = 82;
  let output = await shrink(source, maxEdge, quality);
  while (output.length > maxBytes && quality > 45) {
    quality -= 8;
    output = await shrink(source, maxEdge, quality);
  }
  if (output.length > maxBytes) {
    output = await shrink(source, Math.min(maxEdge, 1280), 50);
  }
  if (output.length > maxBytes) return null;
  return { bytes: new Uint8Array(output), extension: "jpg" as ImageKind, contentType: "image/jpeg" };
}

function shrink(source: Uint8Array, maxEdge: number, quality: number) {
  return sharp(source, { failOn: "none" })
    .rotate()
    .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();
}
