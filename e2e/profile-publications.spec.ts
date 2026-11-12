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

test("a builder can list a publication on their profile", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString(36);
  const username = `pub${stamp}`;
  const title = `Sensors ${stamp}`;
  await onboard(page, username, `Pub ${stamp}`, `pub.${stamp}@example.com`);
  await page.goto("/profile");
  await page.locator("#publication-title").fill(title);
  await page.locator("#publication-venue").fill("Journal of School Hardware");
  await page.locator("#publication-year").fill("2024");
  await page.locator("#publication-url").fill("https://example.com/sensors");
  await page.locator("#publication-summary").fill("A short note on a classroom sensor.");
  await page.getByRole("button", { name: "Add publication" }).click();
  const research = page.locator("section", { has: page.locator("#research-heading") });
  await expect(research.getByRole("link", { name: title })).toHaveAttribute("href", "https://example.com/sensors");
  await expect(research).toContainText("Journal of School Hardware");
  await expect(research).toContainText("2024");
  await page.goto(`/people/${username}`);
  await expect(page.locator("section", { has: page.locator("#research-heading") })).toContainText(title);
  await page.goto("/profile");
  await page.locator("section", { has: page.locator("#research-heading") }).getByRole("button", { name: "Remove" }).click();
  await expect(page.locator("section", { has: page.locator("#research-heading") })).toContainText("No research added yet.");
});
