import { expect, test } from "@playwright/test";

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

test("follow and unfollow a builder from Discover and their profile", async ({ page }) => {
  test.setTimeout(90_000);
  const stamp = Date.now().toString(36);
  const email = `follow.${stamp}@example.com`;
  const password = "Local-test-1!";
  const displayName = `Zed ${stamp}`;

  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.goto(await confirmationLink(email));

  await page.getByLabel("Username").fill(`zed${stamp}`);
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

  await page.goto("/discover?view=people");
  const card = page.locator(".person-card").filter({ has: page.getByRole("button", { name: "Follow" }) }).first();
  const profilePath = await card.getByRole("link").getAttribute("href");
  expect(profilePath).toMatch(/^\/people\//);
  await card.getByRole("button", { name: "Follow" }).click();
  await expect(card.getByRole("button", { name: "Following" })).toHaveAttribute("aria-pressed", "true");

  await page.goto(profilePath!);
  await expect(page.getByRole("button", { name: "Following" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: displayName })).toBeVisible();
  const followers = page.locator(".follow-row strong").first();
  const followedCount = Number(await followers.textContent());
  expect(followedCount).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Following" }).click();
  await expect(page.getByRole("button", { name: "Follow" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".follow-row strong").first()).toHaveText(String(followedCount - 1));
  await expect(page.getByRole("link", { name: displayName })).toHaveCount(0);
});
