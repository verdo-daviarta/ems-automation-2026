import { qa } from '../../support/settings.js';

export class ReportPage {
  openFromMenu() {
    cy.get(`a[href="${qa().contract.routes.report}"]`).click();
    cy.location('pathname').should('eq', qa().contract.routes.report);
    return cy.contains('h1', /^Reports$/).should('be.visible');
  }

  exportFile({ label, extension }) {
    cy.task('prepareReportDownload', extension, { log: false });
    const alias = `reportExport${extension}`;
    cy.intercept({
      method: 'GET',
      pathname: '/api/reports/export',
      query: { format: extension }
    }).as(alias);
    cy.contains('button', /^Export$/)
      .should('be.enabled')
      .click();
    cy.contains('[role="menuitem"]', `Export as ${label}`).click();
    // Tunggu respons export puluhan ribu log tanpa fixed wait.
    return cy.wait(`@${alias}`, { responseTimeout: 60000 });
  }
}
