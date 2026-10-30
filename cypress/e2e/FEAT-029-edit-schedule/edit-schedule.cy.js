import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { SchedulePage } from '../../pages/schedules/SchedulePage.js';
import { qa } from '../../support/settings.js';
import { getScheduleStartTime } from '../../support/scheduleTime.js';

describe('EMS edit upcoming schedule @schedules', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  for (const role of roles.filter((role) => ['admin', 'pj'].includes(role))) {
    scenario(`[FEAT-029] [TS-020] Edit description dan start time schedule - ${role}`, () => {
      const testStartedAt = Date.now();
      const schedulePage = new SchedulePage();
      expect(roles).to.include(role);

      cy.loginAs(role);
      new DashboardPage().assertReady();
      schedulePage.openFromMenu();
      schedulePage.openUpcoming();

      schedulePage.getTestScheduleNames(role).then(([name]) => {
        cy.log(`Schedule hasil TS-017 yang diedit: ${name}`);
        schedulePage.openEditForm(name);
        schedulePage.readFormValues().then((original) => {
          const changes = {
            description: 'TS-020 Updated',
            startTime: getScheduleStartTime(testStartedAt, 120)
          };
          const expected = original.map((field) => ({
            ...field,
            value: Object.hasOwn(changes, field.name) ? changes[field.name] : field.value
          }));

          schedulePage.updateDetails(changes);
          schedulePage.saveChanges().then(({ request, response }) => {
            expect(response.statusCode, 'Update Schedule berhasil').to.eq(200);
            const updated = response.body.data;
            expect(updated.id, 'ID Schedule yang diedit').to.be.a('string').and.not.be.empty;
            expect(new URL(request.url).pathname).to.eq(`/api/schedules/${updated.id}`);
            expect(request.body).to.include({ name, ...changes });
            expect(updated).to.include({ name, ...changes });
          });
          schedulePage.dialog.should('not.exist');

          schedulePage.visit();
          schedulePage.openUpcoming();
          schedulePage.search(name);
          schedulePage
            .scheduleRow(name)
            .should('have.length', 1)
            .and('contain.text', changes.startTime);
          schedulePage.openEditForm(name);
          schedulePage.assertFormValues(expected);
          schedulePage.closeForm();
        });
      });
    });
  }
});
