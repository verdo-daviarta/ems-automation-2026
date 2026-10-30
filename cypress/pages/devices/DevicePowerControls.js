import { qa } from '../../support/settings.js';

export class DevicePowerControls {
  constructor(devicesPage) {
    this.devicesPage = devicesPage;
  }

  beginRun(role) {
    this.requests = [];
    this.lastCommand = null;
    this.artifactPath = `reports/runs/${qa().runId}/ts028-${role}-device-power.json`;
    this.evidence = {
      testId: 'TS-028',
      role,
      target: qa().target,
      buildId: qa().buildId,
      device: null,
      commands: [],
      restoredToInitialOn: false
    };
    return this.saveEvidence();
  }

  selectOnlineDevice() {
    cy.get('body').should(($body) => {
      const devicesOn = $body.find(
        'table button[role="switch"][aria-checked="true"][aria-busy="false"]'
      );
      if (devicesOn.length === 0) {
        throw new Error("There's no Device On");
      }
    });
    return cy.get('table th').then(($headers) => {
      const headers = $headers.toArray().map((header) => header.innerText.trim());
      const roomColumn = headers.indexOf('Room');
      const deviceColumn = headers.indexOf('Device');
      expect(roomColumn, 'kolom Room').to.be.at.least(0);
      expect(deviceColumn, 'kolom Device').to.be.at.least(0);
      return cy
        .get('table tbody tr')
        .filter((_, row) => {
          const toggle = row.querySelector('button[role="switch"]');
          return (
            row.cells[roomColumn].innerText.trim() === '-' &&
            toggle &&
            !toggle.disabled &&
            toggle.getAttribute('aria-checked') === 'true' &&
            toggle.getAttribute('aria-busy') === 'false'
          );
        })
        .should(($rows) => {
          expect(
            $rows.length,
            'Device On, online, tanpa Room dan tanpa command pending tersedia'
          ).to.be.greaterThan(0);
        })
        .first()
        .then(($row) => {
          const eui = $row[0].cells[deviceColumn].innerText.trim().split('\n').pop().trim();
          const name = $row.find('button[aria-label^="View "]').attr('aria-label').slice(5);
          this.evidence.device = { eui, name };
          cy.log(`[TS-028] ${this.evidence.role} | Device EUI: ${eui} | ${name}`);
          this.saveEvidence();
          return this.readDevice(eui);
        });
    });
  }

  readDevice(eui) {
    return this.devicesPage
      .deviceRow(eui)
      .find('button[aria-label^="View "]')
      .invoke('attr', 'aria-label')
      .then((label) => {
        cy.intercept({ method: 'GET', pathname: '/api/devices/*' }).as('powerDeviceDetails');
        // Query baru dari label stabil, agar tidak membawa elemen dari tabel sebelum re-render.
        cy.get(`button[aria-label="${CSS.escape(label)}"]`)
          .should(($button) => expect($button[0].onclick, 'handler View siap').to.be.a('function'))
          .click();
        return cy.wait('@powerDeviceDetails').then(({ response }) => {
          expect(response.statusCode, 'baca status Device').to.eq(200);
          const data = response.body.data;
          const device = {
            id: data.id,
            name: data.name,
            eui: data.eui,
            roomId: data.roomId,
            status: data.status,
            isOnline: data.isOnline,
            pendingCommand: data.pendingCommand
          };
          expect(device.eui, 'EUI detail sesuai Device yang dipilih').to.eq(eui);
          this.devicesPage.dialog.should('be.visible');
          // Label ini masih menyebut gateway pada UI detail Device staging.
          return this.devicesPage.dialog
            .find('button[aria-label="Close gateway detail"]')
            .click()
            .then(() => device);
        });
      });
  }

  startTracking(device) {
    this.evidence.device = {
      id: device.id,
      eui: device.eui,
      name: device.name,
      initialStatus: device.status
    };
    this.saveEvidence();
    cy.intercept({ method: 'POST', pathname: `/api/devices/${device.id}/power` }, (request) => {
      this.requests.push({ phase: this.phase, action: request.body.action });
    }).as('devicePowerCommand');
  }

  powerToggle(eui, timeout = Cypress.config('defaultCommandTimeout')) {
    return this.devicesPage.deviceRow(eui).find('button[role="switch"]', { timeout });
  }

  commandTimeout(command) {
    const remaining = Date.parse(command?.deadline) - Date.now();
    // Tunggu konfirmasi sesuai deadline server, maksimum dua menit per command.
    return Number.isFinite(remaining)
      ? Math.max(1000, Math.min(120000, remaining + 1000))
      : Cypress.config('defaultCommandTimeout');
  }

  changeState(device, action, phase) {
    cy.then(() => {
      this.phase = phase;
    });
    this.powerToggle(device.eui)
      .should('be.visible')
      .and('be.enabled')
      .and('have.attr', 'aria-busy', 'false')
      .and('have.attr', 'aria-checked', action === 'on' ? 'false' : 'true')
      .should(($button) => expect($button[0].onclick, 'handler toggle siap').to.be.a('function'))
      .click();
    this.devicesPage.dialog.should('be.visible').and('contain.text', `"${device.name}"`);
    this.devicesPage.dialog
      .contains('button', new RegExp(`^Yes, Turn ${action} device$`, 'i'))
      .should('be.enabled')
      .click();

    return cy.wait('@devicePowerCommand').then(({ request, response }) => {
      const { commandId, deviceId, action: commandAction, status, deadline } = response.body.data;
      const command = { commandId, deviceId, action: commandAction, status, deadline };
      const record = { phase, ...command, httpStatus: response.statusCode };
      this.lastCommand = command;
      this.evidence.commands.push(record);
      return this.saveEvidence().then(() => {
        expect(response.statusCode, 'command diterima').to.be.within(200, 299);
        expect(request.body).to.deep.eq({ action });
        expect(commandAction, 'aksi command sesuai permintaan').to.eq(action);
        expect(commandId, 'ID command').to.be.a('string').and.not.be.empty;
        expect(deviceId, 'command untuk Device yang dipilih').to.eq(device.id);
        expect(status, 'command diterima atau selesai').to.be.oneOf(['pending', 'success']);
        return this.assertState(device, action, this.commandTimeout(command)).then(() => {
          expect(
            this.requests.filter((request) => request.phase === phase),
            'satu request per fase'
          ).to.have.length(1);
          record.confirmedState = action;
          return this.saveEvidence();
        });
      });
    });
  }

  assertState(device, action, timeout) {
    this.powerToggle(device.eui, timeout).should(($toggle) => {
      expect($toggle.attr('aria-busy'), 'command tidak lagi pending').to.eq('false');
      expect($toggle.attr('aria-checked'), `status UI ${action}`).to.eq(String(action === 'on'));
      expect($toggle.text().trim()).to.eq(action === 'on' ? 'On' : 'Off');
    });
    return this.readDevice(device.eui).then((current) => {
      expect(current).to.include({ id: device.id, eui: device.eui, status: action, roomId: null });
      expect(current.pendingCommand, 'backend tidak memiliki command pending').to.eq(null);
      return current;
    });
  }

  restoreInitialOn(device) {
    this.devicesPage.visit();
    this.powerToggle(device.eui, this.commandTimeout(this.lastCommand)).should(
      'have.attr',
      'aria-busy',
      'false'
    );
    return this.readDevice(device.eui).then((current) => {
      this.evidence.restorationObserved = current;
      return this.saveEvidence().then(() => {
        expect(current.pendingCommand, 'tidak mengirim ulang command yang masih pending').to.eq(
          null
        );
        if (current.status === 'off') {
          expect(current.isOnline, 'Device online untuk pemulihan').to.eq(true);
          return this.changeState(device, 'on', 'cleanup').then(() => this.recordRestored());
        }
        expect(current.status, 'status awal On dipulihkan').to.eq('on');
        return this.recordRestored();
      });
    });
  }

  recordRestored() {
    this.evidence.restoredToInitialOn = true;
    return this.saveEvidence();
  }

  saveEvidence() {
    return cy.writeFile(
      this.artifactPath,
      { ...this.evidence, requests: this.requests },
      { log: false }
    );
  }
}
