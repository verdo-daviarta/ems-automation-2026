import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { NotificationPage } from '../../pages/notifications/NotificationPage.js';
import { RoomsPage } from '../../pages/rooms/RoomsPage.js';
import { qa } from '../../support/settings.js';
import { formatTestTimestamp } from '../../support/testDataTime.js';

function loginWithSession(role) {
  cy.session(['TS-009', role], () => {
    cy.loginAs(role);
    new DashboardPage().assertReady();
  });
}

describe('EMS notification from another user CRU @notifications', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  scenario('[FEAT-006] [TS-009] PJ menerima notifikasi Create dan Update Room oleh Admin', () => {
    const roomsPage = new RoomsPage();
    const notificationPage = new NotificationPage();
    expect(roles).to.include.members(['admin', 'pj']);
    const roomName = `QA-TS009-admin-${formatTestTimestamp()}`;
    cy.log(`Room uji dipertahankan untuk fase Delete: ${roomName}`);

    loginWithSession('admin');
    roomsPage.visit();
    roomsPage.create({
      name: roomName,
      location: 'QA staging automation',
      description: 'TS-009 Created'
    });

    roomsPage.search(roomName);
    roomsPage.updateDescription(roomName, 'TS-009 Updated');

    loginWithSession('pj');
    cy.visit(qa().contract.routes.dashboard);
    new DashboardPage().assertReady();
    notificationPage.openFromBell();

    notificationPage.messageForRoom(roomName, 'created').should('be.visible');
    notificationPage.messageForRoom(roomName, 'updated').should('be.visible');
  });

  scenario('[FEAT-006] [TS-009] Komandan tidak memiliki fitur notifikasi', () => {
    const notificationPage = new NotificationPage();
    expect(roles).to.include('komandan');
    loginWithSession('komandan');
    cy.visit(qa().contract.routes.dashboard);
    new DashboardPage().assertReady();
    notificationPage.bell.should('not.exist');
    notificationPage.navigationLink.should('not.exist');
  });
});
