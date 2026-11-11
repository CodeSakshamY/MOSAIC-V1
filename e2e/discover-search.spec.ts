import { expect, test } from "@playwright/test";

test("search people by username and projects by name", async ({ page }) => {
  await page.goto("/discover?view=people");
  await page.getByLabel("Search").fill("djhjhd");
  await page.getByLabel("Search").press("Enter");
  await expect(page).toHaveURL(/q=djhjhd/);
  await expect(page.locator(".person-card")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /dhhd/ })).toBeVisible();

  await page.goto("/discover?view=people&q=zzzz-nope");
  await expect(page.getByText("No people match that search.")).toBeVisible();

  await page.goto("/discover?view=projects");
  await page.getByLabel("Search").fill("Sensor");
  await page.getByLabel("Search").press("Enter");
  await expect(page.getByRole("link", { name: "Sensor Node" })).toBeVisible();

  await page.goto("/discover?view=projects&q=zzzz-nope");
  await expect(page.getByText("No projects match that search.")).toBeVisible();
});
