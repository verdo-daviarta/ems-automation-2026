import { qa } from '../../support/settings.js';

const searchSelector = 'input[placeholder="Search..."]';
const nameSelector = 'input[name="name"]';
const picSelector = 'select[name="picName"]';
const locationSelector = 'textarea[name="location"]';
const descriptionSelector = 'textarea[name="description"]';

export class RoomsPage {
  visit() {
    cy.visit(qa().contract.routes.rooms);
    return cy.contains('h1', 'Rooms').should('be.visible');
  }

  search(name) {
    cy.intercept({ method: 'GET', pathname: '/api/rooms', query: { search: name } }).as(
      'roomSearch'
    );
    cy.get(searchSelector).clear().type(name);
    return cy.wait('@roomSearch').its('response.statusCode').should('eq', 200);
  }

  roomRow(name) {
    return cy.contains('table tbody tr', name);
  }

  create({ name, location, description }) {
    cy.contains('button', 'Add room').click();
    cy.get('[role="dialog"]').within(() => {
      cy.get(nameSelector).type(name);
      cy.get(picSelector).select('PJ Bangunan EMS');
      cy.get(locationSelector).type(location);
      cy.get(descriptionSelector).type(description);
      cy.contains('button', 'Add room').click();
    });

    this.search(name);
    return this.roomRow(name).should('be.visible');
  }

  update(name, description) {
    cy.intercept('PATCH', '**/api/rooms/*').as('roomUpdate');
    this.roomRow(name).find(`button[aria-label="Edit ${name}"]`).click();
    cy.get('[role="dialog"]').within(() => {
      cy.get(descriptionSelector).clear().type(description);
      cy.contains('button', 'Update room').click();
    });

    cy.wait('@roomUpdate').its('response.statusCode').should('eq', 200);
    return cy.get('[role="dialog"]').should('not.exist');
  }

  remove(name) {
    cy.intercept('DELETE', '**/api/rooms/*').as('roomDelete');
    this.roomRow(name).find(`button[aria-label="Delete ${name}"]`).click();
    cy.get('[role="dialog"]').contains('button', 'Yes, Delete').click();
    cy.wait('@roomDelete').its('response.statusCode').should('be.within', 200, 299);
    return cy.get('body').should(($body) => {
      expect($body.find('table tbody tr').text()).not.to.include(name);
    });
  }

  removeIfPresent(name) {
    this.visit();
    this.search(name);

    cy.get('body').then(($body) => {
      if ($body.find('table tbody tr').filter((_, row) => row.textContent.includes(name)).length) {
        this.remove(name);
      }
    });
  }
}
