import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { SchedulePage } from '../../pages/schedules/SchedulePage.js';
import { qa } from '../../support/settings.js';

describe('EMS create non-repeat schedule @schedules', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  afterEach(function () {
    if (this.scheduleToClean) {
      new SchedulePage().cleanup(this.scheduleToClean);
    }
  });

  for (const role of ['pj', 'admin']) {
    scenario(`[FEAT-024] [TS-017] ${role} membuat schedule dengan Repeat Off`, () => {
      expect(roles).to.include(role);
      const schedulePage = new SchedulePage();

      cy.loginAs(role);
      new DashboardPage().assertReady();
      schedulePage.openFromMenu();
      schedulePage.openAddForm();

      cy.fixture('schedules/non-repeat').then((data) => {
        expect(data.roomName, 'Isi roomName pada fixtures/schedules/non-repeat.json').to.be.a(
          'string'
        ).and.not.be.empty;
        expect(
          data.startTime,
          'Isi startTime HH:mm pada fixtures/schedules/non-repeat.json'
        ).to.match(/^([01]\d|2[0-3]):[0-5]\d$/);
        const schedule = { ...data, name: `QA-TS017-${role}-${Date.now()}` };
        schedulePage.fillForm(schedule);

        schedulePage.repeatToggle.should('not.be.checked');
        schedulePage.repeatOffLabel.should('be.visible');

        cy.wrap(schedule.name, { log: false }).as('scheduleToClean');
        schedulePage.submit();
        schedulePage.openUpcoming();
        schedulePage.search(schedule.name);

        schedulePage
          .scheduleRow(schedule.name)
          .should('have.length', 1)
          .and('be.visible')
          .and('contain.text', schedule.roomName)
          .and('contain.text', schedule.startTime);
      });
    });
  }
});
