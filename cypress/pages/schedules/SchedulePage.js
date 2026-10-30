import { qa } from '../../support/settings.js';
import { getLatestTestRoomName } from '../../support/latestTestRoom.js';

const testSchedulePattern = /^QA-TS017-(admin|pj)-(?:\d{8}-\d{6}|\d{13})$/;

function formValues(fields) {
  return fields.toArray().map((field) => ({
    name: field.name,
    type: field.type,
    value: field.value,
    ...(['checkbox', 'radio'].includes(field.type) ? { checked: field.checked } : {})
  }));
}

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

  getTestScheduleNames(role) {
    const prefix = `QA-TS017-${role}-`;
    this.searchInput.clear().type(prefix).should('have.value', prefix);
    let names;
    return cy
      .get('body')
      .should(($body) => {
        names = $body
          .find('table tbody td')
          .toArray()
          .map((cell) => cell.innerText.trim())
          .filter((name) => name.startsWith(prefix) && testSchedulePattern.test(name));
        expect(
          names.length,
          `Schedule hasil TS-017 untuk ${role} tersedia di Upcoming`
        ).to.be.greaterThan(0);
      })
      .then(() => names);
  }

  get searchInput() {
    return cy.get('input[placeholder="Search..."]');
  }

  openEditForm(name) {
    this.scheduleRow(name).find('button[aria-label^="Edit schedule"]').click();
    return this.dialog.contains('h2', /^Edit schedule$/).should('be.visible');
  }

  updateDetails({ description, startTime }) {
    this.descriptionInput.clear().type(description).should('have.value', description);
    return this.startTimeInput.clear().type(startTime).should('have.value', startTime);
  }

  saveChanges() {
    cy.intercept({ method: 'PUT', pathname: '/api/schedules/*' }).as('updateSchedule');
    this.dialog.contains('button', /^Update schedule$/).click();
    return cy.wait('@updateSchedule');
  }

  closeForm() {
    return this.dialog.find('button[aria-label="Close"]').click();
  }

  get descriptionInput() {
    return this.form.find('textarea[name="description"]');
  }

  get startTimeInput() {
    return this.form.find('input[name="startTime"]');
  }

  readFormValues() {
    return this.form.find('input, select, textarea').then(formValues);
  }

  assertFormValues(expected) {
    return this.form.find('input, select, textarea').should(($fields) => {
      expect(formValues($fields), 'hanya field yang diminta berubah').to.deep.eq(expected);
    });
  }

  fillForm({ name, description, roomName, action, startTime }) {
    cy.log(`Room untuk Schedule: ${roomName}`);
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

  getLatestRoomName(prefix) {
    return this.roomDropdown
      .find('option')
      .filter((_, option) => option.value && option.text.startsWith(prefix))
      .should(($options) => {
        expect($options.length, `Room hasil TS-025 dengan prefix ${prefix}`).to.be.greaterThan(0);
      })
      .then(($options) =>
        getLatestTestRoomName(
          $options.toArray().map((option) => option.text),
          prefix
        )
      );
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

  openDeleteConfirmation(name) {
    expect(name, 'hapus hanya Schedule uji hasil TS-017').to.match(testSchedulePattern);
    this.scheduleRow(name)
      .find('button[aria-label^="Delete schedule"]')
      .should('be.visible')
      .and('be.enabled')
      .click();
    return this.dialog.should('be.visible').and('contain.text', `"${name}"`);
  }

  cancelDelete() {
    this.dialog.contains('button', /^No, cancel$/).click();
    return this.dialog.should('not.exist');
  }

  confirmDelete(name) {
    return this.dialog
      .should('contain.text', `"${name}"`)
      .contains('button', /^Yes, Delete$/)
      .click();
  }

  assertScheduleMissing(name) {
    this.searchInput.clear().type(name).should('have.value', name);
    return cy.contains(/^No matching schedule$/).should('be.visible');
  }
}
