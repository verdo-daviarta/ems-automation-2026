import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { SchedulePage } from '../../pages/schedules/SchedulePage.js';
import { qa } from '../../support/settings.js';
import { getScheduleStartTime } from '../../support/scheduleTime.js';

describe('EMS create non-repeat schedule @schedules', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  afterEach(function () {
    if (this.scheduleToClean) {
      new SchedulePage().cleanup(this.scheduleToClean);
    }
  });

  for (const role of ['admin', 'pj']) {
    scenario(`[FEAT-024] [TS-017] ${role} membuat schedule dengan Repeat Off`, () => {
      const testStartedAt = Date.now();
      expect(roles).to.include(role);
      const schedulePage = new SchedulePage();

      cy.loginAs(role);
      new DashboardPage().assertReady();
      schedulePage.openFromMenu();
      schedulePage.openAddForm();

      cy.fixture('schedules/non-repeat').then((data) => {
        expect(data.roomName, 'Nama Room yang tersedia di dropdown Schedule').to.be.a('string').and
          .not.be.empty;
        const schedule = {
          ...data,
          name: `QA-TS017-${role}-${testStartedAt}`,
          action: 'on',
          startTime: getScheduleStartTime(testStartedAt)
        };
        schedulePage.fillForm(schedule);

        schedulePage.noEndOption.should('be.checked');
        schedulePage.endTime.should('have.value', '').and('have.attr', 'readonly');
        schedulePage.repeatToggle.should('not.be.checked');
        schedulePage.repeatOffLabel.should('be.visible');

        schedulePage
          .submit()
          .then(({ response }) => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
              cy.wrap(schedule.name, { log: false }).as('scheduleToClean');
            }
            return cy.wrap(response.statusCode, { log: false });
          })
          .should('eq', 201);
        schedulePage.dialog.should('not.exist');
        schedulePage.visit();
        schedulePage.openUpcoming();
        schedulePage.search(schedule.name);

        schedulePage
          .scheduleRow(schedule.name)
          .should('have.length', 1)
          .and('be.visible')
          .and('contain.text', schedule.startTime)
          .and('contain.text', schedule.roomName);
      });
    });
  }
});
