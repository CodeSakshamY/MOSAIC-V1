import { execFileSync } from "node:child_process";
import { expect, type Page, test } from "@playwright/test";

function sql(statement: string) {
  execFileSync(
    "docker",
    ["exec", "supabase_db_cursor_saksham", "psql", "-U", "postgres", "-d", "postgres", "-c", statement],
    { stdio: "pipe" },
  );
}

test.beforeAll(() => {
  sql(`
    insert into posts (author_id, type, title, content, created_at)
    select id, 'idea', 'Scroll filler ' || lpad(n::text, 2, '0'), 'Older sample for the next page.',
      now() - ((n + 48) || ' hours')::interval
    from profiles, generate_series(1, 12) as n
    where username = 'stock'
      and not exists (select 1 from posts where title = 'Scroll filler ' || lpad(n::text, 2, '0'));
  `);
});

test.afterAll(() => {
  sql(`delete from posts where title like 'Scroll filler %';`);
  sql(`
    delete from notifications where recipient_id in (select id from profiles where username like 'scr%')
      or actor_id in (select id from profiles where username like 'scr%');
    delete from follows where follower_id in (select id from profiles where username like 'scr%');
  `);
});

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

test("the following tab loads the next page", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString(36);
  await onboard(page, `scr${stamp}`, `Scr ${stamp}`, `scr.${stamp}@example.com`);
  await page.goto("/people/stock");
  await page.getByRole("button", { name: "Follow", exact: true }).click();
  await expect(page.getByRole("button", { name: "Following", exact: true })).toBeVisible();
  const response = await page.goto("/?tab=following");
  const html = await response?.text();
  expect(html).toContain("Leave a vent in the lid");
  expect(html).not.toContain("Scroll filler 12");
  const more = page.getByRole("button", { name: "Load more" });
  await expect(more).toBeVisible();
  await expect(async () => {
    if ((await more.count()) > 0) await more.click();
    await expect(page.getByRole("link", { name: "Scroll filler 12" })).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 15_000 });
});
