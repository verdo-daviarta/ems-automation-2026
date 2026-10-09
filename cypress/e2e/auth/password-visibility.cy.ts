import { LoginPage } from '../../pages/auth/LoginPage';

describe('EMS UI authentication — password visibility @smoke', () => {
  const loginPage = new LoginPage();

  it('[TS-072] [FEAT-002] Password disembunyikan, ditampilkan, lalu disembunyikan kembali', () => {
    const probe = 'VisibilityProbe!123';
    loginPage.visit();
    loginPage.passwordField.type(probe, { log: false }).should('have.attr', 'type', 'password');
    loginPage.togglePasswordVisibility();
    loginPage.passwordField.should('have.attr', 'type', 'text').and('have.value', probe);
    loginPage.togglePasswordVisibility();
    loginPage.passwordField.should('have.attr', 'type', 'password').and('have.value', probe);
  });
});
