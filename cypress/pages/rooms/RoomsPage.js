import { qa } from '../../support/settings.js';

const searchSelector = 'input[placeholder="Search..."]';
const nameSelector = 'input[name="name"]';
const picSelector = 'select[name="picName"]';
const locationSelector = 'textarea[name="location"]';
const descriptionSelector = 'textarea[name="description"]';

export class RoomsPage {
  openFromMenu() {
    cy.get(`a[href="${qa().contract.routes.rooms}"]`).click();
    return cy.contains('h1', /^Rooms$/).should('be.visible');
  }

  visit() {
    cy.visit(qa().contract.routes.rooms);
    return cy.contains('h1', 'Rooms').should('be.visible');
  }

  search(name) {
    cy.get(searchSelector).clear().type(name).should('have.value', name);
    return this.roomRow(name).should('be.visible');
  }

  searchFirstMatch(keyword) {
    cy.get(searchSelector).clear().type(keyword).should('have.value', keyword);
    return cy
      .get('table tbody tr')
      .first()
      .find('button[aria-label^="View "]')
      .should('have.attr', 'aria-label')
      .and('include', keyword)
      .then((label) => label.slice('View '.length));
  }

  roomRow(name) {
    return cy
      .get('table tbody td')
      .filter((_, cell) => cell.innerText.trim().split('\n')[0].trim() === name)
      .closest('tr');
  }

  openDetails(name) {
    return this.roomRow(name)
      .find(`button[aria-label="View ${name}"]`)
      .should('be.visible')
      .and('be.enabled')
      .should(($button) => {
        expect($button[0].onclick, 'handler klik View Room siap').to.be.a('function');
      })
      .click();
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

  updateDescription(name, description) {
    cy.intercept('PATCH', '**/api/rooms/*').as('roomUpdate');
    this.roomRow(name).find(`button[aria-label="Edit ${name}"]`).click();
    cy.get('[role="dialog"]').within(() => {
      cy.get(descriptionSelector).clear().type(description).should('have.value', description);
      cy.contains('button', 'Update room').click();
    });

    cy.wait('@roomUpdate').its('response.statusCode').should('eq', 200);
    return cy.get('[role="dialog"]').should('not.exist');
  }
}
