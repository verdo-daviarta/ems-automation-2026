import { expect } from '@playwright/test';

export class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page, settings) {
    this.page = page;
    this.settings = settings;
  }

  get identifierField() {
    return this.page.locator(this.settings.contract.selectors.email);
  }
  get passwordField() {
    return this.page.locator(this.settings.contract.selectors.password);
  }
  get submitButton() {
    return this.page.locator(this.settings.contract.selectors.submit);
  }

  async visit() {
    await this.page.goto(this.settings.contract.routes.login);
  }

  async fillCredentials(role) {
    const account = this.settings.credentials[role];
    await this.identifierField.fill(account.email);
    await this.passwordField.fill(account.password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async expectVisible() {
    await expect
      .poll(() => new URL(this.page.url()).pathname)
      .toBe(this.settings.contract.routes.login);
    await expect(this.submitButton).toBeVisible();
  }
}
