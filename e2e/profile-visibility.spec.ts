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

test("a builder can hide a profile from other people", async ({ page, browser }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString(36);
  const username = `prv${stamp}`;
  const name = `Priv ${stamp}`;
  const secret = `Secret lab note ${stamp}`;
  await onboard(page, username, name, `prv.${stamp}@example.com`);
  await page.goto("/profile");
  await page.locator("#edit-bio").fill(secret);
  await page.getByRole("button", { name: "Save profile" }).click();
  const bio = page.locator("section", { has: page.locator("#about-heading") });
  await expect(bio).toContainText(secret);
  await page.locator("#profile-visibility").selectOption("Private");
  await page.getByRole("button", { name: "Save visibility" }).click();
  await expect(page.locator("section", { has: page.locator("#about-heading") })).toContainText(secret);

  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  await guest.goto(`/people/${username}`);
  await expect(guest.getByRole("heading", { name })).toBeVisible();
  await expect(guest.getByText("This profile is private.")).toBeVisible();
  await expect(guest.getByText(secret)).toHaveCount(0);
  await guest.goto(`/discover?view=people&q=${encodeURIComponent(username)}`);
  await expect(guest.getByRole("link", { name })).toHaveCount(0);

  await page.locator("#profile-visibility").selectOption("Public");
  const saved = page.waitForResponse((response) => response.request().method() === "POST");
  await page.getByRole("button", { name: "Save visibility" }).click();
  await saved;
  await page.reload();
  await expect(page.locator("#profile-visibility")).toHaveValue("public");
  await guest.goto(`/people/${username}`);
  await expect(guest.getByText(secret)).toBeVisible();
  await guestContext.close();
});
