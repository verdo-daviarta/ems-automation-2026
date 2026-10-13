import { qa } from '../../support/settings.js';
// Tidak menyimpan account, DOM element, atau session antar-test.
export class LoginPage {
  get contract() { return qa().contract; }
  get emailField() { return cy.get(this.contract.selectors.email); }
  get passwordField() { return cy.get(this.contract.selectors.password); }
  get submitButton() { return cy.get(this.contract.selectors.submit); }
  get validationError() { return cy.get(this.contract.selectors.validationError); }
  get dashboardReady() { return cy.get(this.contract.selectors.dashboardReady); }
  visit() {
    return cy.visit(this.contract.routes.login);
  }
  /** @param {{ email: string, password: string }} account */
  fillCredentials(account) {
    this.emailField.clear().type(account.email, { log: false });
    return this.passwordField.clear().type(account.password, { log: false });
  }
  submit() {
    return this.submitButton.click();
  }
  togglePasswordVisibility() {
    return cy.get(this.contract.selectors.togglePassword).click();
  }
  logout() {
    return cy.get(this.contract.selectors.logout).click();
  }
  assertDashboardReady() {
    cy.location('pathname').should('eq', this.contract.routes.dashboard);
    return this.dashboardReady.should('be.visible');
  }
  assertLoginVisible() {
    cy.location('pathname').should('eq', this.contract.routes.login);
    return this.submitButton.should('be.visible');
  }
}
