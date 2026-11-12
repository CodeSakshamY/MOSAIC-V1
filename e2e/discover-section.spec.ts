import { expect, test } from "@playwright/test";

test("discover sections live in one menu", async ({ page }) => {
  await page.goto("/discover");
  const section = page.locator("#discover-section");
  await expect(section.locator("option", { hasText: "Experiments" })).toHaveCount(1);
  await expect(section.locator("option", { hasText: "People" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Experiments" })).toHaveCount(0);
  await section.selectOption("events");
  await page.getByRole("button", { name: "Show" }).click();
  await expect(page).toHaveURL(/view=events/);
  await expect(page.locator("#discover-section")).toHaveValue("events");
  await expect(page.locator(".filter-menu")).toHaveCount(0);
  await page.goto("/discover?view=posts");
  await page.locator(".filter-menu summary").click();
  await expect(page.getByRole("link", { name: "All types" })).toBeVisible();
  await page.goto("/discover?view=people");
  await page.locator(".filter-menu summary").click();
  await expect(page.locator("#discover-age")).toBeVisible();
  await expect(page.locator("#discover-section option", { hasText: "Age band" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "All types" })).toHaveCount(0);
});
