import { execFileSync } from "node:child_process";
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

test("staff can remove a reported post and suspend then restore the author", async ({ page, browser }) => {
  test.setTimeout(180_000);
  const stamp = Date.now().toString(36);
  const title = `Bad ${stamp}`;
  const note = `Queue ${stamp}`;
  const moderator = `mod${stamp}`;
  await onboard(page, `aut${stamp}`, `Aut ${stamp}`, `aut.${stamp}@example.com`);
  await page.goto("/discover?view=posts");
  await page.locator("#feed-post-title").fill(title);
  await page.locator("#feed-post-body").fill("A post that should be removed.");
  await page.getByRole("button", { name: "Publish" }).click();
  await page.getByRole("link", { name: title }).click();
  await expect(page).toHaveURL(/\/posts\//);
  const url = page.url();
  const other = await browser.newContext();
  const page2 = await other.newPage();
  await onboard(page2, moderator, `Mod ${stamp}`, `mod.${stamp}@example.com`);
  await page2.goto("/moderation");
  await expect(page2.getByText("This page is for staff.").first()).toBeVisible();
  await page2.goto(url);
  await page2.getByText("Report", { exact: true }).click();
  await page2.locator("select[name='reason']").selectOption("Spam");
  await page2.locator("textarea[name='note']").fill(note);
  await page2.getByRole("button", { name: "Send report" }).click();
  await expect(page2.getByText("Report sent.")).toBeVisible();
  execFileSync("docker", ["exec", "supabase_db_cursor_saksham", "psql", "-U", "postgres", "-d", "postgres", "-c", `insert into public.admin_roles (user_id, role) select id, 'moderator' from public.profiles where username = '${moderator}'`]);
  await page2.goto("/moderation");
  const row = page2.locator(".repo-row", { hasText: note });
  await row.getByRole("button", { name: "Suspend author" }).click();
  await expect(page2.getByText("No current suspensions.")).toHaveCount(0);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "This account is suspended" })).toBeVisible();
  const restored = page2.waitForResponse((response) => response.request().method() === "POST");
  await page2.locator("[aria-labelledby='sanctions-heading']").getByRole("button", { name: "Restore" }).first().click();
  await restored;
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page2.locator(".repo-row", { hasText: note }).getByRole("button", { name: "Remove" }).click();
  await expect(page2.locator(".repo-row", { hasText: note })).toHaveCount(0);
  await page.goto(url);
  await expect(page.getByText("A post that should be removed.")).toHaveCount(0);
  await other.close();
});
