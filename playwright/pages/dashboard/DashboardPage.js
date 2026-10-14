import { expect } from '@playwright/test';

export class DashboardPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page, settings) {
    this.page = page;
    this.settings = settings;
  }

  get ready() {
    return this.page.locator(this.settings.contract.selectors.dashboardReady);
  }
  get logoutButton() {
    return this.page.locator(this.settings.contract.selectors.logout);
  }

  async expectReady() {
    await expect
      .poll(() => new URL(this.page.url()).pathname)
      .toBe(this.settings.contract.routes.dashboard);
    await expect(this.ready).toBeVisible();
  }

  async logout() {
    await this.logoutButton.click();
  }
}
