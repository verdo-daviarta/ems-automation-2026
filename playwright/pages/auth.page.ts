import { expect, type Page } from '@playwright/test';
import type { Role, Settings } from '../../shared/types';

export class AuthPage {
  constructor(private page: Page, private settings: Settings) {}
  async login(role: Role) {
    const { contract, credentials } = this.settings;
    await this.page.goto(contract.routes.login);
    await this.page.locator(contract.selectors.email).fill(credentials[role].email);
    await this.page.locator(contract.selectors.password).fill(credentials[role].password);
    await this.page.locator(contract.selectors.submit).click();
    await expect.poll(() => new URL(this.page.url()).pathname).toBe(contract.routes.dashboard);
    await expect(this.page.locator(contract.selectors.dashboardReady)).toBeVisible();
  }
  async logout() {
    const { contract } = this.settings;
    await this.page.locator(contract.selectors.logout).click();
    await expect.poll(() => new URL(this.page.url()).pathname).toBe(contract.routes.login);
    await expect(this.page.locator(contract.selectors.submit)).toBeVisible();
  }
}
