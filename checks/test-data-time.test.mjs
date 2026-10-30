import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTestTimestamp } from '../cypress/support/testDataTime.js';
import { getLatestTestRoomName } from '../cypress/support/latestTestRoom.js';

test('timestamp nama data uji menggunakan ddMMyyyy-HHmmss dalam WIB', () => {
  assert.equal(formatTestTimestamp(1792055691747), '15102026-161451');
});

test('tanggal dan waktu satu digit menggunakan leading zero', () => {
  assert.equal(formatTestTimestamp(Date.parse('2026-01-01T18:04:05Z')), '02012026-010405');
});

test('tengah malam WIB menggunakan 00 dan mengikuti pergantian tahun', () => {
  assert.equal(formatTestTimestamp(Date.parse('2026-12-31T17:00:00Z')), '01012027-000000');
});

const roomPrefix = 'QA-TS025-admin-';
const roomName = (timestamp) => `${roomPrefix}${timestamp}`;

test('Room terbaru ditentukan dari waktu, bukan posisi dropdown', () => {
  assert.equal(
    getLatestTestRoomName(
      [roomName('30102026-090000'), roomName('30102026-170000'), roomName('30102026-120000')],
      roomPrefix
    ),
    roomName('30102026-170000')
  );
});

test('Room terbaru tetap benar saat berganti bulan', () => {
  assert.equal(
    getLatestTestRoomName([roomName('31102026-235959'), roomName('01112026-000001')], roomPrefix),
    roomName('01112026-000001')
  );
});

test('Room terbaru tetap benar saat berganti tahun', () => {
  assert.equal(
    getLatestTestRoomName([roomName('31122025-235959'), roomName('01012026-000001')], roomPrefix),
    roomName('01012026-000001')
  );
});

test('Room format lama dan WIB dibandingkan pada waktu yang sama', () => {
  const legacy = roomName(Date.parse('2026-10-30T07:00:00Z'));
  assert.equal(getLatestTestRoomName([roomName('30102026-135959'), legacy], roomPrefix), legacy);
  assert.equal(
    getLatestTestRoomName([legacy, roomName('30102026-140001')], roomPrefix),
    roomName('30102026-140001')
  );
});

test('Room lain dan timestamp yang tidak valid tidak dipilih', () => {
  assert.equal(
    getLatestTestRoomName(
      [
        'SD 2',
        'QA-TS009-admin-01012099-000000',
        roomName('30022026-120000'),
        roomName('30102026-120000')
      ],
      roomPrefix
    ),
    roomName('30102026-120000')
  );
});

test('tidak memakai fallback jika Room hasil TS-025 tidak tersedia', () => {
  assert.throws(() => getLatestTestRoomName(['SD 2'], roomPrefix), /Room hasil TS-025/);
});
