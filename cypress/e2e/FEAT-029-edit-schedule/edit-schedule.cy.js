import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { SchedulePage } from '../../pages/schedules/SchedulePage.js';
import { qa } from '../../support/settings.js';
import { getScheduleStartTime } from '../../support/scheduleTime.js';

function createScheduleForEditing(schedulePage, schedule) {
  schedulePage.openAddForm();
  schedulePage.fillForm(schedule);
  schedulePage.noEndOption.should('be.checked');
  schedulePage.repeatToggle.should('not.be.checked');
  return schedulePage
    .submit()
    .then((interception) => {
      if (interception.response.statusCode >= 200 && interception.response.statusCode < 300) {
        cy.wrap(schedule.name, { log: false }).as('scheduleToClean');
      }
      return cy.wrap(interception, { log: false });
    })
    .then((interception) => {
      expect(interception.response.statusCode, 'setup schedule dari flow TS-017').to.eq(201);
      return interception;
    });
}

describe('EMS edit upcoming schedule @schedules', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  afterEach(function () {
    if (this.scheduleToClean) {
      new SchedulePage().cleanup(this.scheduleToClean);
    }
  });

  for (const role of ['admin', 'pj']) {
    scenario(`[FEAT-029] [TS-020] Edit description dan start time schedule - ${role}`, () => {
      const testStartedAt = Date.now();
      const schedulePage = new SchedulePage();
      expect(roles).to.include(role);

      cy.fixture('schedules/non-repeat').then((data) => {
        const schedule = {
          ...data,
          name: `QA-TS017-${role}-${testStartedAt}`,
          action: 'on',
          startTime: getScheduleStartTime(testStartedAt)
        };
        const changes = {
          description: 'TS-020 Updated',
          startTime: getScheduleStartTime(testStartedAt, 120)
        };
        let originalPayload;
        let scheduleId;

        cy.loginAs(role);
        new DashboardPage().assertReady();
        schedulePage.openFromMenu();

        // Prasyarat: buat schedule dengan flow TS-017 agar test dapat berjalan sendiri.
        createScheduleForEditing(schedulePage, schedule).then(({ request, response }) => {
          originalPayload = request.body;
          scheduleId = response.body.data.id;
          expect(scheduleId, 'ID schedule uji').to.be.a('string').and.not.be.empty;
        });
        schedulePage.dialog.should('not.exist');

        schedulePage.openUpcoming();
        schedulePage.search(schedule.name);
        schedulePage.openEditForm(schedule.name);
        schedulePage.updateDetails(changes);
        schedulePage.saveChanges().then(({ request, response }) => {
          expect(response.statusCode, 'update berhasil').to.eq(200);
          expect(new URL(request.url).pathname).to.eq(`/api/schedules/${scheduleId}`);
          expect(request.body, 'hanya description dan startTime yang berubah').to.deep.eq({
            ...originalPayload,
            ...changes
          });
          expect(response.body.data).to.include({ id: scheduleId, ...changes });
        });
        schedulePage.dialog.should('not.exist');

        schedulePage.visit();
        schedulePage.openUpcoming();
        schedulePage.search(schedule.name);
        schedulePage
          .scheduleRow(schedule.name)
          .should('have.length', 1)
          .and('contain.text', schedule.roomName)
          .and('contain.text', changes.startTime);
        schedulePage.openEditForm(schedule.name);
        schedulePage.descriptionInput.should('have.value', changes.description);
        schedulePage.startTimeInput.should('have.value', changes.startTime);
        schedulePage.closeForm();
      });
    });
  }
});
