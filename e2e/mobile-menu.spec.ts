import { expect, test } from "@playwright/test";

test("the phone menu lists the sections missing from the bottom bar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/discover");
  await expect(page.locator(".mobile-nav").getByRole("link", { name: "Opportunities" })).toHaveCount(0);
  await page.getByRole("button", { name: "Show more" }).click();
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(menu.getByRole("link", { name: "Opportunities" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Communities" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Notifications" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Sign in" })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.getByRole("button", { name: "Show more" })).toBeHidden();
});
