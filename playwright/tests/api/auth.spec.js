import { randomUUID } from 'node:crypto';
import { test, expect } from '../../fixtures/ems.js';

test('[TS-003] [CROSS-SEC] API: credential salah dan akun tidak dikenal memberi pesan umum yang sama', async ({
  request,
  settings
}) => {
  const api = settings.contract.api;
  test.skip(!api.enabled, 'Kontrak API belum dikonfigurasi; ini Not Run, bukan Pass.');

  const email = settings.credentials[settings.roles[0]].email;
  const invalidPassword = `Invalid!${randomUUID()}`;
  const url = `${settings.apiBaseURL}${api.loginPath}`;

  const knownAccountResponse = await request.post(url, {
    data: { [api.emailField]: email, [api.passwordField]: invalidPassword }
  });
  const unknownAccountResponse = await request.post(url, {
    data: {
      [api.emailField]: `missing-${randomUUID()}@example.invalid`,
      [api.passwordField]: invalidPassword
    }
  });

  expect(knownAccountResponse.status()).toBe(api.invalidAuthStatus);
  expect(unknownAccountResponse.status()).toBe(api.invalidAuthStatus);

  const knownBody = await knownAccountResponse.json();
  const unknownBody = await unknownAccountResponse.json();
  expect(typeof knownBody[api.messageField]).toBe('string');
  expect(knownBody[api.messageField].length).toBeGreaterThan(0);
  expect(unknownBody[api.messageField]).toBe(knownBody[api.messageField]);
  expect(knownBody[api.messageField]).not.toContain(email);
  // Bukan pembuktian timing side channel; hanya status dan pesan API.
});
