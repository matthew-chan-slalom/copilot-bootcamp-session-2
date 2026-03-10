const { defineConfig } = require('@playwright/test');

const frontendPort = process.env.PORT || 3000;
const backendPort = process.env.BACKEND_PORT || 3030;

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: `PORT=${frontendPort} npm run start --workspace=frontend`,
      port: Number(frontendPort),
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: `PORT=${backendPort} npm run start --workspace=backend`,
      port: Number(backendPort),
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
