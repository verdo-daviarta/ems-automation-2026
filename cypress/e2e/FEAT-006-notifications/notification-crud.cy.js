import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { NotificationPage } from '../../pages/notifications/NotificationPage.js';
import { RoomsPage } from '../../pages/rooms/RoomsPage.js';
import { qa } from '../../support/settings.js';

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
    const roomName = `QA-TS009-admin-${Date.now()}`;
    cy.log(`Room uji dipertahankan untuk fase Delete: ${roomName}`);

    loginWithSession('admin');
    roomsPage.visit();
    roomsPage.create({
      name: roomName,
      location: 'QA staging automation',
      description: 'TS-009 created'
    });

    loginWithSession('pj');
    notificationPage.visitAll();
    notificationPage.messageForRoom(roomName, 'Created').should('be.visible');
    notificationPage.unreadBadge.should('be.visible');

    loginWithSession('admin');
    roomsPage.visit();
    roomsPage.search(roomName);
    roomsPage.updateLocation(roomName, 'QA staging automation updated');

    loginWithSession('pj');
    notificationPage.visitAll();
    notificationPage.messageForRoom(roomName, 'Updated').should('be.visible');
    notificationPage.unreadBadge.should('be.visible');
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
