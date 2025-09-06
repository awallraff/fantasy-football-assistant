import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // webServer configuration commented out to avoid conflicts with npm run dev
  // For manual testing, start the dev server separately with: npm run dev
  // webServer: {
  //   command: 'npm run build && npm start',
  //   port: 3000,
  //   reuseExistingServer: !process.env.CI,
  // },
})
