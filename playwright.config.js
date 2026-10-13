import { defineConfig } from '@playwright/test';
import { loadEnvironment, readSettings, publicSettings } from './shared/settings.cjs';
loadEnvironment();
const settings = readSettings();
export default defineConfig({
  testDir: './playwright/tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 30000,
  expect: { timeout: 10000 },
  outputDir: `reports/runs/${settings.runId}/playwright-artifacts`,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright-html', open: 'never' }],
    ['junit', { outputFile: `reports/runs/${settings.runId}/playwright.xml` }],
    ['./playwright/reporters/summary.js', { settings: publicSettings(settings) }]
  ],
  use: {
    baseURL: settings.baseURL,
    browserName: 'chromium',
    channel: process.env.QA_PLAYWRIGHT_CHANNEL || undefined,
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    ignoreHTTPSErrors: false
  },
  projects: [
    { name: 'api', testMatch: '**/api/**/*.spec.js' },
    { name: 'mobile-320', testMatch: '**/mobile/**/*.spec.js',
      use: { viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true } },
    { name: 'responsive', testMatch: '**/responsive/**/*.spec.js' }
  ],
  webServer: settings.target === 'demo' && process.env.QA_DEMO_MANAGED !== '1'
    ? { command: 'node demo/server.mjs', url: `${settings.baseURL}/health`, reuseExistingServer: false, timeout: 15000 }
    : undefined
});
