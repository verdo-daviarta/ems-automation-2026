import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { RoomsPage } from '../../pages/rooms/RoomsPage.js';
import { qa } from '../../support/settings.js';
import { formatTestTimestamp } from '../../support/testDataTime.js';

describe('EMS create Room @rooms', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  scenario('[FEAT-045] [TS-025] Admin membuat satu Room', () => {
    expect(roles).to.include('admin');
    const roomsPage = new RoomsPage();

    const room = {
      name: `QA-TS025-admin-${formatTestTimestamp()}`,
      location: 'QA staging automation',
      description: 'TS-025 create Room'
    };

    cy.log(`Room uji: ${room.name}`);

    cy.loginAs('admin');
    new DashboardPage().assertReady();
    roomsPage.visit();

    cy.intercept('POST', '**/api/rooms').as('roomCreate');
    roomsPage.create(room);
    cy.wait('@roomCreate').its('response.statusCode').should('be.oneOf', [200, 201]);

    cy.reload();
    roomsPage.search(room.name);
    roomsPage.roomRow(room.name).should('be.visible').and('contain.text', room.location);
  });
});
