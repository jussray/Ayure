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

test("homepage uses Juss & Co-inspired scene motion without changing AYURE content", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByRole("heading", { name: /Where properties meet opportunity/i });
  await expect(hero).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/ayure-motion-ready/);
  await expect(hero).toHaveClass(/ayure-in-view/);

  const section = page.locator(".how-heading");
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveClass(/ayure-in-view/);
  await expect(section).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, 240));
  await expect(page.locator(".hero-photo img")).toHaveAttribute("style", /transform: translate3d/);
});

test("motion respects reduced-motion preferences", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Where properties meet opportunity/i })).toBeVisible();
  await expect(page.locator("html")).not.toHaveClass(/ayure-motion-ready/);
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await expect(page.locator(".hero-photo img")).toHaveCSS("transform", "none");
});

test("homepage and join canonical URLs use the www hostname", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.ayure.us");
  await page.goto("/join");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.ayure.us/join");
});


test("stay pathway routes operators to existing join flow without claiming inventory", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Great stays start with great operators." })).toBeVisible();
  await expect(page.getByText("Connection pending")).toHaveCount(2);
  await expect(page.getByRole("link", { name: /external affiliate link/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Join as a stay operator" }).click();
  await expect(page).toHaveURL(/join\?goal=/);
  await expect(page.getByLabel("What are you trying to make happen?")).toHaveValue(
    "I operate short-term rentals and want to join the AYURE network",
  );
});

test("affiliate links reject unapproved, unsafe, or lookalike destinations", async () => {
  const { approvedAffiliateHref } = await import("../lib/ayure/stay-affiliates");
  expect(approvedAffiliateHref("booking", "https://www.booking.com/?aid=123", false)).toBeNull();
  expect(approvedAffiliateHref("booking", "http://www.booking.com/?aid=123", true)).toBeNull();
  expect(approvedAffiliateHref("booking", "https://booking.com.evil.example/", true)).toBeNull();
  expect(approvedAffiliateHref("booking", "https://user:pass@booking.com/", true)).toBeNull();
  expect(approvedAffiliateHref("airbnb", "https://www.booking.com/", true)).toBeNull();
  expect(approvedAffiliateHref("booking", "https://www.booking.com/?aid=123", true)).toBe("https://www.booking.com/?aid=123");
  expect(approvedAffiliateHref("airbnb", "https://www.airbnb.com/rooms/1", true)).toBe("https://www.airbnb.com/rooms/1");
});


test("stay connection adapters reject bad requests and never invent inventory", async ({ request }) => {
  const result = await request.post("/api/stays/connections", {
    data: { location: "Pittsburgh", checkIn: "2026-12-10", checkOut: "2026-12-13", guests: 3 },
  });
  expect(result.ok()).toBeTruthy();
  const data = await result.json();
  expect(data.search).toEqual({ location: "Pittsburgh", checkIn: "2026-12-10", checkOut: "2026-12-13", guests: 3 });
  expect(data.inventory).toBe("not_available");
  expect(data.booking).toBe("external_provider_only");
  expect(data.channels.map((channel: { id: string }) => channel.id)).toEqual(["booking", "airbnb"]);
  for (const channel of data.channels) {
    expect(channel.status).toBe("connection_pending");
    expect(channel.href).toBeNull();
    expect(channel.availability).toBe("not_checked");
    expect(channel.reservation).toBe("not_processed");
    expect(channel.outcome).toBe("unverified");
  }
});

test("stay connection adapters reject invalid input", async ({ request }) => {
  for (const search of [
    { location: "Pittsburgh", checkIn: "2026-12-14", checkOut: "2026-12-13" },
    { location: "Pittsburgh", checkIn: "2026-02-30", checkOut: "2026-03-04" },
    { location: "Pittsburgh", guests: 0 },
    { location: "Pittsburgh", guests: 1.5 },
    { location: "x".repeat(121) },
  ]) {
    const response = await request.post("/api/stays/connections", { data: search });
    expect(response.status()).toBe(400);
  }
  const huge = await request.post("/api/stays/connections", { data: { location: "x".repeat(4200) } });
  expect(huge.status()).toBe(413);
});
