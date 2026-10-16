import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { NotificationPage } from '../../pages/notifications/NotificationPage.js';
import { qa } from '../../support/settings.js';

const paginationCases = [
  { page: 1, rowsPerPage: 10 },
  { page: 2, rowsPerPage: 20 },
  { page: 3, rowsPerPage: 50 }
];

describe('EMS notification pagination @notifications', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;

  scenario(
    '[FEAT-011] [TS-011] Admin memvalidasi 10, 20, dan 50 rows pada halaman 1, 2, dan 3',
    () => {
      expect(roles).to.include('admin');
      cy.loginAs('admin');
      new DashboardPage().assertReady();

      const notificationPage = new NotificationPage();
      notificationPage.openFromBell();
      notificationPage.selectAll();
      for (const { page, rowsPerPage } of paginationCases) {
        notificationPage.selectRowsPerPage(rowsPerPage);
        if (page > 1) {
          notificationPage.goToPage(page);
        }

        cy.log(`Halaman ${page}: ${rowsPerPage} notifikasi`);
        notificationPage.rowsPerPage.should('have.value', String(rowsPerPage));
        notificationPage.rows.should('have.length', rowsPerPage);
      }
    }
  );
});
