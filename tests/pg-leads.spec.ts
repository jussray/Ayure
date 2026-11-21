import { expect, test } from "@playwright/test";
import { sanitizeDatabaseUrl, PG_POOL_MAX_PER_ISOLATE } from "../lib/db/postgres-config";
import { resolveLeadBackend } from "../lib/db/storage-mode";

test("D1 remains the default until explicit PostgreSQL cutover", () => {
  expect(resolveLeadBackend(undefined)).toBe("d1");
  expect(resolveLeadBackend("d1")).toBe("d1");
  expect(resolveLeadBackend("postgres")).toBe("postgres");
  expect(() => resolveLeadBackend("auto")).toThrow();
});

test("postgres URL removes ALL driver-dependent TLS overrides", () => {
  const url = sanitizeDatabaseUrl("postgresql://ayure_app:secret@db.example.org:5432/ayure?sslmode=disable&sslcert=x&sslkey=y&sslrootcert=z&ssl=true&uselibpqcompat=1&application_name=ayure");
  const params = new URL(url).searchParams;
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert", "ssl", "uselibpqcompat"]) {
    expect(params.has(key)).toBe(false);
  }
  expect(params.get("application_name")).toBe("ayure");
  expect(PG_POOL_MAX_PER_ISOLATE).toBe(2);
});
test("postgres URL rejects wrong schemes and host overrides", () => {
  expect(() => sanitizeDatabaseUrl("http://db.example.org/ayure")).toThrow();
  expect(() => sanitizeDatabaseUrl("postgresql://db.example.org/ayure?host=attacker.example.org")).toThrow();
  expect(() => sanitizeDatabaseUrl("")).toThrow();
});
test("join API rejects a filled honeypot without DB access", async ({ request }) => {
  const response = await request.post("/api/join", { data: {
    role: "operator", name: "Test Operator", email: "operator@example.com",
    goal: "Connecting with property owners", website: "https://spam.example"
  }});
  expect(response.status()).toBe(400);
});
test("join API handles non-string fields without 500", async ({ request }) => {
  const response = await request.post("/api/join", { data: {
    role: ["operator"], name: 42, email: "operator@example.com", goal: "Property work"
  }});
  expect(response.status()).toBe(400);
});
test("join API caps actual request body bytes without relying on content-length", async ({ request }) => {
  const response = await request.post("/api/join", { headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ role: "buyer", name: "Tester", email: "buyer@example.com", goal: "x".repeat(20_000) })
  });
  expect(response.status()).toBe(413);
});
