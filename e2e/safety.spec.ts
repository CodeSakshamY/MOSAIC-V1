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

test("block hides a person, and a project can be reported", async ({ browser }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString(36);
  const recipient = await browser.newContext();
  const actor = await browser.newContext();
  const nora = await recipient.newPage();
  const ned = await actor.newPage();
  await onboard(nora, `nora${stamp}`, `Nora ${stamp}`, `nora.${stamp}@example.com`);
  await onboard(ned, `ned${stamp}`, `Ned ${stamp}`, `ned.${stamp}@example.com`);

  await nora.goto(`/people/ned${stamp}`);
  await nora.getByRole("button", { name: "Block" }).click();
  await expect(nora.getByRole("button", { name: "Unblock" })).toBeVisible();

  await nora.goto(`/discover?view=people&q=ned${stamp}`);
  await expect(nora.getByText("No people match that search.")).toBeVisible();

  await nora.goto("/settings");
  await expect(nora.getByRole("link", { name: `Ned ${stamp}` })).toBeVisible();
  await nora.getByRole("button", { name: "Unblock" }).click();
  await expect(nora.getByText("You have not blocked anyone.")).toBeVisible();

  await nora.goto(`/people/ned${stamp}`);
  await nora.locator(".report-block summary").click();
  await nora.getByLabel("Reason").selectOption("spam");
  await nora.getByRole("button", { name: "Send report" }).click();
  await expect(nora.getByText("Report sent.")).toBeVisible();

  await nora.goto("/forge/sensor-node");
  await nora.locator(".report-block summary").click();
  await nora.getByLabel("Reason").selectOption("spam");
  await nora.getByRole("button", { name: "Send report" }).click();
  await expect(nora.getByText("Report sent.")).toBeVisible();
});
