import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";
const ci = Boolean(process.env.CI);

// Run through `pnpm test:e2e` at the repo root, which starts the Firebase Auth and
// Firestore emulators first. The web app is built in its e2e mode, which points
// Firebase at those emulators; the API is not started.
export default defineConfig({
  testDir: "tests",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  workers: 1,
  reporter: ci ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    // en-GB keeps the wizard in metric units.
    locale: "en-GB",
    viewport: { width: 1280, height: 860 },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 860 },
        // WebGL without a GPU.
        launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] },
      },
    },
  ],
  webServer: {
    command: "pnpm --filter @roomcraft/web build:e2e && pnpm --filter @roomcraft/web preview:e2e",
    url: baseURL,
    reuseExistingServer: !ci,
    timeout: 180_000,
  },
});
