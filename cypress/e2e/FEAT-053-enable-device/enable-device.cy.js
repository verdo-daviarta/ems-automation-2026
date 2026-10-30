import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { DevicesPage } from '../../pages/devices/DevicesPage.js';
import { DevicePowerControls } from '../../pages/devices/DevicePowerControls.js';
import { qa } from '../../support/settings.js';

describe('EMS enable online Device @devices @hardware', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;
  const devicesPage = new DevicesPage();
  const powerControls = new DevicePowerControls(devicesPage);

  afterEach(function () {
    if (this.currentTest.state === 'failed') {
      powerControls.evidence.resultState = this.currentTest.err?.message?.includes(
        "There's no Device On"
      )
        ? "There's no Device On"
        : 'Failed';
      powerControls.saveEvidence();
    }
    if (this.powerDeviceToRestore) {
      powerControls.restoreInitialOn(this.powerDeviceToRestore);
    }
  });

  for (const role of ['admin', 'pj']) {
    scenario(
      `[FEAT-053] [TS-028] ${role} mengaktifkan Device dan status tetap On setelah reload`,
      () => {
        powerControls.beginRun(role);
        expect(roles).to.include(role);
        devicesPage.trackConnection();
        cy.loginAs(role);
        new DashboardPage().assertReady();
        devicesPage.openFromMenu();

        powerControls.selectOnlineDevice().then((device) => {
          powerControls.startTracking(device);
          cy.then(() => {
            expect(device).to.include({
              status: 'on',
              isOnline: true,
              roomId: null,
              pendingCommand: null
            });
          });
          cy.wrap(device).as('powerDeviceToRestore');

          // Pengguna meminta Device awal On: persiapkan Off sebelum menguji Enable.
          powerControls.changeState(device, 'off', 'setup');
          powerControls.changeState(device, 'on', 'test');
          devicesPage.reload();
          powerControls.assertState(device, 'on').then(() => {
            expect(powerControls.requests.filter((request) => request.phase === 'test')).to.deep.eq(
              [{ phase: 'test', action: 'on' }]
            );
            powerControls.evidence.persistedAfterReload = true;
            return powerControls.saveEvidence();
          });
        });
      }
    );
  }
});
