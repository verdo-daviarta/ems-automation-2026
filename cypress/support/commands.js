import { LoginPage } from '../pages/auth/LoginPage.js';

Cypress.Commands.add('loginAs', (role) => {
  const loginPage = new LoginPage();
  loginPage.visit();

  cy.env(['credentials'], { log: false }).then(({ credentials }) => {
    const account = credentials[role];
    if (!account) {
      throw new Error(`Akun role ${role} belum dikonfigurasi.`);
    }

    loginPage.fillCredentials(account);
    loginPage.submit();
  });
});
