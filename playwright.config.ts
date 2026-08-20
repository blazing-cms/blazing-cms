import { defineConfig } from "@playwright/test";

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  reporter: "list",
  retries: 2,
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:5173/",
    trace: "on-first-retry",
  },
  webServer: {
    command: "node ../../packages/cms/bin/cms.js dev",
    cwd: "apps/playground",
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
