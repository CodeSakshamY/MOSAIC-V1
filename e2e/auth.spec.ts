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

test("signup, confirm, onboard, then a signed-out settings visit reaches login", async ({
  page,
}) => {
  const stamp = Date.now().toString(36);
  const email = `ada.${stamp}@example.com`;
  const password = "Local-test-1!";

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Nothing published yet" })).toBeVisible();
  await page.goto("/discover");
  await expect(page.getByRole("heading", { name: "What builders are making" })).toBeVisible();
  await page.goto("/signup");
  await expect(page.getByText("one special character")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("confirmation link");

  await page.goto(await confirmationLink(email));
  await expect(page.getByRole("heading", { name: "What should we call you?" })).toBeVisible();

  await page.getByLabel("Username").fill(`ada${stamp}`);
  await page.getByLabel("Display name").fill("Ada Builder");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Add a picture" })).toBeVisible();
  await page.getByRole("button", { name: "Skip" }).click();

  await expect(page.getByRole("heading", { name: "Where are you building?" })).toBeVisible();
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByLabel("State").fill("Karnataka");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "How old are you?" })).toBeVisible();
  await page.getByLabel("Age band").selectOption("18_24");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Education" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "What skills do you use?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "What are you into?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Links" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "What do you want here?" })).toBeVisible();
  await page.getByLabel("Find teammates").check();
  await page.getByRole("button", { name: "Finish" }).click();

  await expect(page.getByRole("heading", { name: "Your feed is empty" })).toBeVisible();
  await expect(page.getByText("not available yet")).toBeVisible();
  await page.getByRole("region", { name: "Feed" }).getByRole("link", { name: "Discover" }).click();
  await expect(page).toHaveURL(/\/discover/);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/profile\?next=%2Fsettings/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});
