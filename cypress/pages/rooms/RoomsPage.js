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
    return cy
      .get('table tbody td')
      .filter((_, cell) => cell.innerText.trim().split('\n')[0].trim() === name)
      .closest('tr');
  }

  openDetails(name) {
    return this.roomRow(name).find(`button[aria-label="View ${name}"]`).click();
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

  updateLocation(name, location) {
    cy.intercept('PATCH', '**/api/rooms/*').as('roomUpdate');
    this.roomRow(name).find(`button[aria-label="Edit ${name}"]`).click();
    cy.get('[role="dialog"]').within(() => {
      cy.get(locationSelector).clear().type(location);
      cy.contains('button', 'Update room').click();
    });

    cy.wait('@roomUpdate').its('response.statusCode').should('eq', 200);
    cy.get('[role="dialog"]').should('not.exist');
    return this.roomRow(name).should('contain.text', location);
  }
}
