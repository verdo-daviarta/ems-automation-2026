import { qa } from '../../support/settings.js';

export class DashboardPage {
  get contract() {
    return qa().contract;
  }
  get ready() {
    return cy.get(this.contract.selectors.dashboardReady);
  }
  get logoutButton() {
    return cy.get(this.contract.selectors.logout);
  }

  assertReady() {
    cy.location('pathname').should('eq', this.contract.routes.dashboard);
    return this.ready.should('be.visible');
  }

  logout() {
    return this.logoutButton.click();
  }
}
