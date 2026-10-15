import { test, expect } from '../../fixtures/ems.js';
import { LoginPage } from '../../pages/auth/LoginPage.js';
import { expectNoHorizontalOverflow } from '../../support/layout.js';

for (const width of [320, 768, 1280]) {
  test(`[TS-071] [CROSS-RESP] Login dapat digunakan tanpa overflow pada ${width} px`, async ({
    page,
    settings
  }) => {
    const loginPage = new LoginPage(page, settings);

    await page.setViewportSize({ width, height: 800 });
    await loginPage.visit();

    for (const control of [
      loginPage.identifierField,
      loginPage.passwordField,
      loginPage.submitButton
    ]) {
      await expect(control).toBeVisible();
      await expect(control).toBeInViewport();
    }

    await expectNoHorizontalOverflow(page);
  });
}
