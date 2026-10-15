import { LoginPage } from '../../pages/auth/LoginPage.js';
import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { qa } from '../../support/settings.js';

describe('EMS UI authentication — logout @smoke', () => {
  const { contract, roles } = qa();

  for (const role of roles) {
    it(`[FEAT-012] [TS-006] Logout dan akses ulang halaman terlindungi — ${role}`, () => {
      const loginPage = new LoginPage();
      const dashboardPage = new DashboardPage();

      cy.loginAs(role);
      dashboardPage.assertReady();

      dashboardPage.logout();
      loginPage.assertLoginVisible();

      cy.visit(contract.routes.dashboard);

      loginPage.assertLoginVisible();
    });
  }
});
