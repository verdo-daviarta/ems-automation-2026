import { test, expect } from '../../fixtures/ems';

test('[TS-046] [CROSS-MOBILE] Login-dashboard-logout pada viewport 320 px', async ({ page, auth, settings }) => {
  await auth.login(settings.roles[0]);
  await expect(page.locator(settings.contract.selectors.logout)).toBeInViewport();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await auth.logout();
});
