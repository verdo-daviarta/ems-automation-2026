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

describe('EMS notification from another user CRUD @notifications', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  for (const [actor, recipient] of [
    ['admin', 'pj'],
    ['pj', 'admin']
  ]) {
    describe(`${actor} → ${recipient}`, () => {
      let roomToClean;

      beforeEach(() => {
        roomToClean = null;
      });

      afterEach(() => {
        if (roomToClean) {
          loginWithSession('admin');
          new RoomsPage().removeIfPresent(roomToClean);
        }
      });

      scenario(
        `[FEAT-006] [TS-009] ${recipient} menerima notifikasi CRUD Room oleh ${actor}`,
        () => {
          const roomsPage = new RoomsPage();
          const notificationPage = new NotificationPage();
          expect(roles).to.include.members([actor, recipient]);
          const roomName = `QA-TS009-${actor}-${Date.now()}`;

          loginWithSession(actor);
          roomsPage.visit();
          cy.then(() => {
            roomToClean = roomName;
          });
          roomsPage.create({
            name: roomName,
            location: 'QA staging automation',
            description: 'TS-009 created'
          });
          roomsPage.update(roomName, 'TS-009 updated');
          roomsPage.remove(roomName).then(() => {
            roomToClean = null;
          });

          loginWithSession(recipient);
          notificationPage.visitAll();
          for (const action of ['Created', 'Updated', 'Deleted']) {
            notificationPage.messageForRoom(roomName, action).should('be.visible');
          }
          notificationPage.unreadBadge.should('be.visible');
        }
      );
    });
  }

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
