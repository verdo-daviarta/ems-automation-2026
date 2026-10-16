import { qa } from '../../support/settings.js';

export class NotificationPage {
  visitAll() {
    cy.visit(`${qa().contract.routes.notification}?tab=all&page=1&rowsPerPage=10`);
    return cy.contains('h1', 'Notification').should('be.visible');
  }

  messageForRoom(roomName, action) {
    const subject = action === 'Updated' ? `Room Name "${roomName}"` : `Room "${roomName}"`;
    return cy.contains('table tbody tr', subject).should('contain.text', `has been ${action}`);
  }

  openFromBell() {
    this.bell.click();
    cy.contains(/^View all$/i).click();
    return cy.contains('h1', 'Notification').should('be.visible');
  }

  get unreadTab() {
    return cy.contains('button', /^Unread \(\d+\)$/);
  }

  get allTab() {
    return cy.contains('button', /^All$/);
  }

  get readAllButton() {
    return cy.contains('button', /^Read All$/);
  }

  get rows() {
    return cy.get('table tbody tr');
  }

  get rowsPerPage() {
    return cy.get('select');
  }

  selectUnread() {
    this.unreadTab.click();
    return cy.location('search').should('include', 'tab=unread');
  }

  selectAll() {
    this.allTab.click();
    return cy.location('search').should('include', 'tab=all');
  }

  selectRowsPerPage(count) {
    this.rowsPerPage.select(String(count));
    return cy.location('search').should((search) => {
      const params = new URLSearchParams(search);
      expect(params.get('rowsPerPage')).to.eq(String(count));
      expect(params.get('page')).to.eq('1');
    });
  }

  goToPage(page) {
    const alias = `notificationPage${page}`;
    cy.intercept({
      method: 'GET',
      pathname: qa().contract.routes.notification,
      query: { page: String(page) }
    }).as(alias);
    cy.contains('button', new RegExp(`^${page}$`))
      .should('be.enabled')
      .click();
    cy.wait(`@${alias}`).its('response.statusCode').should('eq', 200);
    return cy.location('search').should((search) => {
      expect(new URLSearchParams(search).get('page')).to.eq(String(page));
    });
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
