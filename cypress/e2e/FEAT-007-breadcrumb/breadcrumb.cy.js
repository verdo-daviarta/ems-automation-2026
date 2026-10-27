import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { Breadcrumb } from '../../pages/navigation/Breadcrumb.js';
import { RoomsPage } from '../../pages/rooms/RoomsPage.js';
import { qa } from '../../support/settings.js';

describe('EMS informational breadcrumb @navigation', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  // Cari Room yang sudah ada, lalu gunakan hasil paling atas (index 0).
  const roomName = 'QA-TS009';

  for (const role of roles) {
    scenario(`[FEAT-007] [TS-073] Breadcrumb informatif tanpa navigasi — ${role}`, () => {
      const roomsPage = new RoomsPage();
      const breadcrumb = new Breadcrumb();

      cy.loginAs(role);
      new DashboardPage().assertReady();
      roomsPage.visit();
      roomsPage.searchFirstMatch(roomName).then((selectedRoomName) => {
        roomsPage.openDetails(selectedRoomName);

        cy.location('pathname').should('match', /^\/rooms\/detail\/[^/]+$/);
        cy.contains('h1', selectedRoomName).should('be.visible');
        cy.location('href').then((detailUrl) => {
          for (const label of ['EMS', 'Rooms', selectedRoomName]) {
            breadcrumb.assertInformational(label).click();
            cy.location('href').should('eq', detailUrl);
            cy.contains('h1', selectedRoomName).should('be.visible');
          }
        });
      });
    });
  }
});
