import type { Credential, Role } from '../../shared/types';
import { LoginPage } from '../pages/auth/LoginPage';

export { qa } from './settings';

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(role: Role): Chainable<void>;
      logoutEMS(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginAs', (role: Role) => {
  const loginPage = new LoginPage();
  loginPage.visit();
  cy.env(['credentials'], { log: false }).then(env => {
    const account = (env.credentials as Record<Role, Credential>)[role];
    if (!account) throw new Error(`Akun role ${role} belum dikonfigurasi.`);
    loginPage.fillCredentials(account);
    loginPage.submit();
    loginPage.assertDashboardReady();
  });
});

Cypress.Commands.add('logoutEMS', () => {
  const loginPage = new LoginPage();
  loginPage.logout();
  loginPage.assertLoginVisible();
});
