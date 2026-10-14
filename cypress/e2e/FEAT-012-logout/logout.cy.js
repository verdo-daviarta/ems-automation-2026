import { LoginPage } from '../../pages/auth/LoginPage.js';
import { qa } from '../../support/settings.js';
describe('EMS UI authentication — logout @smoke', () => {
  const { contract, roles } = qa();
  const loginPage = new LoginPage();
  for (const role of roles) {
    it(`[FEAT-012] [TS-006] Logout dan akses ulang halaman terlindungi — ${role}`, () => {
      cy.loginAs(role);
      cy.logoutEMS();
      cy.visit(contract.routes.dashboard);
      loginPage.assertLoginVisible();
    });
  }
});
