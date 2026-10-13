import { test as base, expect } from '@playwright/test';
import { readSettings, loadEnvironment } from '../../shared/settings.cjs';
import { AuthPage } from '../pages/auth.page.js';
loadEnvironment();
export const test = base.extend({
  settings: async ({}, use) => { await use(readSettings()); },
  auth: async ({ page, settings }, use) => { await use(new AuthPage(page, settings)); }
});
export { expect };
