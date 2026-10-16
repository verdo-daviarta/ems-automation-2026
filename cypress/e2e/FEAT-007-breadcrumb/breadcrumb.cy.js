import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { Breadcrumb } from '../../pages/navigation/Breadcrumb.js';
import { RoomsPage } from '../../pages/rooms/RoomsPage.js';
import { qa } from '../../support/settings.js';

describe('EMS breadcrumb navigation @navigation', () => {
  const { target, roles, contract } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  // Masukan nama room yang sudah ada di database untuk pengujian breadcrumb
  const roomName = 'Server 2';

  for (const role of roles) {
    scenario(`[FEAT-007] [TS-073] Breadcrumb Rooms dari detail Room — ${role}`, () => {
      const roomsPage = new RoomsPage();
      const breadcrumb = new Breadcrumb();

      cy.loginAs(role);
      new DashboardPage().assertReady();
      roomsPage.visit();
      roomsPage.search(roomName);
      roomsPage.openDetails(roomName);

      cy.location('pathname').should('match', /^\/rooms\/detail\/[^/]+$/);
      cy.contains('h1', roomName).should('be.visible');
      breadcrumb.assertCurrent(roomName);
      breadcrumb.follow('Rooms', contract.routes.rooms);

      cy.location('pathname').should('eq', contract.routes.rooms);
      cy.contains('h1', 'Rooms').should('be.visible');
    });
  }
});
