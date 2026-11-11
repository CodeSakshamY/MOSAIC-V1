import { expect, test } from "@playwright/test";

test("Discover filters people by age, location, and skill, and projects by type", async ({ page }) => {
  await page.goto("/discover?view=people&age=16_17");
  await expect(page.locator(".person-card")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /dhhd/ })).toBeVisible();

  await page.goto("/discover?view=people&place=Bengaluru");
  await expect(page.locator(".person-card").filter({ hasText: "dhhd" })).toHaveCount(0);
  await expect(page.locator(".person-card").first()).toBeVisible();

  await page.goto("/discover?view=people&place=Mumbai");
  await expect(page.getByText("No people match that filter.")).toBeVisible();

  await page.goto("/discover?view=people&skill=python");
  await expect(page.getByText("No people match that filter.")).toBeVisible();

  await page.goto("/discover?view=people");
  await expect(page.getByLabel("Age band")).toBeHidden();
  await page.locator(".filter-menu summary").click();
  await expect(page.getByLabel("Age band")).toBeVisible();
  await page.getByLabel("Age band").selectOption("16–17");
  await page.getByLabel("Location").fill("Bengaluru");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/age=16_17/);
  await expect(page).toHaveURL(/place=Bengaluru/);
  await expect(page.getByText("No people match that filter.")).toBeVisible();

  await page.goto("/discover?view=projects&type=Software");
  await expect(page.getByRole("link", { name: "Sensor Node" })).toBeVisible();
  await page.locator(".filter-menu summary").click();
  await page.getByRole("link", { name: "Hardware" }).click();
  await expect(page.getByText("No projects match that filter.")).toBeVisible();
});
