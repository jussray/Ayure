import { expect, test } from "@playwright/test";

test("AYURE intent search explains matches and proof without fake precision", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Where properties meet opportunity/i })).toBeVisible();

  const query = page.getByLabel("Tell AYURE what you want to make happen");
  await expect(query).toHaveAttribute("maxlength", "500");
  await query.fill("I have $175k and want a short-term rental near Pittsburgh");
  await page.getByRole("button", { name: "Search" }).click();

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

test("match API rejects unsupported intents and oversized searches", async ({ request }) => {
  const badIntent = await request.post("/api/match", {
    data: { query: "find something", intent: "admin_override" },
  });
  expect(badIntent.status()).toBe(400);

  const oversized = await request.post("/api/match", {
    data: { query: "x".repeat(501) },
  });
  expect(oversized.status()).toBe(400);
});

test("join API rejects oversized public input before touching storage", async ({ request }) => {
  const response = await request.post("/api/join", {
    data: {
      role: "operator",
      name: "Test Operator",
      email: "operator@example.com",
      goal: "x".repeat(2001),
    },
  });
  expect(response.status()).toBe(400);
});

test("AYURE join flow mirrors backend limits and preserves role state", async ({ page }) => {
  await page.goto("/join?goal=Connect%20me%20with%20an%20operator");

  const role = page.getByRole("button", { name: "Operate properties" });
  await role.click();
  await expect(role).toHaveAttribute("aria-pressed", "true");

  const name = page.getByLabel("Your name");
  const email = page.getByLabel("Email");
  const goal = page.getByLabel("What are you trying to make happen?");
  await expect(name).toHaveAttribute("maxlength", "120");
  await expect(email).toHaveAttribute("maxlength", "254");
  await expect(goal).toHaveAttribute("maxlength", "2000");

  await name.fill("Test Operator");
  await email.fill("operator@example.com");
  await expect(goal).toHaveValue("Connect me with an operator");
  await expect(page.getByText(/\/ 2,000 characters/)).toBeVisible();

  await expect(page.getByRole("button", { name: "Join the founding network" })).toBeEnabled();
});

test("mobile layout has no horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "mobile-only assertion");
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("reference search surface: chips, structured fields and a bare place name all drive real matches", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
  await expect(page.locator(".hero-photo img")).toBeVisible();

  const buy = page.getByRole("button", { name: "Buy a property" });
  await buy.click();
  await expect(buy).toHaveAttribute("aria-pressed", "true");

  await page.getByLabel("Tell AYURE what you want to make happen").fill("Pittsburgh");
  await page.getByLabel("Budget").selectOption("250000");
  await page.getByLabel("Timeframe").selectOption("3m");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.getByText("AYURE understood")).toBeVisible();
  await expect(page.getByText(/buy a property · Pittsburgh/)).toBeVisible();
  await expect(page.getByText("Location fit").first()).toBeVisible();
  await expect(page.locator(".match-card img").first()).toHaveAttribute("src", /^\/images\//);
  await expect(page.getByText(/% fit/)).toHaveCount(0);
});

test("homepage shows no invented scale, platform endorsement or unlabeled figures", async ({ page }) => {
  await page.goto("/");
  const body = await page.locator("main").innerText();
  expect(body).not.toMatch(/1,200\+|350\+|€280M|4\.8\/5|Trusted by experts/i);
  expect(body).toMatch(/Founding collection/);
  expect(body).toMatch(/EXAMPLE/);
  for (const img of await page.locator("main img").all()) {
    expect(await img.getAttribute("src")).toMatch(/^\/images\//);
  }
});

test("AYURE follows Juss & Co's motion rhythm without changing its page content", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByRole("heading", { name: /Where properties meet opportunity/i });
  await expect(hero).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/ayure-motion-ready/);
  await expect(hero).toHaveClass(/ayure-in-view/);

  const how = page.locator(".how-heading");
  await how.scrollIntoViewIfNeeded();
  await expect(how).toHaveClass(/ayure-in-view/);
  await expect(how).toBeVisible();
});

test("AYURE honors reduced motion and retains all visual content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Where properties meet opportunity/i })).toBeVisible();
  await expect(page.locator(".hero-photo img")).toHaveCSS("transform", "none");
  await expect(page.locator("html")).not.toHaveClass(/ayure-motion-ready/);
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
});

test("AYURE publishes consistent canonical www URLs for home and Join", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.ayure.us/");
  await page.goto("/join");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.ayure.us/join");
});
