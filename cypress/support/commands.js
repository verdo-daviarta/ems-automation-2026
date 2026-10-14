import { LoginPage } from '../pages/auth/LoginPage.js';
import { DashboardPage } from '../pages/dashboard/DashboardPage.js';
export { qa } from './settings.js';
Cypress.Commands.add('loginAs', (role) => {
  const loginPage = new LoginPage();
  loginPage.visit();
  cy.env(['credentials'], { log: false }).then((env) => {
    const account = env.credentials[role];
    if (!account) throw new Error(`Akun role ${role} belum dikonfigurasi.`);
    loginPage.fillCredentials(account);
    loginPage.submit();
    new DashboardPage().assertReady();
  });
});
Cypress.Commands.add('logoutEMS', () => {
  const loginPage = new LoginPage();
  new DashboardPage().logout();
  loginPage.assertLoginVisible();
});
