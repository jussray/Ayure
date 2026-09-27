import { expect, test } from "@playwright/test";

test("AYURE intent search explains matches and proof", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Where properties meet opportunity/i })).toBeVisible();

  const query = page.getByLabel("Tell AYURE what you want to make happen");
  await query.fill("I have $175k and want a short-term rental near Pittsburgh");
  await page.getByRole("button", { name: "Ask AYURE" }).click();

  await expect(page.getByText("AYURE understood")).toBeVisible();
  await expect(page.getByText(/ayure-intent-v1-/)).toBeVisible();
  await expect(page.getByText("Example").first()).toBeVisible();
  await expect(page.getByText(/Matches your goal|Relevant property/).first()).toBeVisible();
});

test("AYURE join flow preserves role state and enables a real submission only when valid", async ({ page }) => {
  await page.goto("/join?goal=Connect%20me%20with%20an%20operator");

  const role = page.getByRole("button", { name: "Operate properties" });
  await role.click();
  await expect(role).toHaveAttribute("aria-pressed", "true");

  await page.getByLabel("Your name").fill("Test Operator");
  await page.getByLabel("Email").fill("operator@example.com");
  await expect(page.getByLabel("What are you trying to make happen?")).toHaveValue("Connect me with an operator");

  await expect(page.getByRole("button", { name: "Join the founding network" })).toBeEnabled();
});

test("mobile layout has no horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "mobile-only assertion");
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
