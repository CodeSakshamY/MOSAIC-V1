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

test("the owner can open an applicant profile and project", async ({ page, browser }) => {
  test.setTimeout(180_000);
  const stamp = Date.now().toString(36);
  const name = `Rev ${stamp}`;
  const applicantProject = `Board ${stamp}`;
  await onboard(page, `rva${stamp}`, name, `rva.${stamp}@example.com`);
  await page.goto("/forge");
  await page.getByLabel("Project name").fill(name);
  await page.getByLabel("Description").fill("A public project that receives an application.");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/forge\/rev-/);
  const projectUrl = page.url();

  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  await onboard(other, `rvb${stamp}`, `Rvb ${stamp}`, `rvb.${stamp}@example.com`);
  await other.goto("/forge");
  await other.getByLabel("Project name").fill(applicantProject);
  await other.getByLabel("Description").fill("The applicant's own public project.");
  await other.getByRole("button", { name: "Create project" }).click();
  await expect(other).toHaveURL(/\/forge\/board-/);
  await other.goto(projectUrl);
  await other.locator("#contribution-message").fill(`I can help ${stamp}`);
  await other.locator("#contribution-proposal").fill(`I would test the board ${stamp}`);
  await other.getByRole("button", { name: "Send request" }).click();
  await expect(other.getByText("Request sent.")).toBeVisible();
  await otherContext.close();

  await page.goto(projectUrl);
  const requests = page.locator("[aria-labelledby='project-requests-heading']");
  await expect(requests.getByRole("link", { name: `Rvb ${stamp}` })).toHaveAttribute("href", `/people/rvb${stamp}`);
  await expect(requests.getByRole("link", { name: applicantProject })).toHaveAttribute("href", /\/forge\/board-/);
});
