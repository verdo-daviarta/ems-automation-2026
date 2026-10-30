import { DashboardPage } from '../../pages/dashboard/DashboardPage.js';
import { DevicesPage } from '../../pages/devices/DevicesPage.js';
import { qa } from '../../support/settings.js';

describe('EMS edit Device room @devices', () => {
  const { target, roles } = qa();
  const scenario = target === 'staging' ? it : it.skip;
  const devicesPage = new DevicesPage();

  afterEach(function () {
    if (this.deviceToRestore) {
      devicesPage.restoreUnassignedDevice(this.deviceToRestore);
    }
  });

  scenario('[FEAT-065] [TS-033] Admin memilih Room untuk Device tanpa mengubah EUI', () => {
    expect(roles).to.include('admin');

    devicesPage.trackConnection();
    cy.loginAs('admin');
    new DashboardPage().assertReady();
    devicesPage.openFromMenu();
    devicesPage.openUnassignedDevice();

    cy.fixture('devices/edit-device').then(({ roomNamePrefix, gatewayName }) => {
      expect(roomNamePrefix, 'prefix Room hasil Create Room').to.be.a('string').and.not.be.empty;
      expect(gatewayName, 'gateway tujuan').to.be.a('string').and.not.be.empty;
      devicesPage.form.then(($form) => {
        const original = {
          eui: $form.find('[name="eui"]').val(),
          name: $form.find('[name="name"]').val(),
          gatewayId: $form.find('[name="gatewayId"]').val(),
          roomId: $form.find('[name="roomId"]').val()
        };
        expect(original.roomId, 'Device awal belum memiliki Room').to.eq('');
        expect(original.eui, 'EUI Device uji').to.be.a('string').and.not.be.empty;
        devicesPage.euiInput.should('be.disabled').and('have.value', original.eui);

        const gatewayId = $form
          .find('[name="gatewayId"] option')
          .filter((_, option) => option.text === gatewayName)
          .val();
        expect(gatewayId, `ID gateway ${gatewayName}`).to.be.a('string').and.not.be.empty;
        devicesPage.gatewayDropdown.select(gatewayName).should('have.value', gatewayId);
        devicesPage.gatewayDropdown.find('option:selected').should('have.text', gatewayName);

        devicesPage.selectCreatedRoom(roomNamePrefix).then((room) => {
          cy.log(`Device uji: ${original.name}; Room: ${room.name}`);
          devicesPage.roomDropdown.find('option:selected').should('have.text', room.name);
          cy.wrap({
            eui: original.eui,
            assignedRoomId: room.id,
            assignedGatewayId: gatewayId,
            originalGatewayId: original.gatewayId
          }).as('deviceToRestore');

          devicesPage.update().then(({ request, response }) => {
            expect(response.statusCode, 'Update Device berhasil').to.eq(200);
            expect(request.body).to.deep.eq({
              name: original.name,
              gatewayId,
              roomId: room.id
            });
          });
          devicesPage.dialog.should('not.exist');
          devicesPage.deviceRow(original.eui).should('contain.text', room.name);

          devicesPage.reload();
          devicesPage.openDevice(original.eui);
          devicesPage.euiInput.should('be.disabled').and('have.value', original.eui);
          devicesPage.roomDropdown.should('have.value', room.id);
          devicesPage.roomDropdown.find('option:selected').should('have.text', room.name);
          devicesPage.form.find('[name="name"]').should('have.value', original.name);
          devicesPage.gatewayDropdown.should('have.value', gatewayId);
          devicesPage.gatewayDropdown.find('option:selected').should('have.text', gatewayName);
          devicesPage.dialog.contains('button', /^Cancel$/).click();
        });
      });
    });
  });
});
