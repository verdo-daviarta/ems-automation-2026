import { randomUUID } from 'node:crypto';
import { test, expect } from '../../fixtures/ems';

test('[TS-003] [CROSS-SEC] API: credential salah dan akun tidak dikenal memberi pesan umum yang sama', async ({ request, settings }) => {
  const api = settings.contract.api;
  test.skip(!api.enabled, 'Kontrak API belum dikonfigurasi; ini Not Run, bukan Pass.');
  const email = settings.credentials[settings.roles[0]].email;
  const invalidPassword = `Invalid!${randomUUID()}`;
  const url = `${settings.apiBaseURL}${api.loginPath}`;
  const known = await request.post(url, { data: { [api.emailField]: email, [api.passwordField]: invalidPassword } });
  const unknown = await request.post(url, { data: { [api.emailField]: `missing-${randomUUID()}@example.invalid`, [api.passwordField]: invalidPassword } });
  expect(known.status()).toBe(api.invalidAuthStatus);
  expect(unknown.status()).toBe(api.invalidAuthStatus);
  const knownBody = await known.json();
  const unknownBody = await unknown.json();
  expect(typeof knownBody[api.messageField]).toBe('string');
  expect(knownBody[api.messageField].length).toBeGreaterThan(0);
  expect(unknownBody[api.messageField]).toBe(knownBody[api.messageField]);
  expect(knownBody[api.messageField]).not.toContain(email);
  // Bukan pembuktian timing side channel; hanya status dan pesan API.
});
