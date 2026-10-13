import { LoginPage } from '../../pages/auth/LoginPage.js';
import { qa } from '../../support/settings.js';
describe('EMS UI authentication — login @smoke', () => {
  const { roles } = qa();
  const loginPage = new LoginPage();
  for (const role of roles) {
    it(`[TS-001] [FEAT-001] Login valid melalui UI — ${role}`, () => {
      cy.loginAs(role);
    });
  }
  it('[TS-002] [FEAT-001] Field login kosong ditolak', () => {
    loginPage.visit();
    loginPage.submit();
    loginPage.validationError.should('be.visible');
    loginPage.assertLoginVisible();
    loginPage.dashboardReady.should('not.exist');
  });
});
