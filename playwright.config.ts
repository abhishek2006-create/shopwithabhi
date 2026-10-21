import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
const production = process.env.E2E_PRODUCTION === "true";
const productionPort = Number(process.env.E2E_PORT || 3001);
if (
  !Number.isInteger(productionPort) ||
  productionPort < 1024 ||
  productionPort > 65535
)
  throw new Error("E2E_PORT must be an integer from 1024 to 65535.");
const baseURL = production
  ? `http://localhost:${productionPort}`
  : "http://localhost:3000";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  expect: { timeout: 10000 },
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
    command: production
      ? `npm start -- --port ${productionPort}`
      : "npm run dev",
    url: baseURL,
    reuseExistingServer: !production,
    timeout: 120000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], browserName: "chromium" },
    },
  ],
});
