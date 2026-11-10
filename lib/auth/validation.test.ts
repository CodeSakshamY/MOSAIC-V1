import { describe, expect, it } from "vitest";
import { parsePassword, parseUsername, safeNext } from "./validation";

describe("username", () => {
  it("accepts a normal username", () => {
    expect(parseUsername("ada_builder")).toEqual({
      ok: true,
      username: "ada_builder",
    });
  });

  it("rejects reserved names and the deleted prefix", () => {
    expect(parseUsername("Admin").ok).toBe(false);
    expect(parseUsername("deleted_abcd1234").ok).toBe(false);
  });
});

describe("password", () => {
  it("requires length, both letter cases, and a special character", () => {
    expect(parsePassword("short").ok).toBe(false);
    expect(parsePassword("longpassword").ok).toBe(false);
    expect(parsePassword("Longpassword").ok).toBe(false);
    expect(parsePassword("LONGPASSWORD!").ok).toBe(false);
    expect(parsePassword("Valid-password")).toEqual({ ok: true, password: "Valid-password" });
  });
});

describe("safe next path", () => {
  it("keeps a local path and drops off-site values", () => {
    expect(safeNext("/settings")).toBe("/settings");
    expect(safeNext("https://example.com")).toBe("/");
    expect(safeNext("//example.com")).toBe("/");
  });
});
