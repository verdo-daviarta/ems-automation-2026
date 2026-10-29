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
    cy.contains('button', /^Upcoming schedule$/).click();
    return cy.contains('button', /^Upcoming schedule$/).should('be.disabled');
  }

  search(name) {
    cy.get('input[placeholder="Search..."]').clear().type(name).should('have.value', name);
    return this.scheduleRow(name).should('have.length', 1).and('be.visible');
  }

  scheduleRow(name) {
    return cy
      .get('table tbody td')
      .filter((_, cell) => cell.innerText.trim() === name)
      .closest('tr');
  }

  openAddForm() {
    cy.contains('button', /^Add schedule$/).click();
    return cy.get('[role="dialog"]').should('be.visible');
  }

  fillForm({ name, description, roomName, action, startTime }) {
    this.form.find('input[name="name"]').type(name);
    this.form.find('textarea[name="description"]').type(description);
    this.roomDropdown.should('be.visible').and('be.enabled').select(roomName);
    this.roomDropdown.find('option:selected').should('have.text', roomName);
    this.form.find('select[name="action"]').select(action).should('have.value', action);
    this.form.find('input[name="startTime"]').type(startTime).should('have.value', startTime);
    return this.form.find('button#no-end').click();
  }

  get roomDropdown() {
    return cy.get('[name="roomId"]');
  }

  get form() {
    return cy.get('[role="dialog"] form');
  }

  get noEndOption() {
    return this.form.find('input[type="radio"][value="no-end"]');
  }

  get endTime() {
    return this.form.find('input[name="endTime"]');
  }

  get dialog() {
    return cy.get('[role="dialog"]');
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
    return cy.wait('@createSchedule');
  }

  cleanup(name) {
    expect(name, 'cleanup hanya schedule milik TS-017').to.match(/^QA-TS017-(admin|pj)-\d+$/);
    this.visit();
    this.openUpcoming();
    this.search(name);
    this.delete(name);
    return cy.contains(/^No matching schedule$/).should('be.visible');
  }

  delete(name) {
    cy.intercept({ method: 'DELETE', pathname: '/api/schedules/*' }).as('deleteSchedule');
    this.scheduleRow(name).find('button[aria-label^="Delete schedule"]').click();
    cy.get('[role="dialog"]')
      .should('contain.text', `"${name}"`)
      .contains('button', /^Yes, Delete$/)
      .click();
    return cy.wait('@deleteSchedule').its('response.statusCode').should('eq', 204);
  }
}
