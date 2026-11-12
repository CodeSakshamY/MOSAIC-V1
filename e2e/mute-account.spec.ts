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

test("muting a person hides their post from your feed", async ({ page, browser }) => {
  test.setTimeout(180_000);
  const stamp = Date.now().toString(36);
  const title = `Quiet ${stamp}`;
  const author = `aut${stamp}`;
  await onboard(page, author, `Aut ${stamp}`, `aut.${stamp}@example.com`);
  await page.goto("/discover?view=posts");
  await page.locator("#feed-post-title").fill(title);
  await page.locator("#feed-post-body").fill("A post that can be muted.");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("link", { name: title })).toBeVisible();
  const other = await browser.newContext();
  const page2 = await other.newPage();
  await onboard(page2, `mut${stamp}`, `Mut ${stamp}`, `mut.${stamp}@example.com`);
  await page2.goto(`/people/${author}`);
  await page2.getByRole("button", { name: "Mute" }).click();
  await expect(page2.getByRole("button", { name: "Unmute" })).toBeVisible();
  await page2.goto("/discover?view=posts");
  await expect(page2.getByRole("link", { name: title })).toHaveCount(0);
  await page2.goto("/settings");
  await page2.locator("[aria-labelledby='muted-heading']").getByRole("button", { name: "Unmute" }).click();
  await expect(page2.getByText("You have not muted anyone.")).toBeVisible();
  await page2.goto("/discover?view=posts");
  await expect(page2.getByRole("link", { name: title })).toBeVisible();
  await other.close();
});
