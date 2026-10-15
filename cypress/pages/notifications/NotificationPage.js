import { qa } from '../../support/settings.js';

export class NotificationPage {
  visitAll() {
    cy.visit(`${qa().contract.routes.notification}?tab=all&page=1&rowsPerPage=10`);
    return cy.contains('h1', 'Notification').should('be.visible');
  }

  messageForRoom(roomName, action) {
    return cy.contains('table tbody tr', `Room "${roomName}" has been ${action}`);
  }

  get bell() {
    return cy.get('button[aria-label="Notifications"]');
  }

  get unreadBadge() {
    return cy.get('button[aria-label="Notifications"] > span');
  }

  get navigationLink() {
    return cy.get('a[href="/notification"]');
  }
}
