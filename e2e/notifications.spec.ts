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
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Display name").fill(displayName);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByLabel("State").fill("Karnataka");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Age band").selectOption("18_24");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Find teammates").check();
  await page.getByRole("button", { name: "Finish" }).click();
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
}

test("a follow appears in notifications and can be marked read", async ({ browser }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString(36);
  const recipient = await browser.newContext();
  const actor = await browser.newContext();
  const inbox = await recipient.newPage();
  const follower = await actor.newPage();

  await onboard(inbox, `nora${stamp}`, `Nora ${stamp}`, `nora.${stamp}@example.com`);
  await onboard(follower, `ned${stamp}`, `Ned ${stamp}`, `ned.${stamp}@example.com`);

  await follower.goto(`/discover?view=people&q=nora${stamp}`);
  await follower.getByRole("button", { name: "Follow" }).click();
  await expect(follower.getByRole("button", { name: "Following" })).toHaveAttribute("aria-pressed", "true");

  await inbox.goto("/notifications");
  await expect(inbox.getByRole("button", { name: `Ned ${stamp} followed you.` })).toBeVisible();
  await expect(inbox.getByRole("link", { name: /1 unread/ }).first()).toBeVisible();
  await inbox.getByRole("button", { name: `Ned ${stamp} followed you.` }).click();
  await expect(inbox).toHaveURL(new RegExp(`/people/ned${stamp}`));

  await inbox.goto("/notifications");
  await expect(inbox.getByRole("button", { name: "Mark unread" })).toBeVisible();
  await expect(inbox.getByRole("link", { name: /1 unread/ })).toHaveCount(0);
});
