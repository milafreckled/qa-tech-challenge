import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';


dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

import { environments, resolveEnvironment } from './config/environments';

const env = resolveEnvironment();
const { baseURL } = environments[env];

console.log(`Running tests against environment: ${env} (${baseURL})`);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: '**/test-case4.spec.ts',
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: '**/test-case4.spec.ts',
    },
    {
      name: 'msedge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
      testIgnore: '**/test-case4.spec.ts',
    },
  ],
});
