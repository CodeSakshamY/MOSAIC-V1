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

test("an owner can add and remove project milestones", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString(36);
  await onboard(page, `mile${stamp}`, `Mile ${stamp}`, `mile.${stamp}@example.com`);
  await page.goto("/forge");
  await page.getByLabel("Project name").fill(`Mile ${stamp}`);
  await page.getByLabel("Description").fill("A project created to check its milestones.");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/forge\/mile-/);
  await expect(page.getByRole("heading", { name: "Milestones" })).toBeVisible();
  await expect(page.locator(".project-milestones li")).toHaveCount(0);
  await page.locator("#milestone-title").fill("First review");
  await page.locator("#milestone-day").fill("2026-12-01");
  await page.getByRole("button", { name: "Add milestone" }).click();
  await expect(page.locator(".project-milestones li")).toHaveCount(1);
  await page.locator("#milestone-title").fill("Kickoff");
  await page.locator("#milestone-day").fill("2026-11-01");
  await page.getByRole("button", { name: "Add milestone" }).click();
  const items = page.locator(".project-milestones li");
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText("1 Nov 2026");
  await expect(items.nth(0)).toContainText("Kickoff");
  await expect(items.nth(1)).toContainText("First review");
  await page.getByRole("button", { name: "Remove Kickoff" }).click();
  await expect(page.locator(".project-milestones li")).toHaveCount(1);
  await expect(page.locator(".project-milestones")).toContainText("First review");
  await expect(page.locator(".project-milestones")).not.toContainText("Kickoff");
});
