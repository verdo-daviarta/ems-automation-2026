import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { SchedulePage } from '../../pages/schedules/SchedulePage.js';
import { qa } from '../../support/settings.js';
import { getScheduleRepeatDays, getScheduleStartTime } from '../../support/scheduleTime.js';
import { formatTestTimestamp } from '../../support/testDataTime.js';

export function recordResult(role, purpose, data) {
  return cy.writeFile(`reports/runs/${qa().runId}/ts019-${role}-${purpose}.json`, data);
}

export function createRepeatSchedule(role, purpose = 'create', dayOffsets = [1, 2]) {
  const startedAt = Date.now();
  const page = new SchedulePage();
  cy.loginAs(role);
  new DashboardPage().assertReady();
  page.openFromMenu();
  page.openAddForm();

  return cy.fixture('schedules/repeat').then((data) =>
    page.getLatestRoomName(data.roomNamePrefix).then((roomName) => {
      const schedule = {
        name: `QA-TS019-${role}-${formatTestTimestamp(startedAt)}${purpose === 'create' ? '' : `-${purpose}`}`,
        description: data.description,
        roomName,
        action: 'on',
        startTime: getScheduleStartTime(startedAt),
        repeatDays: getScheduleRepeatDays(startedAt, dayOffsets),
        startedAt
      };
      page.fillForm(schedule);
      page.form.find('button[role="radio"]').should('have.length', 2);
      page.noEndOption.should('be.checked');
      page.endTime.should('have.value', '').and('have.attr', 'readonly');
      page.selectRepeatDays(schedule.repeatDays);

      return page.roomDropdown.invoke('val').then((roomId) =>
        page.submit().then(({ request, response }) => {
          const created = response.body?.data;
          const result = { ...schedule, roomId, id: created?.id };
          return recordResult(role, purpose, { ...result, createStatus: response.statusCode }).then(
            () => {
              const message =
                response.body?.message ?? response.body?.error?.message ?? 'Add repeat schedule';
              expect(response.statusCode, message).to.eq(201);
              expect(created.id, 'ID Schedule').to.be.a('string').and.not.be.empty;
              const expected = {
                name: schedule.name,
                description: schedule.description,
                roomId,
                action: schedule.action,
                startTime: schedule.startTime,
                repeatType: 'weekly'
              };
              expect(request.body).to.include({
                ...expected,
                durationConstraint: 'no-end',
                endTime: ''
              });
              expect(created).to.include(expected);
              expect(request.body.repeatDays).to.deep.eq(schedule.repeatDays);
              expect(created.repeatDays).to.deep.eq(schedule.repeatDays);
              expect(created.endTime, 'No end tersimpan').to.eq(null);
              page.dialog.should('not.exist');
              return cy.wrap(result);
            }
          );
        })
      );
    })
  );
}

export function assertRepeatScheduleSaved(page, schedule) {
  page.visit();
  page.openUpcoming();
  page.search(schedule.name);
  page
    .scheduleRow(schedule.name)
    .should('have.length', 1)
    .and('contain.text', schedule.roomName)
    .and('contain.text', schedule.startTime);
  page.openEditForm(schedule.name);
  page.form.find('input[name="name"]').should('have.value', schedule.name);
  page.descriptionInput.should('have.value', schedule.description);
  page.roomDropdown.should('have.value', schedule.roomId);
  page.form.find('select[name="action"]').should('have.value', schedule.action);
  page.startTimeInput.should('have.value', schedule.startTime);
  page.noEndOption.should('be.checked');
  page.endTime.should('have.value', '').and('have.attr', 'readonly');
  page.assertRepeatDays(schedule.repeatDays);
  return page.closeForm();
}
