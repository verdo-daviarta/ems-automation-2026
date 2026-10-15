import { test, expect } from '../../fixtures/ems.js';
import { LoginPage } from '../../pages/auth/LoginPage.js';
import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { expectNoHorizontalOverflow } from '../../support/layout.js';

test('[TS-046] [CROSS-MOBILE] Login-dashboard-logout pada viewport 320 px', async ({
  page,
  auth,
  settings
}) => {
  const loginPage = new LoginPage(page, settings);
  const dashboardPage = new DashboardPage(page, settings);

  await auth.login(settings.roles[0]);
  await dashboardPage.expectReady();
  await expect(dashboardPage.logoutButton).toBeInViewport();
  await expectNoHorizontalOverflow(page);

  await dashboardPage.logout();
  await loginPage.expectVisible();
});
