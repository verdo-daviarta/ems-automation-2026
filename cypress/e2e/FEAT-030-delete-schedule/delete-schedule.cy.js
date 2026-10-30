import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { SchedulePage } from '../../pages/schedules/SchedulePage.js';
import { qa } from '../../support/settings.js';

describe('EMS delete Schedule with confirmation @schedules', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  for (const role of roles.filter((role) => ['admin', 'pj'].includes(role))) {
    scenario(`[FEAT-030] [TS-021] ${role} membatalkan lalu mengonfirmasi Delete Schedule`, () => {
      const schedulePage = new SchedulePage();
      const writes = [];
      expect(roles).to.include(role);

      cy.loginAs(role);
      new DashboardPage().assertReady();
      schedulePage.openFromMenu();
      schedulePage.openUpcoming();

      schedulePage.getTestScheduleNames(role).then(([name, ...otherNames]) => {
        cy.log(`Schedule hasil TS-017 yang dihapus: ${name}`);
        const artifactPath = `reports/runs/${qa().runId}/ts021-${role}-schedule.json`;
        cy.writeFile(artifactPath, { name, otherNames }, { log: false });
        schedulePage.search(name);
        cy.intercept({ pathname: '/api/schedules/*' }, (request) => {
          if (['DELETE', 'PUT', 'PATCH'].includes(request.method)) {
            writes.push({ method: request.method, path: new URL(request.url).pathname });
          }
          if (request.method === 'DELETE') request.alias = 'deleteSchedule';
        });

        schedulePage.openDeleteConfirmation(name);
        schedulePage.cancelDelete();
        cy.then(() => expect(writes, 'Cancel tidak mengirim perubahan Schedule').to.be.empty);
        schedulePage.visit();
        schedulePage.openUpcoming();
        schedulePage.search(name);
        schedulePage.scheduleRow(name).should('have.length', 1).and('be.visible');

        schedulePage.openDeleteConfirmation(name);
        schedulePage.confirmDelete(name);
        cy.wait('@deleteSchedule').then(({ request, response }) => {
          expect(response.statusCode, 'Schedule terhapus').to.eq(204);
          expect(writes, 'satu DELETE setelah Confirm').to.deep.eq([
            { method: 'DELETE', path: new URL(request.url).pathname }
          ]);
          return cy.writeFile(
            artifactPath,
            {
              name,
              otherNames,
              cancelSentNoWrites: true,
              deleteStatus: response.statusCode,
              deletePath: new URL(request.url).pathname
            },
            { log: false }
          );
        });
        schedulePage.dialog.should('not.exist');
        schedulePage.assertScheduleMissing(name);
        schedulePage.visit();
        schedulePage.openUpcoming();
        schedulePage.assertScheduleMissing(name);

        for (const otherName of otherNames) {
          schedulePage.search(otherName);
          schedulePage.scheduleRow(otherName).should('be.visible');
        }
      });
    });
  }
});
