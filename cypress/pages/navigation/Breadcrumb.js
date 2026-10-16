export class Breadcrumb {
  assertCurrent(label) {
    return cy.get('header').contains(label).should('be.visible');
  }

  follow(label, path) {
    return cy.get('header').contains('a', label).should('have.attr', 'href', path).click();
  }
}
