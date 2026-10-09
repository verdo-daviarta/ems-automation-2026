import { test, expect } from '../../fixtures/ems';

for (const width of [320, 768, 1280]) {
  test(`[TS-071] [CROSS-RESP] Login dapat digunakan tanpa overflow pada ${width} px`, async ({ page, settings }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(settings.contract.routes.login);
    for (const selector of [settings.contract.selectors.email, settings.contract.selectors.password, settings.contract.selectors.submit]) {
      await expect(page.locator(selector)).toBeVisible();
      await expect(page.locator(selector)).toBeInViewport();
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
