import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { NotificationPage } from '../../pages/notifications/NotificationPage.js';
import { RoomsPage } from '../../pages/rooms/RoomsPage.js';
import { qa } from '../../support/settings.js';
import { formatTestTimestamp } from '../../support/testDataTime.js';

function loginWithSession(role) {
  cy.session(['TS-010', role], () => {
    cy.loginAs(role);
    new DashboardPage().assertReady();
  });
}

describe('EMS notification filters and Read All @notifications', () => {
  const { target, roles, contract } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  scenario('[FEAT-010] [TS-010] PJ memfilter dan menandai semua notifikasi sebagai read', () => {
    expect(roles).to.include.members(['admin', 'pj']);
    const roomsPage = new RoomsPage();
    const notificationPage = new NotificationPage();
    const roomName = `QA-TS010-admin-${formatTestTimestamp()}`;

    loginWithSession('admin');
    roomsPage.visit();
    roomsPage.create({
      name: roomName,
      location: 'QA staging automation',
      description: 'TS-010 notification seed'
    });

    loginWithSession('pj');
    cy.visit(contract.routes.dashboard);
    new DashboardPage().assertReady();
    notificationPage.openFromBell();
    notificationPage.allTab.should('be.visible');
    notificationPage.messageForRoom(roomName, 'Created').should('be.visible');

    notificationPage.selectUnread();
    notificationPage.unreadTab.invoke('text').should('match', /^Unread \([1-9]\d*\)$/);
    notificationPage.messageForRoom(roomName, 'Created').should('be.visible');
    notificationPage.readAllButton.should('be.visible').click();

    notificationPage.unreadTab.should('have.text', 'Unread (0)');
    cy.get('table tbody tr').should('not.exist');
    notificationPage.selectAll();
    notificationPage.messageForRoom(roomName, 'Created').should('be.visible');

    cy.reload();
    notificationPage.unreadTab.should('have.text', 'Unread (0)');
  });
});
