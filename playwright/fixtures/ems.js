import { test as base, expect } from '@playwright/test';
import { readSettings, loadEnvironment } from '../../shared/settings.cjs';
import { LoginPage } from '../pages/auth/LoginPage.js';
import { DashboardPage } from '../pages/dashboard/DashboardPage.js';
loadEnvironment();
export const test = base.extend({
  settings: async ({}, use) => {
    await use(readSettings());
  },
  auth: async ({ page, settings }, use) => {
    const loginPage = new LoginPage(page, settings);
    const dashboardPage = new DashboardPage(page, settings);
    await use({
      login: async (role) => {
        await loginPage.visit();
        await loginPage.fillCredentials(role);
        await loginPage.submit();
        await dashboardPage.expectReady();
      },
      logout: async () => {
        await dashboardPage.logout();
        await loginPage.expectVisible();
      }
    });
  }
});
export { expect };
