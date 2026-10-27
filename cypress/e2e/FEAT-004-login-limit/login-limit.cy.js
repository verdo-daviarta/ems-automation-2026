import { LoginPage } from '../../pages/auth/LoginPage.js';
import { qa } from '../../support/settings.js';

const lockToastMessage =
  /^Akun terkunci\. Silakan coba lagi (0[1-9]|[12]\d|3[01]) [A-Za-z]{3} \d{4}, ([01]\d|2[0-3])[0-5]\d$/;
const toastSelector = '[role="status"][aria-live="polite"]';

function assertLockedToast() {
  let lastObservedMessage = 'toast belum muncul';

  cy.get('body').should(($body) => {
    const visibleMessages = $body
      .find(toastSelector)
      .filter(':visible')
      .toArray()
      .map((toast) => toast.textContent.trim());

    if (visibleMessages.length) {
      lastObservedMessage = visibleMessages[0];
    }

    expect(
      visibleMessages.some((message) => lockToastMessage.test(message)),
      lastObservedMessage
    ).to.be.false;
  });
}

function submitInvalidLogin(loginPage, account, wrongPassword, attempt) {
  loginPage.fillCredentials({ email: account.email, password: wrongPassword });
  loginPage.submit();

  cy.wait('@loginAttempt', { log: false }).then(({ response }) => {
    expect(response, `respons login ke-${attempt}`).to.exist;
  });
  loginPage.assertLoginVisible();
}

describe('EMS login limitation @rate-limit', () => {
  const { target, contract, rateLimitRunEnabled } = qa();
  const scenario = rateLimitRunEnabled || Cypress.config('isInteractive') ? it : it.skip;

  scenario('[FEAT-004] [TS-004] Akun komandan terkunci setelah >20 password salah', () => {
    const loginPage = new LoginPage();
    const { rateLimit } = contract;

    expect(rateLimit.attemptsBeforeLockCheck).to.be.greaterThan(20);
    if (target === 'staging') {
      expect(rateLimit.role).to.equal('komandan');
    }

    cy.env(['rateLimitAccount'], { log: false }).then(({ rateLimitAccount }) => {
      if (!rateLimitAccount) {
        throw new Error('Akun untuk TS-004 belum dikonfigurasi.');
      }

      const wrongPassword = `WrongForTS004!${Date.now()}`;
      if (wrongPassword === rateLimitAccount.password) {
        throw new Error('Password salah yang dibuat ternyata sama dengan password akun.');
      }

      cy.intercept({ method: 'POST', pathname: rateLimit.requestPath }).as('loginAttempt');
      loginPage.visit();

      for (let attempt = 1; attempt <= rateLimit.attemptsBeforeLockCheck; attempt++) {
        submitInvalidLogin(loginPage, rateLimitAccount, wrongPassword, attempt);

        if (attempt === 20) {
          cy.get(toastSelector)
            .first()
            .should('be.visible')
            .invoke('text')
            .should('match', /Akun terkunci|Terlalu banyak percobaan login/i);
        }
      }

      assertLockedToast();
    });
  });
});
