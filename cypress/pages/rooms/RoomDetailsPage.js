import { qa } from '../../support/settings.js';

export class RoomDetailsPage {
  assertReady({ id, name }) {
    cy.location('pathname').should('eq', `${qa().contract.routes.rooms}/detail/${id}`);
    return cy.contains('h1', name).should('be.visible');
  }

  get devicesTable() {
    return cy.contains('table th', /^Device\(s\)$/).closest('table');
  }

  deviceRow(eui) {
    return this.devicesTable.contains('tbody td', eui).closest('tr');
  }
}
