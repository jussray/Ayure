import { defineConfig, devices } from "@playwright/test";

const productionURL = process.env.PLAYWRIGHT_BASE_URL;
if (productionURL && !/^https:\/\//.test(productionURL)) {
  throw new Error("PLAYWRIGHT_BASE_URL must be an HTTPS URL");
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  reporter: process.env.CI ? [["line"], ["github"]] : "line",
  use: {
    baseURL: productionURL || "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  ...(productionURL ? {} : {
    webServer: {
      command: "npm run dev -- --hostname 127.0.0.1",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  }),
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
});
