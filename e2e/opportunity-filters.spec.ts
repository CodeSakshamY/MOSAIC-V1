import { expect, type Page, test } from "@playwright/test";

async function confirmationLink(email: string) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const list = (await fetch("http://127.0.0.1:54324/api/v1/messages").then((response) =>
      response.json(),
    )) as { messages?: { ID: string; To: { Address: string }[] }[] };
    const hit = list.messages?.find((message) =>
      message.To.some((person) => person.Address === email),
    );
    if (hit) {
      const detail = (await fetch(`http://127.0.0.1:54324/api/v1/message/${hit.ID}`).then(
        (response) => response.json(),
      )) as { HTML?: string; Text?: string };
      const raw = `${detail.HTML ?? ""}\n${detail.Text ?? ""}`.replaceAll("&amp;", "&");
      const link = [...raw.matchAll(/https?:\/\/[^\s"'<>]+/g)]
        .map((match) => match[0])
        .find((item) => item.includes("/auth/v1/verify") || item.includes("/auth/callback"));
      if (link) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error("The confirmation email did not arrive.");
}

async function onboard(page: Page, username: string, displayName: string, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Local-test-1!");
  await page.getByLabel("Confirm password").fill("Local-test-1!");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.goto(await confirmationLink(email));
  await expect(page.getByText("Step 1 of 9")).toBeVisible();
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Display name").fill(displayName);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Step 2 of 9")).toBeVisible();
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByText("Step 3 of 9")).toBeVisible();
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByLabel("State").fill("Karnataka");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Step 4 of 9")).toBeVisible();
  await page.getByLabel("Age band").selectOption("18_24");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Step 5 of 9")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Step 6 of 9")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Step 7 of 9")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Step 8 of 9")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Step 9 of 9")).toBeVisible();
  await page.getByLabel("Find teammates").check();
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
}

test("opportunity filters use the eligibility, discipline, country, and region that were entered", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString(36);
  const title = `Filter ${stamp}`;
  await onboard(page, `fil${stamp}`, `Fil ${stamp}`, `fil.${stamp}@example.com`);
  await page.goto("/opportunities");
  await page.locator("#opportunity-title").fill(title);
  await page.locator("#opportunity-organizer").fill("City science office");
  await page.locator("#opportunity-category").selectOption("Mentorship");
  await page.locator("#opportunity-country").fill("IN");
  await page.locator("#opportunity-region").fill("Karnataka");
  await page.locator("#opportunity-eligibility").fill("Students in Karnataka");
  await page.locator("#opportunity-url").fill("https://example.com/mentor");
  await page.locator("#opportunity-description").fill("Apply through the official page.");
  await page.getByRole("button", { name: "Announce", exact: true }).click();
  await expect(page.locator(".repo-row", { hasText: title })).toContainText("IN · Karnataka");

  await page.locator("#filter-discipline").selectOption("Mentorship");
  await page.locator("#filter-country").fill("IN");
  await page.locator("#filter-region").fill("Karnataka");
  await page.locator("#filter-eligibility").fill("Students");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/country=IN/);
  await expect(page.getByText(title)).toBeVisible();

  await page.locator("#filter-country").fill("US");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/country=US/);
  await expect(page.getByText(title)).toHaveCount(0);
});
