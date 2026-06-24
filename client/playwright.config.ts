import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  globalSetup: './tests/browser/global-setup.ts',
  globalTeardown: './tests/browser/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Serve the pre-built static export while tests run.
  // Build first with: EXPO_PUBLIC_SERVER_URL=http://localhost:3001 expo export --platform web
  webServer: {
    command: 'npx serve dist -l 8081 --no-clipboard',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
