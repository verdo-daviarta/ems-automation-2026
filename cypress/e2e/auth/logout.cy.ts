import { LoginPage } from '../../pages/auth/LoginPage';
import { qa } from '../../support/settings';

describe('EMS UI authentication — logout @smoke', () => {
  const { contract, roles } = qa();
  const loginPage = new LoginPage();

  for (const role of roles) {
    it(`[TS-006] [FEAT-012] Logout dan akses ulang halaman terlindungi — ${role}`, () => {
      cy.loginAs(role);
      cy.logoutEMS();
      cy.visit(contract.routes.dashboard);
      loginPage.assertLoginVisible();
    });
  }
});
