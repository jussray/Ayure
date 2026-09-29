import { expect, test } from "@playwright/test";

test("AYURE intent search explains matches and proof without fake precision", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Where properties meet opportunity/i })).toBeVisible();

  const query = page.getByLabel("Tell AYURE what you want to make happen");
  await query.fill("I have $175k and want a short-term rental near Pittsburgh");
  await page.getByRole("button", { name: "Ask AYURE" }).click();

  await expect(page.getByText("AYURE understood")).toBeVisible();
  await expect(page.getByText(/ayure-intent-v1-/)).toBeVisible();
  await expect(page.getByText("Example").first()).toBeVisible();
  await expect(page.getByText(/Matches your goal|Relevant property/).first()).toBeVisible();
  await expect(page.getByText(/Strong match|Good match|Possible match/).first()).toBeVisible();
  await expect(page.getByText(/% fit/)).toHaveCount(0);
});

test("match API keeps heuristic ranking internal", async ({ request }) => {
  const response = await request.post("/api/match", {
    data: { query: "I want to invest in a property near Pittsburgh" },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.results.length).toBeGreaterThan(0);
  expect(payload.results[0]).not.toHaveProperty("score");
  expect(["strong", "good", "possible"]).toContain(payload.results[0].strength);
});

test("natural language intent favors the user action over generic property words", async ({ request }) => {
  const response = await request.post("/api/match", {
    data: { query: "I want to invest in a property near Pittsburgh" },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.intent.kind).toBe("invest");
  expect(payload.intent.location).toBe("Pittsburgh");
});

test("budget parsing skips unrelated small numbers and finds the actual budget", async ({ request }) => {
  const response = await request.post("/api/match", {
    data: { query: "I want a 3 bed short-term rental near Pittsburgh under $250k" },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.intent.budgetMax).toBe(250000);
  expect(payload.intent.location).toBe("Pittsburgh");
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
