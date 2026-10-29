import { defineConfig, devices } from '@playwright/test';

// The characterisation suite. It drives a real browser against the running
// app, so it does not care which framework renders the page.
const PORT = 8000;

export default defineConfig({
  testDir: 'tests/e2e',
  // One snapshot set for every platform: the snapshots are text, not pixels.
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFileName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Test the production build, not the dev server: that is what users get.
    command: 'npm run build && npm run preview',
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
  },
});
