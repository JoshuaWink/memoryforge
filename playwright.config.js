import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:3333',
    headless: true,
  },
  webServer: {
    command: 'npx serve docs -l 3333 -s',
    port: 3333,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
