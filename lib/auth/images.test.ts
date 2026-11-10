import { describe, expect, it } from "vitest";
import { imageKind, reelMedia } from "./images";

describe("image bytes", () => {
  it("recognises jpeg, png, and webp headers", () => {
    expect(imageKind(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))).toBe("jpg");
    expect(imageKind(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toBe("png");
    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46], 0);
    webp.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(imageKind(webp)).toBe("webp");
  });

  it("rejects other files", () => {
    expect(imageKind(Uint8Array.from([0x47, 0x49, 0x46, 0x38]))).toBeNull();
  });
});

describe("reel media", () => {
  it("recognises an mp4 header and a webm header", () => {
    const mp4 = new Uint8Array(16);
    mp4.set([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], 0);
    expect(reelMedia(mp4)?.contentType).toBe("video/mp4");
    expect(reelMedia(Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3]))?.contentType).toBe("video/webm");
  });
});
