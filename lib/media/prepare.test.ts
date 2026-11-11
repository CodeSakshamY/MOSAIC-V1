import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { preparePhoto } from "./prepare";

describe("preparePhoto", () => {
  it("shrinks a large photo under the safe size", async () => {
    const source = await sharp({
      create: { width: 3200, height: 2400, channels: 3, background: { r: 180, g: 40, b: 40 } },
    })
      .jpeg()
      .toBuffer();
    const fitted = await preparePhoto(new Uint8Array(source), 120_000, 800);
    expect(fitted?.extension).toBe("jpg");
    expect(fitted && fitted.bytes.length <= 120_000).toBe(true);
    const meta = await sharp(fitted?.bytes).metadata();
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(800);
  });
});
