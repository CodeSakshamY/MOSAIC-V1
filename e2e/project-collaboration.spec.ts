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

test("a builder can request to contribute and the owner can accept", async ({ browser }) => {
  test.setTimeout(180_000);
  const stamp = Date.now().toString(36);
  const ownerName = `Own ${stamp}`;
  const guestName = `Ask ${stamp}`;
  const ownerContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  const guest = await guestContext.newPage();
  await onboard(owner, `own${stamp}`, ownerName, `own.${stamp}@example.com`);
  await owner.goto("/forge");
  await owner.getByLabel("Project name").fill(`Collab ${stamp}`);
  await owner.getByLabel("Description").fill("A project created to check collaboration requests.");
  await owner.getByRole("button", { name: "Create project" }).click();
  await expect(owner).toHaveURL(/\/forge\/collab-/);
  const projectUrl = owner.url();
  await onboard(guest, `ask${stamp}`, guestName, `ask.${stamp}@example.com`);
  await guest.goto(projectUrl);
  await guest.locator("#contribution-message").fill("I can test the enclosure.");
  await guest.locator("#contribution-proposal").fill("I will run the fit check.");
  await guest.getByRole("button", { name: "Send request" }).click();
  await expect(guest.locator(".project-requests")).toContainText("Request sent.");
  await owner.reload();
  await owner.getByRole("button", { name: `Accept ${guestName}` }).click();
  await expect(owner.locator(".project-team")).toContainText(guestName);
  await expect(owner.locator(".project-team")).toContainText("Contributor");
  await guest.reload();
  await expect(guest.locator(".project-team")).toContainText(guestName);
  await expect(guest.getByLabel("Message")).toHaveCount(0);
  await ownerContext.close();
  await guestContext.close();
});
