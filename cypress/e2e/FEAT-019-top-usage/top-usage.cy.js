import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { qa } from '../../support/settings.js';

describe('EMS dashboard Top Usage ranking @dashboard', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  for (const role of ['admin', 'pj', 'komandan']) {
    scenario(`[FEAT-019] [TS-015] Urutan Total usage menurun - ${role}`, () => {
      const dashboardPage = new DashboardPage();
      expect(roles).to.include(role);

      dashboardPage.trackEnergySummary();
      cy.loginAs(role);
      dashboardPage.assertReady();
      dashboardPage.waitForEnergySummary();
      dashboardPage.openFromMenu();
      dashboardPage.assertReady();
      dashboardPage.openTopUsage();

      dashboardPage.topUsageCard.should('be.visible');
      dashboardPage.topUsageTotals.should('have.length.greaterThan', 1).should(($cells) => {
        const totals = [...$cells].map((cell) => {
          const value = cell.textContent
            .trim()
            .replace(/\s*kWh$/, '')
            .replaceAll(',', '');
          expect(value, 'Total usage terisi').not.to.eq('');

          const total = Number(value);
          expect(Number.isFinite(total), 'Total usage berupa angka').to.eq(true);
          return total;
        });

        expect(totals, 'Total usage diurutkan dari tertinggi ke terendah').to.deep.eq(
          [...totals].sort((first, second) => second - first)
        );
      });
    });
  }
});
