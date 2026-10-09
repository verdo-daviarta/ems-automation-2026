import { test as base, expect } from '@playwright/test';
import { readSettings, loadEnvironment } from '../../shared/settings.cjs';
import type { Settings } from '../../shared/types';
import { AuthPage } from '../pages/auth.page';

loadEnvironment();
export const test = base.extend<{ settings: Settings; auth: AuthPage }>({
  settings: async ({}, use) => { await use(readSettings()); },
  auth: async ({ page, settings }, use) => { await use(new AuthPage(page, settings)); }
});
export { expect };
