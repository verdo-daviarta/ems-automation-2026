import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { qa } from '../../support/settings.js';

describe('EMS dashboard energy summary @dashboard', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  for (const role of ['admin', 'pj']) {
    scenario(`[FEAT-013] [TS-012] Nilai kWh dan perbandingan energi harian - ${role}`, () => {
      const dashboardPage = new DashboardPage();
      expect(roles).to.include(role);

      dashboardPage.trackEnergySummary();
      cy.loginAs(role);
      dashboardPage.assertReady();
      dashboardPage.waitForEnergySummary();

      dashboardPage.energyUsageCard.should('be.visible');
      dashboardPage.energyUsageUnit.should('be.visible');
      dashboardPage.energyUsageValue.should('be.visible').should(($value) => {
        expect($value.text().trim(), 'nilai kWh ditampilkan').not.to.eq('');
      });
      dashboardPage.energyComparison
        .should('be.visible')
        .invoke('text')
        .should('contain', 'from yesterday');
    });
  }
});
