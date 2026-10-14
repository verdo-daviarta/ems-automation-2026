import { LoginPage } from '../../pages/auth/LoginPage.js';
import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { qa } from '../../support/settings.js';
describe('EMS UI authentication — login @smoke', () => {
  const { roles } = qa();
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();
  for (const role of roles) {
    it(`[FEAT-001] [TS-001] Login valid melalui UI — ${role}`, () => {
      cy.loginAs(role);
    });
  }
  it('[FEAT-001] [TS-002] Field login kosong ditolak', () => {
    loginPage.visit();
    loginPage.submit();
    loginPage.validationError.should('be.visible');
    loginPage.assertLoginVisible();
    dashboardPage.ready.should('not.exist');
  });
});
