import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { SchedulePage } from '../../pages/schedules/SchedulePage.js';
import { qa } from '../../support/settings.js';
import { getScheduleStartTime } from '../../support/scheduleTime.js';
import { formatTestTimestamp } from '../../support/testDataTime.js';

describe('EMS create non-repeat schedule @schedules', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  for (const role of roles.filter((role) => ['admin', 'pj'].includes(role))) {
    scenario(`[FEAT-024] [TS-017] ${role} membuat schedule dengan Repeat Off`, () => {
      const testStartedAt = Date.now();
      expect(roles).to.include(role);
      const schedulePage = new SchedulePage();

      cy.loginAs(role);
      new DashboardPage().assertReady();
      schedulePage.openFromMenu();
      schedulePage.openAddForm();

      cy.fixture('schedules/non-repeat')
        .then((data) => {
          expect(data.roomNamePrefix, 'prefix Room hasil TS-025').to.be.a('string').and.not.be
            .empty;
          return schedulePage
            .getLatestRoomName(data.roomNamePrefix)
            .then((roomName) => ({ ...data, roomName }));
        })
        .then((data) => {
          const schedule = {
            ...data,
            name: `QA-TS017-${role}-${formatTestTimestamp(testStartedAt)}`,
            action: 'on',
            startTime: getScheduleStartTime(testStartedAt)
          };
          schedulePage.fillForm(schedule);

          schedulePage.noEndOption.should('be.checked');
          schedulePage.endTime.should('have.value', '').and('have.attr', 'readonly');
          schedulePage.repeatToggle.should('not.be.checked');
          schedulePage.repeatOffLabel.should('be.visible');

          schedulePage.submit().then(({ response }) => {
            const message =
              response.body?.message ?? response.body?.error?.message ?? 'Add schedule';
            expect(response.statusCode, message).to.eq(201);
          });
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
