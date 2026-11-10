import { describe, expect, it } from "vitest";
import { brand } from "./brand";

describe("brand", () => {
  it("keeps the product name in one place", () => {
    expect(brand.name).toBe("Polymath");
  });

  it("reserves route and staff names", () => {
    expect(brand.reservedUsernames).toContain("polymath");
    expect(brand.reservedUsernames).toContain("admin");
    expect(brand.reservedUsernames).toContain("settings");
  });
});
