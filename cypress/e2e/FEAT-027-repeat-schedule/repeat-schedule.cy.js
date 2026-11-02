import { SchedulePage } from '../../pages/schedules/SchedulePage.js';
import { qa } from '../../support/settings.js';
import { getScheduleRepeatDays } from '../../support/scheduleTime.js';
import {
  assertRepeatScheduleSaved,
  createRepeatSchedule,
  recordResult
} from './repeat-schedule.helpers.js';

describe('EMS repeat schedule @schedules', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  for (const role of roles.filter((role) => ['admin', 'pj'].includes(role))) {
    scenario(`[FEAT-027] [TS-019] ${role} membuat repeat dan menolak jadwal duplikat`, () => {
      const page = new SchedulePage();
      createRepeatSchedule(role).then((schedule) => {
        assertRepeatScheduleSaved(page, schedule);

        const duplicate = { ...schedule, name: `${schedule.name}-dup` };
        page.openAddForm();
        page.fillForm(duplicate);
        page.selectRepeatDays(schedule.repeatDays);
        page.submit().then(({ request, response }) =>
          recordResult(role, 'duplicate', {
            originalId: schedule.id,
            originalName: schedule.name,
            attemptedName: duplicate.name,
            roomId: schedule.roomId,
            repeatDays: request.body.repeatDays,
            startTime: request.body.startTime,
            statusCode: response.statusCode,
            message: response.body?.message ?? response.body?.error?.message,
            unexpectedCreatedId: response.body?.data?.id
          }).then(() => {
            expect(response.statusCode, 'jadwal sama ditolak walaupun nama berbeda').to.eq(409);
            expect(request.body).to.include({
              name: duplicate.name,
              roomId: schedule.roomId,
              action: schedule.action,
              startTime: schedule.startTime,
              repeatType: 'weekly',
              durationConstraint: 'no-end',
              endTime: ''
            });
            expect(request.body.repeatDays).to.deep.eq(schedule.repeatDays);
          })
        );
        page.dialog.should('be.visible');
        cy.contains('[role="status"][aria-live="polite"]', 'Jadwal bentrok dengan schedule lain')
          .should('be.visible')
          .and('contain.text', schedule.id);
        page.closeForm();
        assertRepeatScheduleSaved(page, schedule);
        page.assertScheduleMissing(duplicate.name);
      });
    });

    scenario(`[FEAT-027] [TS-019] ${role} mengedit data repeat baru yang terpisah`, () => {
      const page = new SchedulePage();
      createRepeatSchedule(role, 'edit', [3]).then((schedule) => {
        assertRepeatScheduleSaved(page, schedule);
        const updated = {
          ...schedule,
          description: 'TS-019 Updated',
          repeatDays: getScheduleRepeatDays(schedule.startedAt, [3, 4])
        };
        page.openEditForm(schedule.name);
        page.descriptionInput.clear().type(updated.description);
        page.setRepeatDays(updated.repeatDays);
        page.saveChanges().then(({ request, response }) =>
          recordResult(role, 'edit', { ...updated, updateStatus: response.statusCode }).then(() => {
            expect(response.statusCode, 'repeat Schedule berhasil diubah').to.eq(200);
            expect(new URL(request.url).pathname).to.eq(`/api/schedules/${schedule.id}`);
            expect(response.body.data).to.include({
              id: schedule.id,
              name: schedule.name,
              description: updated.description,
              repeatType: 'weekly'
            });
            expect(request.body.repeatDays).to.deep.eq(updated.repeatDays);
            expect(response.body.data.repeatDays).to.deep.eq(updated.repeatDays);
          })
        );
        page.dialog.should('not.exist');
        assertRepeatScheduleSaved(page, updated);
      });
    });

    scenario(`[FEAT-027] [TS-019] ${role} menghapus data repeat baru yang terpisah`, () => {
      const page = new SchedulePage();
      createRepeatSchedule(role, 'delete', [5, 6]).then((schedule) => {
        assertRepeatScheduleSaved(page, schedule);
        cy.intercept({ method: 'DELETE', pathname: `/api/schedules/${schedule.id}` }).as(
          'deleteRepeatSchedule'
        );
        page.openDeleteConfirmation(schedule.name);
        page.confirmDelete(schedule.name);
        cy.wait('@deleteRepeatSchedule').then(({ response }) =>
          recordResult(role, 'delete', { ...schedule, deleteStatus: response.statusCode }).then(
            () => {
              expect(response.statusCode, 'repeat Schedule khusus Delete terhapus').to.eq(204);
            }
          )
        );
        page.dialog.should('not.exist');
        page.visit();
        page.openUpcoming();
        page.assertScheduleMissing(schedule.name);
      });
    });
  }
});
