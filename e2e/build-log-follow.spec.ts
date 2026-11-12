import { expect, type BrowserContext, type Page, test } from "@playwright/test";

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

async function pageFor(context: BrowserContext) {
  return context.newPage();
}

test("following an update notifies the follower about a comment", async ({ browser }) => {
  test.setTimeout(180_000);
  const stamp = Date.now().toString(36);
  const title = `Follow ${stamp}`;
  const ownerName = `Ada ${stamp}`;
  const owner = await pageFor(await browser.newContext());
  const guest = await pageFor(await browser.newContext());

  await onboard(owner, `ada${stamp}`, ownerName, `ada.${stamp}@example.com`);
  await onboard(guest, `gus${stamp}`, `Gus ${stamp}`, `gus.${stamp}@example.com`);

  await owner.goto("/forge");
  await owner.getByLabel("Project name").fill(`Ada ${stamp}`);
  await owner.getByLabel("Description").fill("A project created so someone can follow an update.");
  await owner.getByRole("button", { name: "Create project" }).click();
  await expect(owner).toHaveURL(/\/forge\/ada-/);
  await owner.getByRole("link", { name: "Commits" }).click();
  await owner.locator("#commit-title").fill(title);
  await owner.locator("#commit-body").fill("The lid now closes over the sensor.");
  await owner.getByRole("button", { name: "Commit" }).click();
  await owner.getByRole("link", { name: "Overview" }).click();
  await expect(owner).toHaveURL(/tab=overview/);
  await expect(owner.getByRole("button", { name: "Follow update" })).toBeVisible();
  const projectUrl = owner.url();

  await guest.goto(projectUrl);
  await guest.getByRole("button", { name: "Follow update" }).click();
  await expect(guest.getByRole("button", { name: "Following update" })).toHaveAttribute("aria-pressed", "true");

  const ownerUpdate = owner.locator(".project-updates li", { hasText: title });
  await ownerUpdate.getByLabel("Comment").fill("The joint needs more heat.");
  await ownerUpdate.getByRole("button", { name: "Comment" }).click();
  await expect(ownerUpdate).toContainText("The joint needs more heat.");

  await guest.goto("/notifications");
  await expect(guest.getByRole("button", { name: `${ownerName} commented on an update you follow.` })).toBeVisible();
});
