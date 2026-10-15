import { LoginPage } from '../../pages/auth/LoginPage.js';
import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { qa } from '../../support/settings.js';

describe('EMS UI authentication — login @smoke', () => {
  const { roles } = qa();

  for (const role of roles) {
    it(`[FEAT-001] [TS-001] Login valid melalui UI — ${role}`, () => {
      cy.loginAs(role);
      new DashboardPage().assertReady();
    });
  }

  it('[FEAT-001] [TS-002] Field login kosong ditolak', () => {
    const loginPage = new LoginPage();
    const dashboardPage = new DashboardPage();

    loginPage.visit();
    loginPage.submit();

    loginPage.validationError.should('be.visible');
    loginPage.assertLoginVisible();
    dashboardPage.ready.should('not.exist');
  });
});
