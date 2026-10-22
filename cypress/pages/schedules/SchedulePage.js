import { qa } from '../../support/settings.js';

export class SchedulePage {
  openFromMenu() {
    cy.get(`a[href="${qa().contract.routes.schedule}"]`).click();
    return cy.contains('h1', 'Schedules').should('be.visible');
  }

  visit() {
    cy.visit(qa().contract.routes.schedule);
    return cy.contains('h1', 'Schedules').should('be.visible');
  }

  openUpcoming() {
    cy.intercept({
      method: 'GET',
      pathname: '/api/schedules',
      query: { status: 'upcoming' }
    }).as('upcomingSchedules');
    cy.contains('button', /^Upcoming schedule$/).click();
    return cy.wait('@upcomingSchedules').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      return interception;
    });
  }

  search(name) {
    cy.intercept({
      method: 'GET',
      pathname: '/api/schedules',
      query: { search: name }
    }).as('scheduleSearch');
    cy.get('input[placeholder="Search..."]').clear().type(name);
    return cy.wait('@scheduleSearch').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      return interception;
    });
  }

  scheduleRow(name) {
    return cy
      .get('table tbody tr')
      .filter((_, row) =>
        [...row.querySelectorAll('td')].some(
          (cell) => cell.innerText.trim().split('\n')[0] === name
        )
      );
  }

  openAddForm() {
    cy.contains('button', /^Add schedule$/).click();
    return cy.get('[role="dialog"]').should('be.visible');
  }

  fillForm({ name, description, roomName, action, startTime }) {
    cy.get('[role="dialog"]').within(() => {
      cy.get('input[name="name"]').type(name);
      cy.get('textarea[name="description"]').type(description);
      cy.get('select[name="roomId"]').select(roomName);
      cy.get('select[name="action"]').select(action);
      cy.get('input[name="startTime"]').type(startTime);
      cy.get('input[type="radio"][value="no-end"]').check();
    });
  }

  get repeatToggle() {
    return cy.get('[role="dialog"] input[type="checkbox"]');
  }

  get repeatOffLabel() {
    return cy.get('[role="dialog"]').contains(/^Repeat off$/i);
  }

  submit() {
    cy.intercept({ method: 'POST', pathname: '/api/schedules' }).as('createSchedule');
    cy.get('[role="dialog"]')
      .contains('button', /^Add schedule$/)
      .click();
    cy.wait('@createSchedule').its('response.statusCode').should('eq', 201);
    return cy.get('[role="dialog"]').should('not.exist');
  }

  cleanup(name) {
    this.visit();
    this.search(name).then(({ response }) => this.deleteSearchResult(name, response));
    this.openUpcoming();
    return this.search(name).then(({ response }) => this.deleteSearchResult(name, response));
  }

  deleteSearchResult(name, response) {
    const { data, totalRows } = response.body.data;
    if (totalRows === 0) {
      return;
    }
    expect(data, 'cleanup hanya satu schedule milik test').to.have.length(1);
    expect(data[0].name).to.eq(name);
    expect(data[0].id, 'ID cleanup').to.be.a('string').and.not.be.empty;
    this.delete(name, data[0].id);
    return this.search(name).then(({ response: afterDelete }) => {
      expect(afterDelete.body.data.totalRows, 'schedule uji sudah dihapus').to.eq(0);
    });
  }

  delete(name, id) {
    cy.intercept({ method: 'DELETE', pathname: `/api/schedules/${id}` }).as('deleteSchedule');
    this.scheduleRow(name).find('button[aria-label^="Delete schedule"]').click();
    cy.get('[role="dialog"]')
      .should('contain.text', `"${name}"`)
      .contains('button', /^Yes, Delete$/)
      .click();
    return cy.wait('@deleteSchedule').its('response.statusCode').should('eq', 204);
  }
}
