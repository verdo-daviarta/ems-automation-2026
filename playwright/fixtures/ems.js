import { test as base, expect } from '@playwright/test';
import { readSettings, loadEnvironment } from '../../shared/settings.cjs';
import { LoginPage } from '../pages/auth/LoginPage.js';

loadEnvironment();

export const test = base.extend({
  settings: async ({}, use) => {
    await use(readSettings());
  },
  auth: async ({ page, settings }, use) => {
    const loginPage = new LoginPage(page, settings);
    await use({
      login: async (role) => {
        await loginPage.visit();
        await loginPage.fillCredentials(settings.credentials[role]);
        await loginPage.submit();
      }
    });
  }
});

export { expect };
